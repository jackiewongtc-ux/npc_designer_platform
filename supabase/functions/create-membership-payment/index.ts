import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// Add this block - Initialize Stripe with secret key
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});
// End of added block

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req?.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, priceId, email, metadata = {} } = await req.json();

    console.log('📨 Received checkout request:', {
      hasUserId: !!userId,
      priceId,
      email,
      metadata,
      stripeKeyExists: !!stripeKey,
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 7) + '...' : 'MISSING'
    });

    // Validate required parameters
    if (!priceId) {
      console.error('❌ Missing priceId parameter');
      throw new Error('Missing required parameter: priceId');
    }

    if (!email) {
      console.error('❌ Missing email parameter');
      throw new Error('Missing required parameter: email');
    }

    // Validate Stripe secret key exists
    if (!stripeKey) {
      console.error('❌ STRIPE_SECRET_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in Supabase Edge Function environment variables.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Validate Stripe secret key format
    if (!stripeKey.startsWith('sk_test_') && !stripeKey.startsWith('sk_live_')) {
      console.error('❌ Invalid Stripe secret key format. Key must start with sk_test_ or sk_live_');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Stripe configuration. Please check STRIPE_SECRET_KEY format.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Get or create Stripe customer
    let customerId;
    try {
      console.log('🔍 Searching for existing customer with email:', email);
      
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        console.log('✅ Found existing customer:', customerId);
      } else {
        console.log('🆕 Creating new customer for email:', email);
        
        const customer = await stripe.customers.create({
          email: email,
          metadata: {
            userId: userId || 'pending',
            ...metadata
          }
        });
        customerId = customer.id;
        console.log('✅ Created new customer:', customerId);
      }
    } catch (error) {
      console.error('❌ Stripe customer error:', {
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to process customer: ${error.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Create Checkout Session
    try {
      console.log('🎫 Creating checkout session with:', {
        customerId,
        priceId,
        mode: 'subscription'
      });
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        // Use membership-success page for new registrations, dashboard for existing users
        success_url: userId && userId !== 'pending' 
          ? `${req.headers.get('origin')}/member-hub-dashboard?session_id={CHECKOUT_SESSION_ID}`
          : `${req.headers.get('origin')}/membership-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get('origin')}/register`,
        metadata: {
          userId: userId || 'pending',
          user_id: userId || 'pending', // Also set user_id for webhook compatibility
          payment_type: 'membership', // Required for webhook to identify membership payments
          registrationFlow: metadata?.registrationFlow || 'false',
          username: metadata?.username || '',
          ...metadata
        },
        subscription_data: {
          metadata: {
            userId: userId || 'pending',
            user_id: userId || 'pending',
            payment_type: 'membership',
            registrationFlow: metadata?.registrationFlow || 'false',
            username: metadata?.username || '',
            ...metadata
          }
        }
      });

      console.log('✅ Checkout session created successfully:', {
        sessionId: session.id,
        url: session.url
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (error) {
      console.error('❌ Stripe Checkout Session error:', {
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        raw: error.raw
      });

      // Detailed error messages for different Stripe errors
      let errorMessage = error.message;
      
      if (error.code === 'resource_missing') {
        errorMessage = `The price ID "${priceId}" does not exist in your Stripe account. Please verify the price ID in your Stripe Dashboard.`;
      } else if (error.type === 'StripeAuthenticationError') {
        errorMessage = 'Stripe authentication failed. Please verify your STRIPE_SECRET_KEY is correct.';
      } else if (error.type === 'StripePermissionError') {
        errorMessage = 'Insufficient Stripe permissions. Please check your Stripe account settings.';
      } else if (error.type === 'StripeAPIError') {
        errorMessage = `Stripe API error: ${error.message}`;
      } else if (error.type === 'StripeConnectionError') {
        errorMessage = 'Failed to connect to Stripe. Please check your internet connection and try again.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: error.code
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

  } catch (error) {
    console.error('❌ Function error:', {
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred. Please try again.' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});