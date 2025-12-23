import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

// Add this block - Declare Deno global type
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req?.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Stripe with secret key
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno?.env?.get('SUPABASE_URL') ?? '',
      Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req?.method === 'POST') {
      const { membershipData, userInfo } = await req?.json();

      // Validate required data
      if (!membershipData || !membershipData?.rewardSelection) {
        return new Response(
          JSON.stringify({ error: 'Membership data is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!userInfo?.userId || !userInfo?.email) {
        return new Response(
          JSON.stringify({ error: 'User information is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get or create Stripe customer
      const { data: profile } = await supabaseClient?.from('user_profiles')?.select('stripe_customer_id, email, username')?.eq('id', userInfo?.userId)?.single();

      let stripeCustomer;
      if (profile?.stripe_customer_id) {
        // Update existing customer
        stripeCustomer = await stripe?.customers?.update(profile?.stripe_customer_id, {
          email: userInfo?.email,
          name: userInfo?.username || profile?.username,
          metadata: {
            user_id: userInfo?.userId,
            reward_selection: membershipData?.rewardSelection
          }
        });
      } else {
        // Create new customer
        stripeCustomer = await stripe?.customers?.create({
          email: userInfo?.email,
          name: userInfo?.username,
          metadata: {
            user_id: userInfo?.userId,
            reward_selection: membershipData?.rewardSelection
          }
        });

        // Update user profile with Stripe customer ID
        await supabaseClient?.from('user_profiles')?.update({ stripe_customer_id: stripeCustomer?.id })?.eq('id', userInfo?.userId);
      }

      // Calculate amount in cents (SGD)
      const amount = Math.round(membershipData?.amount * 100);

      // Create payment intent
      const paymentIntent = await stripe?.paymentIntents?.create({
        amount: amount,
        currency: membershipData?.currency?.toLowerCase() || 'sgd',
        customer: stripeCustomer?.id,
        description: `NPC Annual Membership - ${membershipData?.rewardSelection === 'digital_bundle' ? '2x $6 Vouchers' : 'Exclusive Merchandise'}`,
        metadata: {
          user_id: userInfo?.userId,
          reward_selection: membershipData?.rewardSelection,
          membership_type: 'annual'
        }
      });

      return new Response(
        JSON.stringify({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          customerId: stripeCustomer.id,
          amount: amount,
          currency: paymentIntent.currency
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Membership payment intent creation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});