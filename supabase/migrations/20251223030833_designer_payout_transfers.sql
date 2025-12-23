-- Location: supabase/migrations/20251223030833_designer_payout_transfers.sql
-- Schema Analysis: Existing designer payout calculation function and user_profiles with stripe_connect_account_id
-- Integration Type: Addition - New payouts table + status tracking
-- Dependencies: user_profiles, design_submissions, calculate_designer_payout function

-- 1. Create payout status enum
CREATE TYPE public.payout_status AS ENUM ('pending', 'completed', 'failed');

-- 2. Create payouts table
CREATE TABLE public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID NOT NULL REFERENCES public.design_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    stripe_transfer_id TEXT,
    status public.payout_status DEFAULT 'pending'::public.payout_status,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes
CREATE INDEX idx_payouts_design_id ON public.payouts(design_id);
CREATE INDEX idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_created_at ON public.payouts(created_at);

-- 4. Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - Only designers and admins can view their own payouts
CREATE POLICY "designers_view_own_payouts"
ON public.payouts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin_full_access_payouts"
ON public.payouts
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 6. Trigger for updated_at
CREATE TRIGGER set_payouts_updated_at
    BEFORE UPDATE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Helper function to increment total_earnings safely
CREATE OR REPLACE FUNCTION public.increment_total_earnings(designer_user_id UUID, amount_to_add NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_total NUMERIC;
BEGIN
    UPDATE public.user_profiles
    SET total_earnings = COALESCE(total_earnings, 0) + amount_to_add
    WHERE id = designer_user_id
    RETURNING total_earnings INTO new_total;
    
    RETURN COALESCE(new_total, 0);
END;
$$;