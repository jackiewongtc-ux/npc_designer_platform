import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Add this block - Declare Deno global interface
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  if (req?.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno?.env?.get('SUPABASE_URL') ?? '',
      Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req?.method === 'POST') {
      const { paymentIntentId } = await req?.json();

      if (!paymentIntentId) {
        return new Response(
          JSON.stringify({ error: 'Payment Intent ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe?.paymentIntents?.retrieve(paymentIntentId);

      if (paymentIntent?.status !== 'succeeded') {
        return new Response(
          JSON.stringify({ error: 'Payment not successful' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userId = paymentIntent?.metadata?.user_id;
      const rewardSelection = paymentIntent?.metadata?.reward_selection;

      // Generate voucher codes if digital bundle selected
      let voucherCodes = null;
      if (rewardSelection === 'digital_bundle') {
        voucherCodes = [
          `NPC-${Date.now()}-${Math.random()?.toString(36)?.substr(2, 6)?.toUpperCase()}`,
          `NPC-${Date.now() + 1}-${Math.random()?.toString(36)?.substr(2, 6)?.toUpperCase()}`
        ];
      }

      // Calculate reward expiry date (1 year from now)
      const rewardExpiryDate = new Date();
      rewardExpiryDate?.setFullYear(rewardExpiryDate?.getFullYear() + 1);

      // Create membership signup record
      const { data: membershipSignup, error: signupError } = await supabaseClient?.from('membership_signups')?.insert({
          user_id: userId,
          signup_fee_paid: paymentIntent?.amount / 100,
          reward_selection: rewardSelection,
          voucher_codes: voucherCodes,
          reward_expiry_date: rewardExpiryDate?.toISOString(),
          merchandise_fulfilled: false
        })?.select()?.single();

      if (signupError) {
        console.error('Membership signup creation error:', signupError);
        return new Response(
          JSON.stringify({ error: 'Failed to create membership record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update user profile
      const { error: profileError } = await supabaseClient?.from('user_profiles')?.update({
          is_member: true,
          membership_signup_date: new Date()?.toISOString(),
          membership_auto_renew: true,
          stripe_subscription_id: paymentIntent?.id
        })?.eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          membershipSignup: membershipSignup,
          voucherCodes: voucherCodes,
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Membership payment confirmation error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});