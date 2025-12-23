-- =====================================================
-- GAMIFICATION SYSTEM MIGRATION
-- Created: 2025-12-22 07:32:26
-- Purpose: EXP tracking, badges, achievements, activity feed
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Experience Points Tracking Table
CREATE TABLE IF NOT EXISTS public.user_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_exp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    exp_to_next_level INTEGER NOT NULL DEFAULT 100,
    total_exp_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_experience UNIQUE(user_id)
);

-- Badges/Achievements Table
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255),
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
    exp_reward INTEGER DEFAULT 0,
    requirements JSONB, -- Flexible requirements storage
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_badge_name UNIQUE(name)
);

-- User Earned Badges Table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 100, -- Percentage completion
    is_displayed BOOLEAN DEFAULT true, -- Show on profile
    CONSTRAINT unique_user_badge UNIQUE(user_id, badge_id)
);

-- Activity Feed Table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'challenge_join', 'design_upload', 'vote_cast', 'badge_earned', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB, -- Flexible data storage (challenge_id, design_id, etc.)
    exp_gained INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit Balance Table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    lifetime_earned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    lifetime_spent DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_credits UNIQUE(user_id)
);

-- Credit Transactions Table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('earn', 'spend', 'refund')) NOT NULL,
    source VARCHAR(100), -- 'challenge_win', 'design_vote', 'purchase', etc.
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_experience_user_id ON public.user_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.user_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- User Experience Policies
CREATE POLICY "Users can view their own experience"
    ON public.user_experience FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' experience"
    ON public.user_experience FOR SELECT
    USING (true);

-- Badges Policies (Public read for all badges)
CREATE POLICY "Anyone can view badges"
    ON public.badges FOR SELECT
    USING (is_active = true);

-- User Badges Policies
CREATE POLICY "Users can view their own badges"
    ON public.user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public badges"
    ON public.user_badges FOR SELECT
    USING (is_displayed = true);

-- User Activities Policies
CREATE POLICY "Users can view their own activities"
    ON public.user_activities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view public activities"
    ON public.user_activities FOR SELECT
    USING (is_public = true);

CREATE POLICY "Users can create their own activities"
    ON public.user_activities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User Credits Policies
CREATE POLICY "Users can view their own credits"
    ON public.user_credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own credit transactions"
    ON public.credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to add EXP and level up
CREATE OR REPLACE FUNCTION public.add_user_exp(
    p_user_id UUID,
    p_exp_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_user_exp RECORD;
    v_new_level INTEGER;
    v_leveled_up BOOLEAN := false;
BEGIN
    -- Get current user experience
    SELECT * INTO v_user_exp FROM public.user_experience WHERE user_id = p_user_id;
    
    -- Initialize if not exists
    IF v_user_exp IS NULL THEN
        INSERT INTO public.user_experience (user_id, current_exp, level, exp_to_next_level, total_exp_earned)
        VALUES (p_user_id, 0, 1, 100, 0)
        RETURNING * INTO v_user_exp;
    END IF;
    
    -- Add EXP
    v_user_exp.current_exp := v_user_exp.current_exp + p_exp_amount;
    v_user_exp.total_exp_earned := v_user_exp.total_exp_earned + p_exp_amount;
    
    -- Check for level up
    WHILE v_user_exp.current_exp >= v_user_exp.exp_to_next_level LOOP
        v_user_exp.current_exp := v_user_exp.current_exp - v_user_exp.exp_to_next_level;
        v_user_exp.level := v_user_exp.level + 1;
        v_user_exp.exp_to_next_level := FLOOR(v_user_exp.exp_to_next_level * 1.5); -- 50% increase per level
        v_leveled_up := true;
    END LOOP;
    
    -- Update database
    UPDATE public.user_experience
    SET current_exp = v_user_exp.current_exp,
        level = v_user_exp.level,
        exp_to_next_level = v_user_exp.exp_to_next_level,
        total_exp_earned = v_user_exp.total_exp_earned,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Return result
    RETURN jsonb_build_object(
        'level', v_user_exp.level,
        'current_exp', v_user_exp.current_exp,
        'exp_to_next_level', v_user_exp.exp_to_next_level,
        'leveled_up', v_leveled_up
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award badge to user
CREATE OR REPLACE FUNCTION public.award_badge(
    p_user_id UUID,
    p_badge_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_badge RECORD;
    v_already_earned BOOLEAN;
BEGIN
    -- Check if badge exists
    SELECT * INTO v_badge FROM public.badges WHERE id = p_badge_id AND is_active = true;
    IF v_badge IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if already earned
    SELECT EXISTS(
        SELECT 1 FROM public.user_badges 
        WHERE user_id = p_user_id AND badge_id = p_badge_id
    ) INTO v_already_earned;
    
    IF v_already_earned THEN
        RETURN false;
    END IF;
    
    -- Award badge
    INSERT INTO public.user_badges (user_id, badge_id, progress)
    VALUES (p_user_id, p_badge_id, 100);
    
    -- Add EXP reward
    IF v_badge.exp_reward > 0 THEN
        PERFORM public.add_user_exp(p_user_id, v_badge.exp_reward);
    END IF;
    
    -- Create activity
    INSERT INTO public.user_activities (
        user_id,
        activity_type,
        title,
        description,
        metadata,
        exp_gained,
        is_public
    ) VALUES (
        p_user_id,
        'badge_earned',
        'Badge Unlocked!',
        'Earned: ' || v_badge.name,
        jsonb_build_object('badge_id', p_badge_id, 'badge_name', v_badge.name),
        v_badge.exp_reward,
        true
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_user_credits(
    p_user_id UUID,
    p_amount DECIMAL,
    p_source VARCHAR,
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Initialize credits if not exists
    INSERT INTO public.user_credits (user_id, balance, lifetime_earned)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update balance
    UPDATE public.user_credits
    SET balance = balance + p_amount,
        lifetime_earned = lifetime_earned + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        transaction_type,
        source,
        description
    ) VALUES (
        p_user_id,
        p_amount,
        'earn',
        p_source,
        p_description
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to spend credits
CREATE OR REPLACE FUNCTION public.spend_user_credits(
    p_user_id UUID,
    p_amount DECIMAL,
    p_source VARCHAR,
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_balance DECIMAL;
BEGIN
    -- Get current balance
    SELECT balance INTO v_current_balance FROM public.user_credits WHERE user_id = p_user_id;
    
    IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RETURN false;
    END IF;
    
    -- Update balance
    UPDATE public.user_credits
    SET balance = balance - p_amount,
        lifetime_spent = lifetime_spent + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Record transaction
    INSERT INTO public.credit_transactions (
        user_id,
        amount,
        transaction_type,
        source,
        description
    ) VALUES (
        p_user_id,
        -p_amount,
        'spend',
        p_source,
        p_description
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to create user experience on profile creation
CREATE OR REPLACE FUNCTION public.create_user_experience_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_experience (user_id, current_exp, level, exp_to_next_level, total_exp_earned)
    VALUES (NEW.id, 0, 1, 100, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_experience
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_experience_on_signup();

-- Trigger to create user credits on profile creation
CREATE OR REPLACE FUNCTION public.create_user_credits_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_credits (user_id, balance, lifetime_earned, lifetime_spent)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_credits_on_signup();

-- =====================================================
-- INITIAL DATA - STARTER BADGES
-- =====================================================

DO $$
BEGIN
    -- Welcome Badge
    INSERT INTO public.badges (name, description, icon, rarity, exp_reward)
    VALUES 
        ('Welcome Aboard', 'Successfully completed profile setup and joined the community', '🎉', 'common', 50),
        ('First Vote', 'Cast your first design vote', '🗳️', 'common', 25),
        ('Design Pioneer', 'Uploaded your first design to the platform', '🎨', 'rare', 100),
        ('Challenge Accepted', 'Participated in your first community challenge', '⚡', 'rare', 75),
        ('Social Butterfly', 'Followed 10 designers', '🦋', 'common', 30),
        ('Vote Master', 'Cast 100 votes on designs', '👑', 'epic', 250),
        ('Rising Star', 'Reached Level 10', '⭐', 'epic', 500),
        ('Design Legend', 'Had 5 designs reach production', '🏆', 'legendary', 1000),
        ('Community Leader', 'Won 3 community challenges', '🔥', 'legendary', 750)
    ON CONFLICT (name) DO NOTHING;
END $$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;