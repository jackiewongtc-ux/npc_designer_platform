-- Location: supabase/migrations/20251222073000_community_challenges.sql
-- Schema Analysis: Extends existing NPC Designer Platform with community challenge functionality
-- Integration Type: Addition - New challenge system
-- Dependencies: user_profiles, design_submissions

-- 1. Custom Types
CREATE TYPE public.challenge_status AS ENUM ('draft', 'accepting_submissions', 'voting', 'completed', 'cancelled');
CREATE TYPE public.response_status AS ENUM ('pending', 'accepted', 'rejected', 'winner');

-- 2. Core Tables
CREATE TABLE public.community_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    image_alt TEXT,
    category public.design_category NOT NULL,
    reward_amount NUMERIC(10,2) DEFAULT 0,
    deadline TIMESTAMPTZ NOT NULL,
    submission_deadline TIMESTAMPTZ NOT NULL,
    voting_start_date TIMESTAMPTZ,
    voting_end_date TIMESTAMPTZ,
    status public.challenge_status DEFAULT 'draft'::public.challenge_status,
    is_featured BOOLEAN DEFAULT false,
    max_participants INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.challenge_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.community_challenges(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    design_submission_id UUID REFERENCES public.design_submissions(id) ON DELETE SET NULL,
    status public.response_status DEFAULT 'pending'::public.response_status,
    admin_notes TEXT,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(challenge_id, designer_id)
);

CREATE TABLE public.challenge_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.community_challenges(id) ON DELETE CASCADE,
    response_id UUID NOT NULL REFERENCES public.challenge_responses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    vote_value INTEGER CHECK (vote_value IN (1, -1)),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(response_id, user_id)
);

CREATE TABLE public.challenge_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.community_challenges(id) ON DELETE CASCADE,
    response_id UUID REFERENCES public.challenge_responses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.challenge_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Essential Indexes
CREATE INDEX idx_community_challenges_creator ON public.community_challenges(creator_id);
CREATE INDEX idx_community_challenges_status ON public.community_challenges(status);
CREATE INDEX idx_community_challenges_category ON public.community_challenges(category);
CREATE INDEX idx_community_challenges_deadline ON public.community_challenges(deadline);
CREATE INDEX idx_community_challenges_featured ON public.community_challenges(is_featured);

CREATE INDEX idx_challenge_responses_challenge ON public.challenge_responses(challenge_id);
CREATE INDEX idx_challenge_responses_designer ON public.challenge_responses(designer_id);
CREATE INDEX idx_challenge_responses_status ON public.challenge_responses(status);

CREATE INDEX idx_challenge_votes_challenge ON public.challenge_votes(challenge_id);
CREATE INDEX idx_challenge_votes_response ON public.challenge_votes(response_id);
CREATE INDEX idx_challenge_votes_user ON public.challenge_votes(user_id);

CREATE INDEX idx_challenge_comments_challenge ON public.challenge_comments(challenge_id);
CREATE INDEX idx_challenge_comments_response ON public.challenge_comments(response_id);
CREATE INDEX idx_challenge_comments_user ON public.challenge_comments(user_id);
CREATE INDEX idx_challenge_comments_parent ON public.challenge_comments(parent_comment_id);

-- 4. Functions (MUST BE BEFORE RLS POLICIES)
CREATE OR REPLACE FUNCTION public.update_challenge_participant_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_challenges
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.challenge_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_challenges
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.challenge_id;
    END IF;
    RETURN NULL;
END;
$func$;

-- 5. Enable RLS
ALTER TABLE public.community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_comments ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Pattern 4: Public Read, Private Write for challenges
CREATE POLICY "public_can_read_challenges"
ON public.community_challenges
FOR SELECT
TO public
USING (status IN ('accepting_submissions', 'voting', 'completed'));

CREATE POLICY "creators_manage_own_challenges"
ON public.community_challenges
FOR ALL
TO authenticated
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "admin_full_access_challenges"
ON public.community_challenges
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Pattern 2: Simple User Ownership for responses
CREATE POLICY "designers_manage_own_responses"
ON public.challenge_responses
FOR ALL
TO authenticated
USING (designer_id = auth.uid())
WITH CHECK (designer_id = auth.uid());

CREATE POLICY "public_can_read_accepted_responses"
ON public.challenge_responses
FOR SELECT
TO public
USING (status IN ('accepted', 'winner'));

CREATE POLICY "admin_full_access_responses"
ON public.challenge_responses
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Pattern 2: Simple User Ownership for votes
CREATE POLICY "users_manage_own_challenge_votes"
ON public.challenge_votes
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "public_can_read_challenge_votes"
ON public.challenge_votes
FOR SELECT
TO public
USING (true);

-- Pattern 2: Simple User Ownership for comments
CREATE POLICY "users_manage_own_challenge_comments"
ON public.challenge_comments
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "public_can_read_challenge_comments"
ON public.challenge_comments
FOR SELECT
TO public
USING (true);

CREATE POLICY "admin_full_access_comments"
ON public.challenge_comments
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 7. Triggers
CREATE TRIGGER set_community_challenges_updated_at
    BEFORE UPDATE ON public.community_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_challenge_responses_updated_at
    BEFORE UPDATE ON public.challenge_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_challenge_votes_updated_at
    BEFORE UPDATE ON public.challenge_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_challenge_comments_updated_at
    BEFORE UPDATE ON public.challenge_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_on_response_change
    AFTER INSERT OR DELETE ON public.challenge_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_challenge_participant_count();

-- 8. Mock Data
DO $$
DECLARE
    existing_user1_id UUID;
    existing_user2_id UUID;
    challenge1_id UUID := gen_random_uuid();
    challenge2_id UUID := gen_random_uuid();
    challenge3_id UUID := gen_random_uuid();
    response1_id UUID := gen_random_uuid();
    response2_id UUID := gen_random_uuid();
BEGIN
    -- Get existing users
    SELECT id INTO existing_user1_id FROM public.user_profiles WHERE role = 'admin' LIMIT 1;
    SELECT id INTO existing_user2_id FROM public.user_profiles WHERE role = 'designer' LIMIT 1;

    IF existing_user1_id IS NOT NULL AND existing_user2_id IS NOT NULL THEN
        -- Insert mock challenges
        INSERT INTO public.community_challenges (id, creator_id, title, description, image_url, image_alt, category, reward_amount, deadline, submission_deadline, status, is_featured) VALUES
            (challenge1_id, existing_user1_id, 'Sustainable Summer Collection 2025', 
             'Design eco-friendly summer apparel using sustainable materials and production methods. Focus on breathable fabrics, minimal waste patterns, and timeless designs that promote conscious fashion consumption.',
             'https://img.rocket.new/generatedImages/rocket_gen_img_17ec43db6-1764655133593.png',
             'Eco-friendly summer clothing collection displayed on wooden hangers against natural green background with sustainable fabric swatches',
             'apparel', 500.00, 
             CURRENT_TIMESTAMP + INTERVAL '12 days', 
             CURRENT_TIMESTAMP + INTERVAL '10 days', 
             'accepting_submissions', true),
            (challenge2_id, existing_user1_id, 'Urban Tech Streetwear Revolution',
             'Create innovative streetwear designs that blend technology with urban fashion. Incorporate smart fabrics, LED elements, or modular components that reflect the future of wearable tech in everyday street style.',
             'https://images.unsplash.com/photo-1510853851847-5c02796e8c8a',
             'Modern tech-inspired streetwear outfit featuring black jacket with LED accents worn by young person in urban city setting',
             'apparel', 750.00, 
             CURRENT_TIMESTAMP + INTERVAL '8 days', 
             CURRENT_TIMESTAMP + INTERVAL '5 days', 
             'voting', true),
            (challenge3_id, existing_user2_id, 'Minimalist Workwear Essentials',
             'Design versatile workwear pieces that transition seamlessly from office to casual settings with clean lines and neutral palettes.',
             'https://img.rocket.new/generatedImages/rocket_gen_img_183d112a2-1764672313381.png',
             'Professional minimalist workwear outfit with beige blazer and white shirt on mannequin in modern office environment',
             'apparel', 400.00, 
             CURRENT_TIMESTAMP + INTERVAL '15 days', 
             CURRENT_TIMESTAMP + INTERVAL '12 days', 
             'accepting_submissions', false);

        -- Insert mock responses
        INSERT INTO public.challenge_responses (id, challenge_id, designer_id, status) VALUES
            (response1_id, challenge2_id, existing_user2_id, 'accepted'),
            (response2_id, challenge1_id, existing_user2_id, 'pending');

        -- Insert mock votes
        INSERT INTO public.challenge_votes (challenge_id, response_id, user_id, vote_value) VALUES
            (challenge2_id, response1_id, existing_user1_id, 1);

        -- Insert mock comments
        INSERT INTO public.challenge_comments (challenge_id, user_id, content) VALUES
            (challenge1_id, existing_user1_id, 'This is an exciting challenge! Looking forward to seeing all the sustainable designs.'),
            (challenge2_id, existing_user2_id, 'Love the tech-fashion fusion concept. Already working on my submission!');
    END IF;
END $$;