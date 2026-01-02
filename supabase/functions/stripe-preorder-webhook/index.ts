import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from 'https://esm.sh/stripe@14.21.0';

// Add this block - Declare Deno interface for type safety
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req?.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno?.env?.get('SUPABASE_URL') ?? '',
      Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const signature = req?.headers?.get('stripe-signature')
    const webhookSecret = Deno?.env?.get('STRIPE_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature or secret' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the raw request body
    const body = await req?.text()

    // Verify webhook signature
    let event
    try {
      event = stripe?.webhooks?.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err?.message)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle the event
    switch (event?.type) {
      case 'checkout.session.completed': {
        const session = event?.data?.object

        // CRITICAL FIX: Determine if this is a membership payment or pre-order
        const paymentType = session?.metadata?.payment_type || 'preorder';
        const registrationFlow = session?.metadata?.registrationFlow === 'true';
        
        if (paymentType === 'membership') {
          // Handle membership signup payment
          // Support both user_id and userId metadata fields
          let userId = session?.metadata?.user_id || session?.metadata?.userId;
          
          // If userId is 'pending', this is a guest checkout (registration flow)
          // The user account will be created on the frontend success page
          if (!userId || userId === 'pending') {
            if (registrationFlow) {
              console.log('Guest checkout detected - user account will be created on success page');
              console.log('Payment completed for email:', session.customer_email || session.customer_details?.email);
              
              // Store payment info temporarily - frontend will link it after account creation
              // We'll update this when the user account is created
              return new Response(
                JSON.stringify({ 
                  received: true,
                  message: 'Payment processed. User account will be created on success page.',
                  customerId: session.customer,
                  subscriptionId: session.subscription
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            } else {
              console.error('Missing user_id in membership payment metadata and not a registration flow');
              return new Response(
                JSON.stringify({ error: 'Missing user_id' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          // User account exists - update membership status
          console.log('Updating membership for existing user:', userId);

          // Update user_profiles to set is_member = true
          const { error: updateUserError } = await supabaseClient
            .from('user_profiles')
            .update({ 
              is_member: true,
              membership_signup_date: new Date().toISOString(),
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription
            })
            .eq('id', userId);

          if (updateUserError) {
            console.error('Error updating user membership status:', updateUserError);
            // Don't fail - user might not have profile yet (will be created by trigger)
            console.warn('User profile might not exist yet - will be created by trigger');
          }

          // Create membership_signups record
          const { error: membershipError } = await supabaseClient
            .from('membership_signups')
            .insert({
              user_id: userId,
              signup_fee_paid: true
            });

          if (membershipError) {
            console.error('Error creating membership signup record:', membershipError);
            // Don't fail - might be duplicate
          }

          console.log('Membership activated for user:', userId);
        } else {
          // Handle pre-order payment (existing code)
          const {
            design_id,
            design_title,
            size,
            quantity,
            user_id,
            tier1_price
          } = session?.metadata

          // Get payment intent details
          const paymentIntentId = session?.payment_intent

          // Calculate amounts
          const quantityNum = parseInt(quantity) || 1
          const tier1PriceNum = parseFloat(tier1_price) || 0
          const totalAmount = tier1PriceNum * quantityNum

          // Get shipping address from session
          const shippingAddress = session?.shipping_details?.address ? {
            line1: session?.shipping_details?.address?.line1,
            line2: session?.shipping_details?.address?.line2,
            city: session?.shipping_details?.address?.city,
            state: session?.shipping_details?.address?.state,
            postal_code: session?.shipping_details?.address?.postal_code,
            country: session?.shipping_details?.address?.country
          } : null

          // Create pre-order record
          const { data: preOrder, error: preOrderError } = await supabaseClient?.from('pre_orders')?.insert({
              design_id: design_id,
              user_id: user_id,
              size: size,
              quantity: quantityNum,
              amount_paid: tier1PriceNum,
              total_amount: totalAmount,
              status: 'charged',
              stripe_payment_intent_id: paymentIntentId,
              shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : null
            })?.select()?.single()

          if (preOrderError) {
            console.error('Error creating pre-order:', preOrderError)
            return new Response(
              JSON.stringify({ error: 'Failed to create pre-order' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          console.log('Pre-order created:', preOrder?.id)

          // After successful checkout processing, queue email notification
          if (event.type === 'checkout.session.completed') {
            // Get design details for email
            const { data: designData } = await supabaseClient
              .from('design_submissions')
              .select('id, title')
              .eq('id', design_id)
              .single();

            // Get current preorder count
            const { count: preorderCount } = await supabaseClient
              .from('pre_orders')
              .select('id', { count: 'exact', head: true })
              .eq('design_id', design_id)
              .eq('status', 'charged');

            // Queue preorder confirmation email
            await supabaseClient.rpc('queue_email', {
              p_user_id: user_id,
              p_template_type: 'PREORDER_CONFIRMATION',
              p_template_data: {
                design_name: designData?.title || 'Your Design',
                design_id: design_id,
                amount: (session.amount_total / 100).toFixed(2),
                preorder_count: (preorderCount || 0).toString(),
                size: session.metadata.size
              }
            });
          }
        }

        break
      }

      case 'charge.refunded': {
        const charge = event?.data?.object
        const paymentIntentId = charge?.payment_intent

        // Find pre-order by payment intent ID
        const { data: preOrders, error: findError } = await supabaseClient?.from('pre_orders')?.select('id')?.eq('stripe_payment_intent_id', paymentIntentId)

        if (findError || !preOrders || preOrders?.length === 0) {
          console.error('Pre-order not found for payment intent:', paymentIntentId)
          return new Response(
            JSON.stringify({ error: 'Pre-order not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update pre-order status to refunded
        const { error: updateError } = await supabaseClient?.from('pre_orders')?.update({ 
            status: 'refunded',
            refund_credit_issued: true
          })?.eq('id', preOrders?.[0]?.id)

        if (updateError) {
          console.error('Error updating pre-order status:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update pre-order' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Pre-order refunded:', preOrders?.[0]?.id)
        break
      }

      default:
        console.log('Unhandled event type:', event?.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})