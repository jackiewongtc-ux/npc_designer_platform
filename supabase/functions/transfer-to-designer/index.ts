/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.10.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TransferRequest {
  design_id: string
  payout_amount: number
}

interface TransferResponse {
  success: boolean
  transfer_id?: string
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Verify admin role
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Only admins can initiate designer payouts')
    }

    // Parse request body
    const { design_id, payout_amount }: TransferRequest = await req.json()

    if (!design_id || !payout_amount || payout_amount <= 0) {
      throw new Error('Invalid design_id or payout_amount')
    }

    // Step 1: Get designer Stripe Connect ID
    const { data: designData, error: designError } = await supabaseClient
      .from('design_submissions')
      .select(`
        designer_id,
        user_profiles!inner(stripe_connect_account_id)
      `)
      .eq('id', design_id)
      .single()

    if (designError || !designData) {
      throw new Error('Design not found')
    }

    const stripe_connect_account_id = designData.user_profiles?.stripe_connect_account_id

    if (!stripe_connect_account_id) {
      throw new Error('Designer does not have a Stripe Connect account configured')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    // Step 2: Create Stripe transfer
    let transferResult
    try {
      transferResult = await stripe.transfers.create({
        amount: Math.round(payout_amount * 100), // Convert to cents
        currency: 'sgd',
        destination: stripe_connect_account_id,
        description: `Payout for design ${design_id}`,
        metadata: {
          design_id: design_id,
          designer_id: designData.designer_id,
        },
      })
    } catch (stripeError: any) {
      // Step 4: On failure - Record failed payout
      await supabaseClient.from('payouts').insert({
        design_id: design_id,
        user_id: designData.designer_id,
        amount: payout_amount,
        status: 'failed',
        error_message: stripeError.message,
        metadata: {
          stripe_error_code: stripeError.code,
          stripe_error_type: stripeError.type,
        },
      })

      console.error('Stripe transfer failed:', stripeError)

      return new Response(
        JSON.stringify({
          success: false,
          error: stripeError.message,
        } as TransferResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Step 3: On success - Record payout and update designer
    const { error: payoutInsertError } = await supabaseClient.from('payouts').insert({
      design_id: design_id,
      user_id: designData.designer_id,
      amount: payout_amount,
      stripe_transfer_id: transferResult.id,
      status: 'completed',
      metadata: {
        stripe_balance_transaction: transferResult.balance_transaction,
        created_timestamp: transferResult.created,
      },
    })

    if (payoutInsertError) {
      console.error('Failed to record payout:', payoutInsertError)
      throw new Error('Failed to record payout in database')
    }

    // Update designer total_earnings
    const { error: updateEarningsError } = await supabaseClient
      .from('user_profiles')
      .update({
        total_earnings: supabaseClient.rpc('increment_total_earnings', {
          designer_user_id: designData.designer_id,
          amount_to_add: payout_amount,
        }),
      })
      .eq('id', designData.designer_id)

    if (updateEarningsError) {
      console.error('Failed to update total_earnings:', updateEarningsError)
    }

    // Update design status to 'paid_out' (using submission_status enum value 'completed')
    const { error: updateDesignError } = await supabaseClient
      .from('design_submissions')
      .update({
        submission_status: 'completed',
      })
      .eq('id', design_id)

    if (updateDesignError) {
      console.error('Failed to update design status:', updateDesignError)
    }

    // After successful transfer, queue PAYOUT_SENT email
    if (transferResult.id) {
      // Get design details
      const { data: designData } = await supabaseClient
        .from('design_submissions')
        .select('title, designer_id')
        .eq('id', design_id)
        .single();

      // Get designer's total earnings
      const { data: userData } = await supabaseClient
        .from('user_profiles')
        .select('total_earnings')
        .eq('id', designData?.designer_id)
        .single();

      // Queue payout sent email
      await supabaseClient.rpc('queue_email', {
        p_user_id: designData?.designer_id,
        p_template_type: 'PAYOUT_SENT',
        p_template_data: {
          design_name: designData?.title || 'Your Design',
          amount: payout_amount.toFixed(2),
          total_earnings: userData?.total_earnings?.toFixed(2) || '0.00'
        }
      });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transferResult.id,
      } as TransferResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error('Transfer to designer error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      } as TransferResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})