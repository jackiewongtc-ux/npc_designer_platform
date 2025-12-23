-- Location: supabase/migrations/20251222063436_npc_auth_membership.sql
-- Schema Analysis: Empty database - fresh project
-- Integration Type: New Module - Authentication & Membership System
-- Dependencies: None - First migration

-- =====================================================
-- 1. TYPES AND ENUMS
-- =====================================================

-- User roles in the system
CREATE TYPE public.user_role AS ENUM ('consumer', 'designer', 'admin');

-- Membership reward options
CREATE TYPE public.membership_reward_type AS ENUM ('digital_bundle', 'merchandise');

-- User tier levels for gamification
CREATE TYPE public.user_tier AS ENUM (
    'fan', 'supporter', 'patron', 'tastemaker', 'legend',
    'newcomer', 'creator', 'rising_star', 'established_designer', 'top_designer'
);

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- User profiles table (intermediary for auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    profile_pic TEXT,
    role public.user_role DEFAULT 'consumer'::public.user_role NOT NULL,
    bio TEXT,
    ig_handle TEXT,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_connect_account_id TEXT,
    total_earnings NUMERIC(10,2) DEFAULT 0,
    followers_count INTEGER DEFAULT 0,
    user_exp INTEGER DEFAULT 0,
    user_tier public.user_tier DEFAULT 'fan'::public.user_tier,
    badges TEXT[] DEFAULT '{}',
    achievements_unlocked TEXT[] DEFAULT '{}',
    is_member BOOLEAN DEFAULT false,
    membership_signup_date TIMESTAMPTZ,
    membership_auto_renew BOOLEAN DEFAULT true,
    preferred_shipping_address TEXT,
    preferred_tshirt_size TEXT,
    body_measurements JSONB DEFAULT '{}',
    reward_credit_balance NUMERIC(10,2) DEFAULT 0,
    current_quarter_bonus_earned NUMERIC(10,2) DEFAULT 0,
    bonus_quarter_reset TIMESTAMPTZ,
    referral_codes_redeemed TEXT[] DEFAULT '{}',
    active_missions JSONB DEFAULT '[]',
    completed_missions JSONB DEFAULT '[]',
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Membership signups table
CREATE TABLE public.membership_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    signup_fee_paid NUMERIC(10,2) NOT NULL,
    reward_selection public.membership_reward_type NOT NULL,
    voucher_codes TEXT[] DEFAULT '{}',
    merchandise_fulfilled BOOLEAN DEFAULT false,
    reward_expiry_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_is_member ON public.user_profiles(is_member);
CREATE INDEX idx_membership_signups_user_id ON public.membership_signups(user_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY SETUP
-- =====================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. FUNCTIONS (MUST BE BEFORE RLS POLICIES)
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_from_auth()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid() 
    AND (au.raw_user_meta_data->>'role' = 'admin' 
         OR au.raw_app_meta_data->>'role' = 'admin')
)
$$;

-- Trigger function to create user profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        email, 
        username, 
        profile_pic,
        role,
        bio
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'profile_pic', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'consumer'::public.user_role),
        COALESCE(NEW.raw_user_meta_data->>'bio', '')
    );
    RETURN NEW;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- User profiles policies (Pattern 1: Core user table - simple only)
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Public read access for user profiles (for displaying designers, etc.)
CREATE POLICY "public_can_read_user_profiles"
ON public.user_profiles
FOR SELECT
TO public
USING (true);

-- Admin full access to user profiles
CREATE POLICY "admin_full_access_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- Membership signups policies
CREATE POLICY "users_manage_own_membership_signups"
ON public.membership_signups
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin access to membership signups
CREATE POLICY "admin_full_access_membership_signups"
ON public.membership_signups
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- System settings policies
CREATE POLICY "public_can_read_system_settings"
ON public.system_settings
FOR SELECT
TO public
USING (true);

CREATE POLICY "admin_manage_system_settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to create user profile on auth user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. INITIAL SYSTEM SETTINGS
-- =====================================================

INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
    ('membership_fee_sgd', '10', 'Annual membership fee in SGD'),
    ('non_member_design_limit', '3', 'Maximum designs non-members can view'),
    ('reward_credit_expiry_days', '365', 'Days until reward credits expire'),
    ('quarterly_bonus_cap', '3000', 'Maximum designer bonus per quarter'),
    ('urgency_threshold_percentage', '5', 'Percentage threshold for flash updates'),
    ('reprint_threshold_min', '50', 'Minimum percentage for reprint eligibility'),
    ('size_change_window_hours', '24', 'Hours before production for size changes');

-- =====================================================
-- 9. MOCK DATA
-- =====================================================

DO $$
DECLARE
    admin_user_id UUID := gen_random_uuid();
    designer_user_id UUID := gen_random_uuid();
    consumer_user_id UUID := gen_random_uuid();
BEGIN
    -- Create auth users with complete fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@npc.com', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
         '{"username": "NPCAdmin", "role": "admin", "bio": "Platform Administrator"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (designer_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'designer@npc.com', crypt('designer123', gen_salt('bf', 10)), now(), now(), now(),
         '{"username": "CreativeDesigner", "role": "designer", "bio": "Fashion Designer specializing in streetwear"}'::jsonb,
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (consumer_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'member@npc.com', crypt('member123', gen_salt('bf', 10)), now(), now(), now(),
         '{"username": "FashionFan", "role": "consumer", "bio": "Fashion enthusiast and community member"}'::jsonb,
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Note: user_profiles are automatically created by the trigger
    
    -- Update membership status for consumer
    UPDATE public.user_profiles 
    SET 
        is_member = true,
        membership_signup_date = now(),
        user_tier = 'supporter'::public.user_tier,
        user_exp = 150,
        reward_credit_balance = 12.00
    WHERE id = consumer_user_id;

    -- Create membership signup record
    INSERT INTO public.membership_signups (
        user_id,
        signup_fee_paid,
        reward_selection,
        voucher_codes,
        reward_expiry_date
    ) VALUES (
        consumer_user_id,
        10.00,
        'digital_bundle'::public.membership_reward_type,
        ARRAY['NPC-WELCOME-6A', 'NPC-WELCOME-6B'],
        now() + interval '1 year'
    );

END $$;

-- =====================================================
-- 10. COMMENTS
-- =====================================================

COMMENT ON TABLE public.user_profiles IS 'User profiles linked to auth.users for all app functionality';
COMMENT ON TABLE public.membership_signups IS 'Tracks membership signups and rewards';
COMMENT ON TABLE public.system_settings IS 'Global system configuration settings';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user_profiles record when auth.users is inserted';