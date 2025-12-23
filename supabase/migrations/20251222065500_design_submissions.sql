-- Location: supabase/migrations/20251222065500_design_submissions.sql
-- Schema Analysis: Existing user_profiles table with designer role support
-- Integration Type: New module for design submissions
-- Dependencies: user_profiles table

-- 1. Custom Types
CREATE TYPE public.design_category AS ENUM (
    'apparel',
    'accessories', 
    'footwear',
    'outerwear',
    'activewear',
    'loungewear'
);

CREATE TYPE public.submission_status AS ENUM (
    'draft',
    'pending_review',
    'community_voting',
    'in_production',
    'completed',
    'rejected'
);

-- 2. Design Submissions Table
CREATE TABLE public.design_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category public.design_category NOT NULL,
    materials TEXT,
    sizing_info TEXT,
    production_notes TEXT,
    submission_status public.submission_status DEFAULT 'draft'::public.submission_status,
    image_urls TEXT[] DEFAULT '{}',
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    review_started_at TIMESTAMPTZ,
    voting_started_at TIMESTAMPTZ,
    production_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    CONSTRAINT title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 100)
);

-- 3. Indexes for Performance
CREATE INDEX idx_design_submissions_designer ON public.design_submissions(designer_id);
CREATE INDEX idx_design_submissions_status ON public.design_submissions(submission_status);
CREATE INDEX idx_design_submissions_category ON public.design_submissions(category);
CREATE INDEX idx_design_submissions_created ON public.design_submissions(created_at DESC);

-- 4. Updated At Trigger
CREATE TRIGGER set_design_submissions_updated_at
    BEFORE UPDATE ON public.design_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Storage Bucket for Design Images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'design-images',
    'design-images',
    true,
    10485760, -- 10MB per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- 6. Enable RLS
ALTER TABLE public.design_submissions ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Design Submissions

-- Pattern 2: Simple User Ownership for designers
CREATE POLICY "designers_manage_own_submissions"
ON public.design_submissions
FOR ALL
TO authenticated
USING (designer_id = auth.uid())
WITH CHECK (designer_id = auth.uid());

-- Pattern 4: Public Read for community browsing
CREATE POLICY "public_view_non_draft_submissions"
ON public.design_submissions
FOR SELECT
TO public
USING (submission_status != 'draft'::public.submission_status);

-- 8. Storage RLS Policies

-- Public can view all design images
CREATE POLICY "public_read_design_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'design-images');

-- Authenticated users can upload to their folder
CREATE POLICY "designers_upload_design_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'design-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Designers can delete their own images
CREATE POLICY "designers_delete_own_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'design-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 9. Mock Data for Testing
DO $$
DECLARE
    existing_designer_id UUID;
    submission1_id UUID := gen_random_uuid();
    submission2_id UUID := gen_random_uuid();
BEGIN
    -- Get existing designer from user_profiles
    SELECT id INTO existing_designer_id 
    FROM public.user_profiles 
    WHERE role = 'designer'::public.user_role
    LIMIT 1;
    
    -- Only create mock data if we have a designer
    IF existing_designer_id IS NOT NULL THEN
        INSERT INTO public.design_submissions (
            id,
            designer_id,
            title,
            description,
            category,
            materials,
            sizing_info,
            submission_status,
            votes_count,
            submitted_at
        ) VALUES
        (
            submission1_id,
            existing_designer_id,
            'Urban Street Style Jacket',
            'Modern interpretation of classic bomber jacket with sustainable materials and modular pockets',
            'outerwear'::public.design_category,
            'Recycled polyester, organic cotton lining',
            'Available in XS-XXL, adjustable fit features',
            'community_voting'::public.submission_status,
            24,
            CURRENT_TIMESTAMP - INTERVAL '3 days'
        ),
        (
            submission2_id,
            existing_designer_id,
            'Minimalist Tote Collection',
            'Versatile everyday tote with hidden compartments and convertible straps',
            'accessories'::public.design_category,
            'Vegan leather, canvas interior',
            'One size, 40cm x 35cm x 15cm',
            'pending_review'::public.submission_status,
            0,
            CURRENT_TIMESTAMP - INTERVAL '1 day'
        );
    ELSE
        RAISE NOTICE 'No designer users found. Create a designer user first to add mock submissions.';
    END IF;
END $$;