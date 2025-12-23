-- Location: supabase/migrations/20251223024000_preorder_tier_update_trigger.sql
-- Schema Analysis: Existing design_submissions table with current_active_tier, potential_refund_per_unit, tiered_pricing_data columns
-- Integration Type: Adding automatic tier update trigger for preorder status changes
-- Dependencies: design_submissions, pre_orders tables, calculate_current_tier function

-- ==============================================================================
-- TRIGGER FUNCTION: update_design_tier_on_preorder_change
-- ==============================================================================
-- Automatically updates design_submissions.current_active_tier and 
-- potential_refund_per_unit whenever preorders are inserted with status='charged'
-- or status changes to/from 'charged'
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_design_tier_on_preorder_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_design_id UUID;
    v_charged_count INTEGER;
    v_tier_data JSONB;
    v_new_tier INTEGER;
    v_tier1_price NUMERIC;
    v_current_tier_price NUMERIC;
    v_refund_per_unit NUMERIC;
    v_tier_item JSONB;
BEGIN
    -- Determine which design_id to update based on operation
    IF TG_OP = 'DELETE' THEN
        v_design_id := OLD.design_id;
    ELSE
        v_design_id := NEW.design_id;
    END IF;

    -- Only proceed if status involves 'charged' state
    -- For INSERT: Check if NEW status is 'charged'
    -- For UPDATE: Check if status changed to or from 'charged'
    -- For DELETE: Check if OLD status was 'charged'
    IF (TG_OP = 'INSERT' AND NEW.status = 'charged'::public.preorder_status) OR
       (TG_OP = 'UPDATE' AND (NEW.status = 'charged'::public.preorder_status OR OLD.status = 'charged'::public.preorder_status)) OR
       (TG_OP = 'DELETE' AND OLD.status = 'charged'::public.preorder_status) THEN
        
        BEGIN
            -- Step 1: Count all preorders for this design with status='charged'
            SELECT COUNT(*)
            INTO v_charged_count
            FROM public.pre_orders po
            WHERE po.design_id = v_design_id 
            AND po.status = 'charged'::public.preorder_status;

            -- Step 2: Get tiered_pricing_data from design_submissions
            SELECT ds.tiered_pricing_data
            INTO v_tier_data
            FROM public.design_submissions ds
            WHERE ds.id = v_design_id;

            -- Validate tier_data exists
            IF v_tier_data IS NULL THEN
                RAISE NOTICE 'No tiered pricing data found for design_id: %. Skipping tier update.', v_design_id;
                RETURN COALESCE(NEW, OLD);
            END IF;

            -- Step 3: Calculate current tier using existing function
            v_new_tier := public.calculate_current_tier(v_charged_count, v_tier_data);

            -- Step 4: Extract tier 1 price from tiered_pricing_data
            -- Find the tier with tier number = 1
            SELECT tier_item->>'price'
            INTO v_tier1_price
            FROM jsonb_array_elements(v_tier_data) AS tier_item
            WHERE (tier_item->>'tier')::INTEGER = 1
            LIMIT 1;

            -- Step 5: Extract current tier price from tiered_pricing_data
            SELECT tier_item->>'price'
            INTO v_current_tier_price
            FROM jsonb_array_elements(v_tier_data) AS tier_item
            WHERE (tier_item->>'tier')::INTEGER = v_new_tier
            LIMIT 1;

            -- Step 6: Calculate potential_refund_per_unit
            -- Formula: tier1_price - current_tier_price
            IF v_tier1_price IS NOT NULL AND v_current_tier_price IS NOT NULL THEN
                v_refund_per_unit := v_tier1_price::NUMERIC - v_current_tier_price::NUMERIC;
                
                -- Ensure refund is not negative
                IF v_refund_per_unit < 0 THEN
                    v_refund_per_unit := 0;
                END IF;
            ELSE
                -- If pricing data is incomplete, set refund to 0
                v_refund_per_unit := 0;
                RAISE NOTICE 'Incomplete pricing data for design_id: %. Setting refund to 0.', v_design_id;
            END IF;

            -- Step 7: Update design_submissions with new values
            UPDATE public.design_submissions
            SET 
                current_active_tier = v_new_tier,
                potential_refund_per_unit = v_refund_per_unit,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_design_id;

            -- Log successful update
            RAISE NOTICE 'Updated design % - Tier: %, Charged Orders: %, Refund/Unit: %', 
                v_design_id, v_new_tier, v_charged_count, v_refund_per_unit;

        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but don't block the preorder operation
                RAISE WARNING 'Error updating tier for design %: %', v_design_id, SQLERRM;
                -- Return the record to allow preorder operation to continue
                RETURN COALESCE(NEW, OLD);
        END;
    END IF;

    -- Return appropriate record based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Catch-all error handler for trigger function
        RAISE WARNING 'Unexpected error in update_design_tier_on_preorder_change: %', SQLERRM;
        RETURN COALESCE(NEW, OLD);
END;
$func$;

-- ==============================================================================
-- TRIGGER: trigger_update_tier_on_preorder_insert
-- ==============================================================================
-- Fires AFTER INSERT on pre_orders when status='charged'
-- ==============================================================================

CREATE TRIGGER trigger_update_tier_on_preorder_insert
AFTER INSERT ON public.pre_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_design_tier_on_preorder_change();

-- ==============================================================================
-- TRIGGER: trigger_update_tier_on_preorder_update
-- ==============================================================================
-- Fires AFTER UPDATE on pre_orders when status changes to/from 'charged'
-- ==============================================================================

CREATE TRIGGER trigger_update_tier_on_preorder_update
AFTER UPDATE ON public.pre_orders
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION public.update_design_tier_on_preorder_change();

-- ==============================================================================
-- TRIGGER: trigger_update_tier_on_preorder_delete
-- ==============================================================================
-- Fires AFTER DELETE on pre_orders when deleted preorder had status='charged'
-- This ensures tier recalculation if a charged preorder is removed
-- ==============================================================================

CREATE TRIGGER trigger_update_tier_on_preorder_delete
AFTER DELETE ON public.pre_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_design_tier_on_preorder_change();

-- ==============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================================================

COMMENT ON FUNCTION public.update_design_tier_on_preorder_change() IS 
'Trigger function that automatically recalculates and updates design tier and refund amounts whenever preorder status changes to or from charged. Includes comprehensive error handling and transaction safety.';

COMMENT ON TRIGGER trigger_update_tier_on_preorder_insert ON public.pre_orders IS 
'Automatically updates design tier when new preorder is inserted with status=charged';

COMMENT ON TRIGGER trigger_update_tier_on_preorder_update ON public.pre_orders IS 
'Automatically updates design tier when preorder status changes to or from charged';

COMMENT ON TRIGGER trigger_update_tier_on_preorder_delete ON public.pre_orders IS 
'Automatically updates design tier when a charged preorder is deleted';