-- Location: supabase/migrations/20251223023208_extend_preorders_table.sql
-- Schema Analysis: Extending existing pre_orders table with spec-compliant fields
-- Integration Type: MODIFICATIVE (table alteration)
-- Dependencies: user_profiles, design_submissions (existing tables)

-- 1. Create preorder_status ENUM type
CREATE TYPE public.preorder_status AS ENUM ('reserved', 'charged', 'refunded', 'shipped');

-- 2. Add missing columns to pre_orders table
ALTER TABLE public.pre_orders
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC,
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS refund_credit_issued BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- 3. Convert status column from TEXT to ENUM
-- First, update existing data to match enum values (map 'pending' to 'reserved')
UPDATE public.pre_orders 
SET status = 'reserved' 
WHERE status = 'pending' OR status IS NULL;

-- Now alter the column type
ALTER TABLE public.pre_orders
ALTER COLUMN status DROP DEFAULT,
ALTER COLUMN status TYPE public.preorder_status USING status::public.preorder_status,
ALTER COLUMN status SET DEFAULT 'reserved'::public.preorder_status;

-- 4. Drop existing foreign key constraints and recreate with CASCADE
ALTER TABLE public.pre_orders
DROP CONSTRAINT IF EXISTS pre_orders_user_id_fkey,
DROP CONSTRAINT IF EXISTS pre_orders_design_id_fkey;

-- Recreate foreign keys with CASCADE delete
ALTER TABLE public.pre_orders
ADD CONSTRAINT pre_orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT pre_orders_design_id_fkey 
    FOREIGN KEY (design_id) REFERENCES public.design_submissions(id) ON DELETE CASCADE;

-- 5. Create function for designer access to preorders
CREATE OR REPLACE FUNCTION public.can_view_design_preorders(preorder_design_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.design_submissions ds
    WHERE ds.id = preorder_design_id 
    AND ds.designer_id = auth.uid()
)
$$;

-- 6. Add RLS policy for designers to view preorders for their designs
CREATE POLICY "designers_view_design_preorders"
ON public.pre_orders
FOR SELECT
TO authenticated
USING (public.can_view_design_preorders(design_id));

-- 7. Add mock data with new fields
DO $$
DECLARE
    existing_user_id UUID;
    existing_design_id UUID;
    new_preorder_id UUID := gen_random_uuid();
BEGIN
    -- Get existing user and design IDs
    SELECT id INTO existing_user_id FROM public.user_profiles WHERE role = 'consumer' LIMIT 1;
    SELECT id INTO existing_design_id FROM public.design_submissions WHERE submission_status = 'community_voting' LIMIT 1;

    -- Create sample preorder with all new fields
    IF existing_user_id IS NOT NULL AND existing_design_id IS NOT NULL THEN
        INSERT INTO public.pre_orders (
            id, user_id, design_id, size, quantity, amount_paid, 
            shipping_address, status, refund_credit_issued, 
            stripe_payment_intent_id, total_amount
        )
        VALUES (
            new_preorder_id,
            existing_user_id,
            existing_design_id,
            'L',
            2,
            49.99,
            '123 Main St, Apt 4B, New York, NY 10001',
            'reserved'::public.preorder_status,
            false,
            'pi_1234567890abcdef',
            49.99
        );
    END IF;
END $$;

-- 8. Comment on new columns for documentation
COMMENT ON COLUMN public.pre_orders.amount_paid IS 'Amount charged at Tier 1 price';
COMMENT ON COLUMN public.pre_orders.shipping_address IS 'Full shipping address for the preorder';
COMMENT ON COLUMN public.pre_orders.refund_credit_issued IS 'Whether refund credit has been issued for this preorder';
COMMENT ON COLUMN public.pre_orders.stripe_payment_intent_id IS 'Stripe payment intent ID for tracking payments';
COMMENT ON COLUMN public.pre_orders.status IS 'Current status: reserved, charged, refunded, or shipped';