import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

// Add this block - Declare Deno type for environment access
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req?.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe with secret key
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno?.env?.get('SUPABASE_URL') ?? '',
      Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req?.method === 'POST') {
      const { 
        designId, 
        designTitle, 
        size, 
        quantity, 
        amount, 
        tier1Price,
        shippingDetails,
        userId 
      } = await req?.json()

      // Validate required data
      if (!designId || !size || !quantity || !amount || !userId) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate amount in cents for Stripe
      const amountInCents = Math.round(amount * 100)

      // Create Stripe Checkout Session
      const session = await stripe?.checkout?.sessions?.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Pre-Order: ${designTitle}`,
                description: `Size: ${size}, Quantity: ${quantity}`,
                metadata: {
                  design_id: designId,
                  size: size,
                  quantity: quantity?.toString(),
                  tier1_price: tier1Price?.toString()
                }
              },
              unit_amount: Math.round(tier1Price * 100),
            },
            quantity: quantity,
          },
        ],
        mode: 'payment',
        success_url: `${req?.headers?.get('origin')}/preorder-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req?.headers?.get('origin')}/design/${designId}`,
        customer_email: shippingDetails?.email,
        metadata: {
          design_id: designId,
          design_title: designTitle,
          size: size,
          quantity: quantity?.toString(),
          user_id: userId,
          tier1_price: tier1Price?.toString()
        },
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'AU'],
        },
        phone_number_collection: {
          enabled: true,
        },
      })

      return new Response(
        JSON.stringify({
          url: session.url,
          sessionId: session.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Checkout session creation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})