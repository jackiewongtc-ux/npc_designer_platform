import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

// Declare Deno global type
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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey || stripeSecretKey === '') {
      console.error('STRIPE_SECRET_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Payment system configuration error. Please contact support.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate Stripe key format (should start with sk_test_ or sk_live_)
    if (!stripeSecretKey.startsWith('sk_')) {
      console.error('Invalid STRIPE_SECRET_KEY format. Key should start with sk_test_ or sk_live_');
      return new Response(
        JSON.stringify({ 
          error: 'Payment system configuration error. Invalid API key format.',
          details: 'Stripe secret key must start with sk_test_ or sk_live_'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno?.env?.get('SUPABASE_URL') ?? '',
      Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req?.method === 'POST') {
      const { userId, priceId, email, successUrl, cancelUrl } = await req?.json();

      console.log('🔍 Received request with params:', {
        userId: userId || 'MISSING',
        priceId: priceId || 'MISSING',
        email: email || 'MISSING',
        hasSuccessUrl: !!successUrl,
        hasCancelUrl: !!cancelUrl
      });

      // Validate required data with detailed error messages
      if (!userId) {
        console.error('❌ Missing userId in request');
        return new Response(
          JSON.stringify({ error: 'User ID is required. Please ensure you are logged in.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!email) {
        console.error('❌ Missing email in request');
        return new Response(
          JSON.stringify({ error: 'Email is required for checkout session.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!priceId) {
        console.error('❌ Missing priceId in request - Check VITE_STRIPE_MEMBERSHIP_PRICE_ID in .env');
        return new Response(
          JSON.stringify({ 
            error: 'Stripe Price ID is required. Configuration error - please contact support.',
            details: 'Missing VITE_STRIPE_MEMBERSHIP_PRICE_ID environment variable'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Creating Stripe checkout session with:', {
        userId,
        priceId,
        email
      });

      // Get or create Stripe customer with enhanced error handling
      let stripeCustomerId;
      
      try {
        const { data: profile } = await supabaseClient
          ?.from('user_profiles')
          ?.select('stripe_customer_id, username')
          ?.eq('id', userId)
          ?.single();

        stripeCustomerId = profile?.stripe_customer_id;

        if (!stripeCustomerId) {
          // Create new Stripe customer with error handling
          try {
            const customer = await stripe?.customers?.create({
              email: email,
              name: profile?.username || 'NPC Member',
              metadata: {
                supabase_user_id: userId
              }
            });

            stripeCustomerId = customer.id;

            // Update user profile with Stripe customer ID
            await supabaseClient
              ?.from('user_profiles')
              ?.update({ stripe_customer_id: stripeCustomerId })
              ?.eq('id', userId);

            console.log('Created new Stripe customer:', stripeCustomerId);
          } catch (stripeCustomerError) {
            console.error('Stripe customer creation failed:', {
              error: stripeCustomerError.message,
              type: stripeCustomerError.type,
              code: stripeCustomerError.code
            });
            
            return new Response(
              JSON.stringify({ 
                error: 'Failed to create Stripe customer',
                details: stripeCustomerError.message,
                type: stripeCustomerError.type
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        } else {
          console.log('Using existing Stripe customer:', stripeCustomerId);
        }
      } catch (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to retrieve user information',
            details: profileError.message
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Create Stripe Checkout Session with comprehensive error handling
      try {
        const session = await stripe?.checkout?.sessions?.create({
          customer: stripeCustomerId,
          payment_method_types: ['card'],
          line_items: [{
            price: priceId,
            quantity: 1,
          }],
          mode: 'subscription',
          success_url: successUrl || `${req.headers.get('origin')}/member-hub-dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: cancelUrl || `${req.headers.get('origin')}/register`,
          metadata: {
            supabase_user_id: userId,
            membership_type: 'annual'
          },
          subscription_data: {
            metadata: {
              supabase_user_id: userId
            }
          }
        });

        console.log('Stripe checkout session created successfully:', session.id);

        return new Response(
          JSON.stringify({
            url: session.url,
            sessionId: session.id
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (stripeSessionError) {
        console.error('Stripe checkout session creation failed:', {
          error: stripeSessionError.message,
          type: stripeSessionError.type,
          code: stripeSessionError.code,
          param: stripeSessionError.param,
          priceId: priceId
        });

        // Provide specific error messages based on Stripe error type
        let errorMessage = 'Failed to create checkout session';
        let errorDetails = stripeSessionError.message;

        if (stripeSessionError.code === 'resource_missing') {
          errorMessage = 'Invalid Price ID';
          errorDetails = `The price ID "${priceId}" does not exist in your Stripe account. Please verify the VITE_STRIPE_MEMBERSHIP_PRICE_ID in your .env file.`;
        } else if (stripeSessionError.type === 'StripeAuthenticationError') {
          errorMessage = 'Stripe authentication failed';
          errorDetails = 'The Stripe secret key is invalid. Please verify STRIPE_SECRET_KEY in your Supabase environment variables.';
        } else if (stripeSessionError.type === 'StripePermissionError') {
          errorMessage = 'Stripe permission error';
          errorDetails = 'The Stripe API key does not have permission to perform this action.';
        }

        return new Response(
          JSON.stringify({ 
            error: errorMessage,
            details: errorDetails,
            stripeErrorCode: stripeSessionError.code,
            stripeErrorType: stripeSessionError.type
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in edge function:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        details: error?.message || 'Unknown error',
        type: error?.name || 'UnknownError'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});