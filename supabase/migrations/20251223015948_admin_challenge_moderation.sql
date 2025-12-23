-- Admin Challenge Moderation System Migration
-- Created: 2025-12-23 01:59:48
-- Purpose: Add admin moderation capabilities, IP tracking, risk analysis, and flagging systems

-- Create enum for moderation actions
CREATE TYPE moderation_action_type AS ENUM (
  'approved',
  'rejected',
  'flagged',
  'under_review',
  'escalated'
);

-- Create enum for risk levels
CREATE TYPE risk_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Add moderation fields to community_challenges table
ALTER TABLE community_challenges
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES user_profiles(id),
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level risk_level DEFAULT 'low',
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS flagged_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_flagged BOOLEAN DEFAULT false;

-- Create challenge_moderation_logs table
CREATE TABLE IF NOT EXISTS challenge_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES user_profiles(id),
  action moderation_action_type NOT NULL,
  notes TEXT,
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create challenge_flags table for community reports
CREATE TABLE IF NOT EXISTS challenge_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES user_profiles(id),
  reason TEXT NOT NULL,
  description TEXT,
  severity risk_level DEFAULT 'low',
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ip_risk_analysis table with unique constraint on ip_address
CREATE TABLE IF NOT EXISTS ip_risk_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  submission_count INTEGER DEFAULT 1,
  duplicate_content_count INTEGER DEFAULT 0,
  suspicious_patterns JSONB DEFAULT '[]'::jsonb,
  risk_score INTEGER DEFAULT 0,
  risk_level risk_level DEFAULT 'low',
  blocked BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create moderation_statistics table with unique constraint on date
CREATE TABLE IF NOT EXISTS moderation_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE UNIQUE,
  total_reviewed INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  flagged_count INTEGER DEFAULT 0,
  average_review_time_minutes INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_challenges_moderation_status ON community_challenges(moderation_status);
CREATE INDEX IF NOT EXISTS idx_community_challenges_risk_level ON community_challenges(risk_level);
CREATE INDEX IF NOT EXISTS idx_community_challenges_ip_address ON community_challenges(ip_address);
CREATE INDEX IF NOT EXISTS idx_challenge_moderation_logs_challenge_id ON challenge_moderation_logs(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_flags_challenge_id ON challenge_flags(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_flags_reviewed ON challenge_flags(reviewed);
CREATE INDEX IF NOT EXISTS idx_ip_risk_analysis_ip ON ip_risk_analysis(ip_address);

-- Function to update IP risk analysis
CREATE OR REPLACE FUNCTION update_ip_risk_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert IP risk data
  INSERT INTO ip_risk_analysis (ip_address, submission_count, last_seen_at)
  VALUES (NEW.ip_address, 1, NOW())
  ON CONFLICT (ip_address) DO UPDATE
  SET 
    submission_count = ip_risk_analysis.submission_count + 1,
    last_seen_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track IP submissions
CREATE TRIGGER track_ip_submissions
  AFTER INSERT ON community_challenges
  FOR EACH ROW
  WHEN (NEW.ip_address IS NOT NULL)
  EXECUTE FUNCTION update_ip_risk_analysis();

-- Function to auto-flag suspicious content
CREATE OR REPLACE FUNCTION check_auto_flag_challenge()
RETURNS TRIGGER AS $$
DECLARE
  ip_submission_count INTEGER;
  duplicate_count INTEGER;
BEGIN
  -- Check IP submission frequency
  SELECT submission_count INTO ip_submission_count
  FROM ip_risk_analysis
  WHERE ip_address = NEW.ip_address;
  
  -- Check for duplicate content (simplified check)
  SELECT COUNT(*) INTO duplicate_count
  FROM community_challenges
  WHERE title ILIKE NEW.title
    AND id != NEW.id
    AND created_at > NOW() - INTERVAL '7 days';
  
  -- Auto-flag if suspicious patterns detected
  IF ip_submission_count > 5 OR duplicate_count > 0 THEN
    NEW.auto_flagged := true;
    NEW.risk_score := 50 + (ip_submission_count * 10) + (duplicate_count * 20);
    
    IF NEW.risk_score > 80 THEN
      NEW.risk_level := 'critical';
    ELSIF NEW.risk_score > 60 THEN
      NEW.risk_level := 'high';
    ELSIF NEW.risk_score > 40 THEN
      NEW.risk_level := 'medium';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-flagging
CREATE TRIGGER auto_flag_suspicious_challenges
  BEFORE INSERT OR UPDATE ON community_challenges
  FOR EACH ROW
  EXECUTE FUNCTION check_auto_flag_challenge();

-- Function to log moderation actions
CREATE OR REPLACE FUNCTION log_moderation_action()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.moderation_status != OLD.moderation_status OR OLD.moderation_status IS NULL THEN
    INSERT INTO challenge_moderation_logs (
      challenge_id,
      moderator_id,
      action,
      notes,
      previous_status,
      new_status
    ) VALUES (
      NEW.id,
      NEW.moderated_by,
      NEW.moderation_status::moderation_action_type,
      NEW.moderation_notes,
      OLD.moderation_status,
      NEW.moderation_status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for logging moderation
CREATE TRIGGER log_challenge_moderation
  AFTER UPDATE ON community_challenges
  FOR EACH ROW
  WHEN (NEW.moderation_status IS DISTINCT FROM OLD.moderation_status)
  EXECUTE FUNCTION log_moderation_action();

-- Function to update moderation statistics
CREATE OR REPLACE FUNCTION update_moderation_stats()
RETURNS void AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  INSERT INTO moderation_statistics (
    date,
    total_reviewed,
    approved_count,
    rejected_count,
    flagged_count,
    pending_count
  )
  SELECT
    today_date,
    COUNT(*) FILTER (WHERE moderation_status IN ('approved', 'rejected', 'flagged')),
    COUNT(*) FILTER (WHERE moderation_status = 'approved'),
    COUNT(*) FILTER (WHERE moderation_status = 'rejected'),
    COUNT(*) FILTER (WHERE moderation_status = 'flagged'),
    COUNT(*) FILTER (WHERE moderation_status = 'pending')
  FROM community_challenges
  WHERE DATE(moderated_at) = today_date OR moderation_status = 'pending'
  ON CONFLICT (date) DO UPDATE
  SET
    total_reviewed = EXCLUDED.total_reviewed,
    approved_count = EXCLUDED.approved_count,
    rejected_count = EXCLUDED.rejected_count,
    flagged_count = EXCLUDED.flagged_count,
    pending_count = EXCLUDED.pending_count;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE challenge_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_risk_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_statistics ENABLE ROW LEVEL SECURITY;

-- Admin-only access for moderation logs
CREATE POLICY "Admins can view all moderation logs"
  ON challenge_moderation_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert moderation logs"
  ON challenge_moderation_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- Flag submission policies
CREATE POLICY "Users can submit flags"
  ON challenge_flags FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own flags"
  ON challenge_flags FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all flags"
  ON challenge_flags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update flags"
  ON challenge_flags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- IP risk analysis policies (admin-only)
CREATE POLICY "Admins can view IP analysis"
  ON ip_risk_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update IP analysis"
  ON ip_risk_analysis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- Moderation statistics policies (admin-only)
CREATE POLICY "Admins can view moderation stats"
  ON moderation_statistics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON challenge_moderation_logs TO authenticated;
GRANT ALL ON challenge_flags TO authenticated;
GRANT ALL ON ip_risk_analysis TO authenticated;
GRANT ALL ON moderation_statistics TO authenticated;

-- Insert initial moderation statistics
INSERT INTO moderation_statistics (date) VALUES (CURRENT_DATE)
ON CONFLICT (date) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Admin challenge moderation system migration completed successfully';
END $$;