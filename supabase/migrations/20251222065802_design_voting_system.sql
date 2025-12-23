-- Location: supabase/migrations/20251222065802_design_voting_system.sql
-- Schema Analysis: Existing design_submissions table has votes_count and voting_started_at
-- Integration Type: Extension - Adding individual vote tracking and pre-order functionality
-- Dependencies: design_submissions, user_profiles

-- 1. Create ENUM for vote types
CREATE TYPE public.vote_type AS ENUM ('upvote', 'downvote');

-- 2. Create design_votes table for individual vote tracking (voting history)
CREATE TABLE public.design_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID NOT NULL REFERENCES public.design_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    vote_type public.vote_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(design_id, user_id)
);

-- 3. Create pre_orders table for size/quantity selection
CREATE TABLE public.pre_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID NOT NULL REFERENCES public.design_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount DECIMAL(10, 2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create indexes
CREATE INDEX idx_design_votes_design_id ON public.design_votes(design_id);
CREATE INDEX idx_design_votes_user_id ON public.design_votes(user_id);
CREATE INDEX idx_design_votes_created_at ON public.design_votes(created_at);
CREATE INDEX idx_pre_orders_design_id ON public.pre_orders(design_id);
CREATE INDEX idx_pre_orders_user_id ON public.pre_orders(user_id);
CREATE INDEX idx_pre_orders_status ON public.pre_orders(status);

-- 5. Create function to update votes_count on design_submissions
CREATE OR REPLACE FUNCTION public.update_design_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.design_submissions
        SET votes_count = (
            SELECT COUNT(*) FROM public.design_votes
            WHERE design_id = NEW.design_id AND vote_type = 'upvote'
        ) - (
            SELECT COUNT(*) FROM public.design_votes
            WHERE design_id = NEW.design_id AND vote_type = 'downvote'
        )
        WHERE id = NEW.design_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.design_submissions
        SET votes_count = (
            SELECT COUNT(*) FROM public.design_votes
            WHERE design_id = OLD.design_id AND vote_type = 'upvote'
        ) - (
            SELECT COUNT(*) FROM public.design_votes
            WHERE design_id = OLD.design_id AND vote_type = 'downvote'
        )
        WHERE id = OLD.design_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- 6. Create trigger for automatic votes_count update
CREATE TRIGGER on_design_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON public.design_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_design_votes_count();

-- 7. Create trigger for updated_at
CREATE TRIGGER set_design_votes_updated_at
    BEFORE UPDATE ON public.design_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_pre_orders_updated_at
    BEFORE UPDATE ON public.pre_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Enable RLS
ALTER TABLE public.design_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for design_votes

-- Public can read all votes for designs
CREATE POLICY "public_can_read_design_votes"
ON public.design_votes
FOR SELECT
TO public
USING (true);

-- Users can manage their own votes
CREATE POLICY "users_manage_own_design_votes"
ON public.design_votes
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 10. RLS Policies for pre_orders

-- Users can read their own pre-orders
CREATE POLICY "users_can_read_own_pre_orders"
ON public.pre_orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own pre-orders
CREATE POLICY "users_can_create_own_pre_orders"
ON public.pre_orders
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own pre-orders
CREATE POLICY "users_can_update_own_pre_orders"
ON public.pre_orders
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can read all pre-orders
CREATE POLICY "admins_can_read_all_pre_orders"
ON public.pre_orders
FOR SELECT
TO authenticated
USING (public.is_admin_from_auth());

-- 11. Mock data for testing
DO $$
DECLARE
    existing_design_id UUID;
    existing_user_id UUID;
    second_user_id UUID;
BEGIN
    -- Get existing design and users
    SELECT id INTO existing_design_id FROM public.design_submissions WHERE submission_status = 'community_voting' LIMIT 1;
    SELECT id INTO existing_user_id FROM public.user_profiles LIMIT 1;
    SELECT id INTO second_user_id FROM public.user_profiles WHERE id != existing_user_id LIMIT 1;
    
    IF existing_design_id IS NOT NULL AND existing_user_id IS NOT NULL THEN
        -- Add some votes
        INSERT INTO public.design_votes (design_id, user_id, vote_type)
        VALUES
            (existing_design_id, existing_user_id, 'upvote');
            
        IF second_user_id IS NOT NULL THEN
            INSERT INTO public.design_votes (design_id, user_id, vote_type)
            VALUES
                (existing_design_id, second_user_id, 'upvote');
        END IF;
        
        -- Add a pre-order
        INSERT INTO public.pre_orders (design_id, user_id, size, quantity, total_amount, status)
        VALUES
            (existing_design_id, existing_user_id, 'M', 2, 59.98, 'pending');
    END IF;
END $$;