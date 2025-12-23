-- Location: supabase/migrations/20251223023426_calculate_tier_function.sql
-- Schema Analysis: Existing tables include design_submissions with tiered_pricing_data (jsonb) and current_active_tier (integer)
-- Integration Type: Addition - New utility function for tier calculation
-- Dependencies: Designed to work with existing design_submissions.tiered_pricing_data structure

-- PostgreSQL function to calculate current tier based on preorder count
-- Implements tiered pricing logic from spec section 3.D.4

CREATE OR REPLACE FUNCTION public.calculate_current_tier(
    preorder_count INTEGER,
    tier_data JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    tier_array JSONB;
    tier_item JSONB;
    tier_number INTEGER;
    range_low INTEGER;
    range_high INTEGER;
    highest_tier INTEGER := 1;
    highest_tier_low INTEGER := 0;
BEGIN
    -- Error handling: Check if tier_data is null
    IF tier_data IS NULL THEN
        RAISE NOTICE 'tier_data is NULL, returning default tier 1';
        RETURN 1;
    END IF;

    -- Error handling: Check if tier_data is a valid JSON array
    IF jsonb_typeof(tier_data) != 'array' THEN
        RAISE NOTICE 'tier_data is not a valid JSON array, returning default tier 1';
        RETURN 1;
    END IF;

    -- Error handling: Check if tier_data array is empty
    IF jsonb_array_length(tier_data) = 0 THEN
        RAISE NOTICE 'tier_data array is empty, returning default tier 1';
        RETURN 1;
    END IF;

    -- Iterate through tier_data array to find matching tier
    FOR tier_item IN SELECT * FROM jsonb_array_elements(tier_data)
    LOOP
        -- Extract tier information from each item
        BEGIN
            tier_number := (tier_item->>'tier')::INTEGER;
            range_low := (tier_item->>'range_low')::INTEGER;
            range_high := (tier_item->>'range_high')::INTEGER;
            
            -- Track highest tier for fallback logic
            IF range_low > highest_tier_low THEN
                highest_tier_low := range_low;
                highest_tier := tier_number;
            END IF;

            -- Check if preorder_count falls within this tier's range
            IF preorder_count >= range_low AND preorder_count <= range_high THEN
                RETURN tier_number;
            END IF;

        EXCEPTION
            WHEN OTHERS THEN
                -- Log error and continue to next tier
                RAISE NOTICE 'Error processing tier item: %. Skipping this tier.', tier_item;
                CONTINUE;
        END;
    END LOOP;

    -- If no exact match found, check if preorder_count exceeds highest tier threshold
    -- Return highest tier where preorder_count >= range_low
    IF preorder_count >= highest_tier_low THEN
        RETURN highest_tier;
    END IF;

    -- Default fallback: return tier 1 if no match found
    RETURN 1;

EXCEPTION
    WHEN OTHERS THEN
        -- Catch-all error handler
        RAISE NOTICE 'Unexpected error in calculate_current_tier: %', SQLERRM;
        RETURN 1;
END;
$$;

-- Add comment describing the function
COMMENT ON FUNCTION public.calculate_current_tier(INTEGER, JSONB) IS 
'Calculates the current tier number based on preorder count and tier pricing data.
Parameters:
- preorder_count: Number of preorders for a design
- tier_data: JSONB array with format [{tier:1, range_low:100, range_high:199,...}]
Returns: Integer representing the current tier number (defaults to 1 if no match or on error)
Logic: 
1. Finds first tier where preorder_count is between range_low and range_high
2. If no exact match, returns highest tier where preorder_count >= range_low
3. Returns tier 1 as default fallback';