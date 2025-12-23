-- Location: supabase/migrations/20251223031511_email_notification_system.sql
-- Schema Analysis: Building upon existing user_profiles, design_submissions, pre_orders, and payouts tables
-- Integration Type: New module - Email notification system
-- Dependencies: user_profiles, design_submissions, pre_orders, payouts

-- 1. Create ENUMs
CREATE TYPE public.email_template_type AS ENUM (
    'PREORDER_CONFIRMATION',
    'TIER_ACHIEVED',
    'REFUND_ISSUED',
    'PAYOUT_SENT'
);

CREATE TYPE public.email_status AS ENUM (
    'pending',
    'sending',
    'sent',
    'failed'
);

-- 2. Email Templates Table
CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_type public.email_template_type NOT NULL UNIQUE,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Email Queue Table
CREATE TABLE public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    template_type public.email_template_type NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    status public.email_status DEFAULT 'pending'::public.email_status,
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Essential Indexes
CREATE INDEX idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX idx_email_templates_active ON public.email_templates(is_active);
CREATE INDEX idx_email_queue_user_id ON public.email_queue(user_id);
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_created_at ON public.email_queue(created_at);
CREATE INDEX idx_email_queue_template_type ON public.email_queue(template_type);

-- 5. RLS Setup
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Email templates - Admin full access, public read for active templates
CREATE POLICY "admin_full_access_email_templates"
ON public.email_templates
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

CREATE POLICY "public_read_active_email_templates"
ON public.email_templates
FOR SELECT
TO public
USING (is_active = true);

-- Email queue - Users can view their own emails, admins can view all
CREATE POLICY "users_view_own_email_queue"
ON public.email_queue
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "admin_full_access_email_queue"
ON public.email_queue
FOR ALL
TO authenticated
USING (public.is_admin_from_auth())
WITH CHECK (public.is_admin_from_auth());

-- 7. Trigger for updated_at
CREATE TRIGGER set_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_email_queue_updated_at
BEFORE UPDATE ON public.email_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Helper Functions

-- Function to queue email
CREATE OR REPLACE FUNCTION public.queue_email(
    p_user_id UUID,
    p_template_type public.email_template_type,
    p_template_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_template RECORD;
    v_email TEXT;
    v_subject TEXT;
    v_body TEXT;
    v_queue_id UUID;
BEGIN
    -- Get user email
    SELECT email INTO v_email
    FROM public.user_profiles
    WHERE id = p_user_id;

    IF v_email IS NULL THEN
        RAISE EXCEPTION 'User not found or email is null';
    END IF;

    -- Get template
    SELECT * INTO v_template
    FROM public.email_templates
    WHERE template_type = p_template_type
    AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template % not found or inactive', p_template_type;
    END IF;

    -- Replace placeholders in subject and body
    v_subject := v_template.subject_template;
    v_body := v_template.body_template;

    -- Replace common placeholders
    IF p_template_data ? 'design_name' THEN
        v_subject := REPLACE(v_subject, '[Design Name]', p_template_data->>'design_name');
        v_body := REPLACE(v_body, '[Design Name]', p_template_data->>'design_name');
    END IF;

    IF p_template_data ? 'tier' THEN
        v_subject := REPLACE(v_subject, '[X]', p_template_data->>'tier');
        v_body := REPLACE(v_body, '[Tier X]', 'Tier ' || (p_template_data->>'tier'));
        v_body := REPLACE(v_body, '[X]', p_template_data->>'tier');
    END IF;

    IF p_template_data ? 'amount' THEN
        v_body := REPLACE(v_body, '$X', '$' || (p_template_data->>'amount'));
        v_body := REPLACE(v_body, '$Y', '$' || (p_template_data->>'amount'));
    END IF;

    IF p_template_data ? 'refund_amount' THEN
        v_body := REPLACE(v_body, '$R', '$' || (p_template_data->>'refund_amount'));
        v_body := REPLACE(v_body, '$Y', '$' || (p_template_data->>'refund_amount'));
    END IF;

    IF p_template_data ? 'credit_balance' THEN
        v_body := REPLACE(v_body, '$Z', '$' || (p_template_data->>'credit_balance'));
    END IF;

    IF p_template_data ? 'old_price' THEN
        v_body := REPLACE(v_body, '$Y', '$' || (p_template_data->>'old_price'));
    END IF;

    IF p_template_data ? 'new_price' THEN
        v_body := REPLACE(v_body, '$Z', '$' || (p_template_data->>'new_price'));
    END IF;

    IF p_template_data ? 'design_id' THEN
        v_body := REPLACE(v_body, '/design/[id]', '/design/' || (p_template_data->>'design_id'));
    END IF;

    IF p_template_data ? 'preorder_count' THEN
        v_body := REPLACE(v_body, 'X/100', (p_template_data->>'preorder_count') || '/100');
    END IF;

    -- Insert into queue
    INSERT INTO public.email_queue (
        user_id,
        template_type,
        recipient_email,
        subject,
        body,
        metadata,
        status
    ) VALUES (
        p_user_id,
        p_template_type,
        v_email,
        v_subject,
        v_body,
        p_template_data,
        'pending'::public.email_status
    ) RETURNING id INTO v_queue_id;

    RETURN v_queue_id;
END;
$$;

-- 9. Insert default email templates
DO $$
BEGIN
    INSERT INTO public.email_templates (template_type, subject_template, body_template) VALUES
    (
        'PREORDER_CONFIRMATION'::public.email_template_type,
        'Order Confirmed: [Design Name]',
        'Thank you for your pre-order!

Design: [Design Name]
Amount Paid: $X

Current Progress: X/100 pre-orders
Note: Price may drop if more people pre-order!

View your order: /design/[id]

We will notify you when the price drops or when your design goes into production.'
    ),
    (
        'TIER_ACHIEVED'::public.email_template_type,
        '🎉 Price Drop! [Design Name] reached Tier [X]',
        'Great news! Your pre-ordered design has reached a new tier.

Design: [Design Name]
Your price dropped from $Y to $Z!
Refund of $R has been credited to your account.

Want to help reach the next tier? Share this design with friends:
/design/[id]

Current credit balance: $Z'
    ),
    (
        'REFUND_ISSUED'::public.email_template_type,
        'Refund Issued: [Design Name]',
        'Your pre-order period has ended and refunds have been processed.

Design: [Design Name]
Final tier reached: Tier [X]
Refund amount: $Y
New credit balance: $Z

Your credits can be used for future purchases on our platform.

Thank you for supporting independent designers!'
    ),
    (
        'PAYOUT_SENT'::public.email_template_type,
        '💰 Payout Sent: [Design Name]',
        'Congratulations! Your designer payout has been sent.

Design: [Design Name]
Payout amount: $X

Funds will arrive in your account in 2-7 business days.

Total earnings to date: $Y

Keep creating amazing designs!'
    );
END $$;

-- 10. Function to queue TIER_ACHIEVED emails (called by trigger)
CREATE OR REPLACE FUNCTION public.queue_tier_achieved_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_design RECORD;
    v_old_tier INTEGER;
    v_new_tier INTEGER;
    v_old_price NUMERIC;
    v_new_price NUMERIC;
    v_refund_per_unit NUMERIC;
    v_preorder RECORD;
BEGIN
    -- Only process if tier changed
    IF NEW.current_active_tier IS DISTINCT FROM OLD.current_active_tier THEN
        v_old_tier := OLD.current_active_tier;
        v_new_tier := NEW.current_active_tier;

        -- Get design details
        SELECT * INTO v_design
        FROM public.design_submissions
        WHERE id = NEW.id;

        -- Calculate old and new prices from tiered_pricing_data
        IF v_design.tiered_pricing_data IS NOT NULL THEN
            -- Extract prices based on tier
            v_old_price := (v_design.tiered_pricing_data->('tier' || v_old_tier::text)->>'price')::NUMERIC;
            v_new_price := (v_design.tiered_pricing_data->('tier' || v_new_tier::text)->>'price')::NUMERIC;
            v_refund_per_unit := v_old_price - v_new_price;

            -- Queue emails for all users with pre-orders for this design
            FOR v_preorder IN
                SELECT user_id, amount_paid
                FROM public.pre_orders
                WHERE design_id = NEW.id
                AND status = 'charged'
            LOOP
                -- Get updated credit balance (will be updated by other triggers)
                PERFORM public.queue_email(
                    v_preorder.user_id,
                    'TIER_ACHIEVED'::public.email_template_type,
                    jsonb_build_object(
                        'design_name', v_design.title,
                        'design_id', NEW.id,
                        'tier', v_new_tier,
                        'old_price', v_old_price,
                        'new_price', v_new_price,
                        'refund_amount', v_refund_per_unit
                    )
                );
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for tier changes
CREATE TRIGGER trigger_queue_tier_achieved_emails
AFTER UPDATE OF current_active_tier ON public.design_submissions
FOR EACH ROW
EXECUTE FUNCTION public.queue_tier_achieved_emails();

COMMENT ON TABLE public.email_templates IS 'Email notification templates with placeholders';
COMMENT ON TABLE public.email_queue IS 'Queue for outgoing email notifications';
COMMENT ON FUNCTION public.queue_email IS 'Queues an email for sending with template data';
COMMENT ON FUNCTION public.queue_tier_achieved_emails IS 'Automatically queues TIER_ACHIEVED emails when design tier changes';