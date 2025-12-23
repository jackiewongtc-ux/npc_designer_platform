import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting pre-order end processing...');

    // Query designs where pre-order period has ended (30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: eligibleDesigns, error: designsError } = await supabaseClient
      .from('design_submissions')
      .select('id, title, tiered_pricing_data, preorder_start_date')
      .not('preorder_start_date', 'is', null)
      .lte('preorder_start_date', thirtyDaysAgo.toISOString())
      .in('submission_status', ['community_voting']); // Designs in pre-order phase

    if (designsError) {
      console.error('Error fetching eligible designs:', designsError);
      throw designsError;
    }

    if (!eligibleDesigns || eligibleDesigns.length === 0) {
      console.log('No designs eligible for pre-order end processing');
      return new Response(
        JSON.stringify({ 
          processed: 0, 
          designs: [],
          message: 'No eligible designs found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${eligibleDesigns.length} eligible designs`);

    const processedDesigns: string[] = [];
    const errors: { designId: string; error: string }[] = [];

    // Process each design
    for (const design of eligibleDesigns) {
      try {
        console.log(`Processing design ${design.id}: ${design.title}`);

        // Get pre-order count for this design
        const { count: preorderCount, error: countError } = await supabaseClient
          .from('pre_orders')
          .select('*', { count: 'exact', head: true })
          .eq('design_id', design.id)
          .eq('status', 'charged');

        if (countError) {
          throw new Error(`Failed to count pre-orders: ${countError.message}`);
        }

        const totalPreorders = preorderCount || 0;
        console.log(`Design ${design.id} has ${totalPreorders} pre-orders`);

        // Calculate current tier using the database function
        const { data: tierResult, error: tierError } = await supabaseClient
          .rpc('calculate_current_tier', {
            preorder_count: totalPreorders,
            tier_data: design.tiered_pricing_data
          });

        if (tierError) {
          throw new Error(`Failed to calculate tier: ${tierError.message}`);
        }

        const finalTier = tierResult || 1;
        console.log(`Calculated final tier: ${finalTier}`);

        // Extract tier pricing from tiered_pricing_data
        const tierData = design.tiered_pricing_data as any[];
        const tier1Data = tierData?.find((t: any) => t.tier === 1);
        const finalTierData = tierData?.find((t: any) => t.tier === finalTier);

        if (!tier1Data || !finalTierData) {
          throw new Error('Invalid tier pricing data');
        }

        const tier1Price = parseFloat(tier1Data.retail_price);
        const finalTierPrice = parseFloat(finalTierData.retail_price);
        const refundPerUnit = tier1Price - finalTierPrice;

        console.log(`Tier 1 price: ${tier1Price}, Final tier price: ${finalTierPrice}, Refund per unit: ${refundPerUnit}`);

        // Only process refunds if there's a positive refund amount
        if (refundPerUnit > 0) {
          // Get all charged pre-orders for this design
          const { data: preorders, error: preordersError } = await supabaseClient
            .from('pre_orders')
            .select('id, user_id, quantity')
            .eq('design_id', design.id)
            .eq('status', 'charged')
            .eq('refund_credit_issued', false);

          if (preordersError) {
            throw new Error(`Failed to fetch pre-orders: ${preordersError.message}`);
          }

          if (preorders && preorders.length > 0) {
            console.log(`Processing ${preorders.length} pre-orders for refund credits`);

            // Group pre-orders by user and calculate total refund
            const userRefunds = new Map<string, number>();
            const preorderIds: string[] = [];

            for (const preorder of preorders) {
              const refundAmount = refundPerUnit * preorder.quantity;
              const currentRefund = userRefunds.get(preorder.user_id) || 0;
              userRefunds.set(preorder.user_id, currentRefund + refundAmount);
              preorderIds.push(preorder.id);
            }

            // Update user credit balances
            for (const [userId, refundAmount] of userRefunds.entries()) {
              const { error: creditError } = await supabaseClient
                .from('user_profiles')
                .update({ 
                  reward_credit_balance: supabaseClient.sql`reward_credit_balance + ${refundAmount}`
                })
                .eq('id', userId);

              if (creditError) {
                console.error(`Failed to update credits for user ${userId}:`, creditError);
                // Log error but continue processing other users
              } else {
                console.log(`Updated credit balance for user ${userId}: +${refundAmount}`);
              }
            }

            // Mark pre-orders as refund issued
            const { error: updatePreordersError } = await supabaseClient
              .from('pre_orders')
              .update({ refund_credit_issued: true })
              .in('id', preorderIds);

            if (updatePreordersError) {
              throw new Error(`Failed to update pre-orders: ${updatePreordersError.message}`);
            }

            console.log(`Marked ${preorderIds.length} pre-orders as refund_credit_issued`);
          }
        }

        // After refund processing, queue emails for affected users
        const { data: preorders } = await supabaseClient
          .from('pre_orders')
          .select('user_id, amount_paid')
          .eq('design_id', design.id)
          .eq('status', 'charged');

        if (preorders) {
          for (const preorder of preorders) {
            // Get updated credit balance
            const { data: userData } = await supabaseClient
              .from('user_profiles')
              .select('reward_credit_balance')
              .eq('id', preorder.user_id)
              .single();

            await supabaseClient.rpc('queue_email', {
              p_user_id: preorder.user_id,
              p_template_type: 'REFUND_ISSUED',
              p_template_data: {
                design_name: design.title,
                tier: finalTier.toString(),
                refund_amount: refundPerUnit.toFixed(2),
                credit_balance: userData?.reward_credit_balance?.toFixed(2) || '0.00'
              }
            });
          }
        }

        // Update design status to 'in_production'
        const { error: updateDesignError } = await supabaseClient
          .from('design_submissions')
          .update({
            submission_status: 'in_production',
            current_active_tier: finalTier,
            potential_refund_per_unit: refundPerUnit
          })
          .eq('id', design.id);

        if (updateDesignError) {
          throw new Error(`Failed to update design: ${updateDesignError.message}`);
        }

        // ✅ NEW STEP: Calculate designer payout after refunds are processed
        console.log(`Calculating designer payout for design ${design.id}`);
        
        const { data: payoutResult, error: payoutError } = await supabaseClient
          .rpc('calculate_designer_payout', {
            design_uuid: design.id
          });

        if (payoutError) {
          console.error(`Payout calculation error for design ${design.id}:`, payoutError);
          // Log error but don't fail entire process
        } else if (payoutResult) {
          console.log(`Designer payout calculated:`, payoutResult);
          
          // Update designer earnings and quarterly bonus if payout is successful
          if (payoutResult.status === 'ready' || payoutResult.status === 'capped') {
            const payoutAmount = payoutResult.payout_amount;
            const designerId = payoutResult.details.designer_id;

            if (payoutAmount > 0) {
              const { error: earningsError } = await supabaseClient
                .from('user_profiles')
                .update({
                  total_earnings: supabaseClient.sql`total_earnings + ${payoutAmount}`,
                  current_quarter_bonus_earned: supabaseClient.sql`current_quarter_bonus_earned + ${payoutAmount}`
                })
                .eq('id', designerId);

              if (earningsError) {
                console.error(`Failed to update designer earnings:`, earningsError);
              } else {
                console.log(`Updated designer ${designerId} earnings: +${payoutAmount}`);
              }
            }
          }
        }

        console.log(`Successfully processed design ${design.id}`);
        processedDesigns.push(design.id);

      } catch (error) {
        console.error(`Error processing design ${design.id}:`, error);
        errors.push({
          designId: design.id,
          error: error.message || 'Unknown error'
        });
        // Continue with next design instead of stopping entire process
      }
    }

    const response = {
      processed: processedDesigns.length,
      designs: processedDesigns,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    console.log('Pre-order end processing completed:', response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Fatal error in pre-order end processing:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});