-- =====================================================
-- Migration: Add onboarding_completed column to user_profiles
-- Description: Adds boolean flag to track user onboarding completion
-- =====================================================

-- Add onboarding_completed column if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed 
ON public.user_profiles(onboarding_completed);

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.onboarding_completed IS 'Tracks whether user has completed profile onboarding process';