-- Location: supabase/migrations/20251223030609_designer_payout_system.sql
-- Schema Analysis: Extending existing design_submissions and user_profiles tables
-- Integration Type: MODIFICATIVE - Adding copyright model tracking and payout calculation
-- Dependencies: design_submissions, user_profiles, pre_orders, system_settings

-- ========================================
-- STEP 1: Add Missing Columns
-- ========================================

-- Add copyright_model to design_submissions
ALTER TABLE public.design_submissions
ADD COLUMN IF NOT EXISTS copyright_model TEXT DEFAULT 'Retained-12%'
CHECK (copyright_model IN ('Retained-12%', 'Sold-20%'));

-- Add quarterly_bonus_cap to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS quarterly_bonus_cap NUMERIC DEFAULT 5000.00;

-- Add index for copyright model queries
CREATE INDEX IF NOT EXISTS idx_design_submissions_copyright_model 
ON public.design_submissions(copyright_model);

-- ========================================
-- STEP 2: Create Designer Payout Function
-- ========================================

CREATE OR REPLACE FUNCTION public.calculate_designer_payout(design_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_designer_id UUID;
    v_copyright_model TEXT;
    v_preorder_count INTEGER;
    v_tiered_pricing_data JSONB;
    v_current_active_tier INTEGER;
    v_tier_price NUMERIC;
    v_supplier_cost NUMERIC;
    v_profit_per_unit NUMERIC;
    v_total_profit NUMERIC;
    v_royalty_rate NUMERIC;
    v_royalty NUMERIC;
    v_current_quarter_bonus NUMERIC;
    v_quarterly_bonus_cap NUMERIC;
    v_capped BOOLEAN := false;
    v_status TEXT := 'ready';
    v_message TEXT := 'Designer payout calculated successfully';
BEGIN
    -- Step 1: Get design data
    SELECT 
        ds.designer_id,
        ds.copyright_model,
        ds.tiered_pricing_data,
        ds.current_active_tier,
        COALESCE(
            (SELECT COUNT(*) FROM public.pre_orders po 
             WHERE po.design_id = design_uuid 
             AND po.status = 'charged'), 
            0
        )
    INTO 
        v_designer_id,
        v_copyright_model,
        v_tiered_pricing_data,
        v_current_active_tier,
        v_preorder_count
    FROM public.design_submissions ds
    WHERE ds.id = design_uuid 
    AND ds.submission_status = 'in_production';

    -- Validate design exists and is in correct status
    IF v_designer_id IS NULL THEN
        RETURN jsonb_build_object(
            'payout_amount', 0,
            'status', 'error',
            'message', 'Design not found or not in production status'
        );
    END IF;

    -- Check if there are any funded pre-orders
    IF v_preorder_count = 0 THEN
        RETURN jsonb_build_object(
            'payout_amount', 0,
            'status', 'no_funds',
            'message', 'No funded pre-orders for this design'
        );
    END IF;

    -- Step 2: Calculate total profit
    -- Extract current tier pricing data
    SELECT 
        CAST((tier_data->>'retail_price') AS NUMERIC),
        CAST((tier_data->>'supplier_cost') AS NUMERIC)
    INTO v_tier_price, v_supplier_cost
    FROM jsonb_array_elements(v_tiered_pricing_data) AS tier_data
    WHERE CAST(tier_data->>'tier' AS INTEGER) = v_current_active_tier
    LIMIT 1;

    -- Validate pricing data exists
    IF v_tier_price IS NULL OR v_supplier_cost IS NULL THEN
        RETURN jsonb_build_object(
            'payout_amount', 0,
            'status', 'error',
            'message', 'Invalid tier pricing data'
        );
    END IF;

    -- Calculate profit per unit and total profit
    v_profit_per_unit := v_tier_price - v_supplier_cost;
    v_total_profit := v_profit_per_unit * v_preorder_count;

    -- Step 3: Calculate designer royalty based on copyright model
    IF v_copyright_model = 'Retained-12%' THEN
        v_royalty_rate := 0.12;
    ELSIF v_copyright_model = 'Sold-20%' THEN
        v_royalty_rate := 0.20;
    ELSE
        v_royalty_rate := 0.12; -- Default fallback
    END IF;

    v_royalty := v_total_profit * v_royalty_rate;

    -- Step 4: Check quarterly bonus cap
    SELECT 
        up.current_quarter_bonus_earned,
        up.quarterly_bonus_cap
    INTO 
        v_current_quarter_bonus,
        v_quarterly_bonus_cap
    FROM public.user_profiles up
    WHERE up.id = v_designer_id;

    -- Apply cap if necessary
    IF (v_current_quarter_bonus + v_royalty) > v_quarterly_bonus_cap THEN
        v_royalty := GREATEST(0, v_quarterly_bonus_cap - v_current_quarter_bonus);
        v_capped := true;
        v_status := 'capped';
        v_message := 'Payout capped at quarterly bonus limit';
    END IF;

    -- Step 5: Return payout details
    RETURN jsonb_build_object(
        'payout_amount', ROUND(v_royalty, 2),
        'status', v_status,
        'message', v_message,
        'details', jsonb_build_object(
            'designer_id', v_designer_id,
            'copyright_model', v_copyright_model,
            'royalty_rate', v_royalty_rate,
            'preorder_count', v_preorder_count,
            'profit_per_unit', ROUND(v_profit_per_unit, 2),
            'total_profit', ROUND(v_total_profit, 2),
            'current_quarter_bonus', ROUND(v_current_quarter_bonus, 2),
            'quarterly_bonus_cap', ROUND(v_quarterly_bonus_cap, 2),
            'capped', v_capped
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'payout_amount', 0,
            'status', 'error',
            'message', 'Error calculating payout: ' || SQLERRM
        );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.calculate_designer_payout(UUID) IS 
'Calculates designer royalty payout based on tiered pricing, copyright model (12% or 20%), and quarterly bonus caps';

-- ========================================
-- STEP 3: Update Mock Data (Optional)
-- ========================================

-- Update existing designs with copyright model if they exist
DO $$
BEGIN
    -- Update sample designs with copyright models
    UPDATE public.design_submissions
    SET copyright_model = CASE 
        WHEN RANDOM() < 0.5 THEN 'Retained-12%'
        ELSE 'Sold-20%'
    END
    WHERE copyright_model IS NULL;

    -- Update designer profiles with quarterly bonus caps
    UPDATE public.user_profiles
    SET quarterly_bonus_cap = 5000.00
    WHERE role = 'designer' AND quarterly_bonus_cap IS NULL;

    RAISE NOTICE 'Designer payout system initialized successfully';
END $$;