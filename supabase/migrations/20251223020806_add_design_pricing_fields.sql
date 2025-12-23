-- Location: supabase/migrations/20251223020806_add_design_pricing_fields.sql
-- Schema Analysis: Extending existing design_submissions table
-- Integration Type: MODIFICATIVE - Adding columns to existing table
-- Dependencies: public.design_submissions (existing table)

-- Add new pricing and preorder fields to design_submissions table
ALTER TABLE public.design_submissions
ADD COLUMN tiered_pricing_data JSONB,
ADD COLUMN current_active_tier INTEGER,
ADD COLUMN potential_refund_per_unit DECIMAL(10, 2),
ADD COLUMN preorder_start_date TIMESTAMPTZ,
ADD COLUMN production_timeline_est TEXT;

-- Add indexes for commonly queried fields
CREATE INDEX idx_design_submissions_active_tier ON public.design_submissions(current_active_tier);
CREATE INDEX idx_design_submissions_preorder_start ON public.design_submissions(preorder_start_date);

-- Add comment for documentation
COMMENT ON COLUMN public.design_submissions.tiered_pricing_data IS 'JSON structure containing tiered pricing information for bulk orders';
COMMENT ON COLUMN public.design_submissions.current_active_tier IS 'Currently active pricing tier for the design';
COMMENT ON COLUMN public.design_submissions.potential_refund_per_unit IS 'Potential refund amount per unit if order is cancelled';
COMMENT ON COLUMN public.design_submissions.preorder_start_date IS 'Date when preorders become available for this design';
COMMENT ON COLUMN public.design_submissions.production_timeline_est IS 'Estimated production timeline for the design';