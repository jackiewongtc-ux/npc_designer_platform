import { supabase } from '../lib/supabase';

/**
 * Membership Payment Service
 * Handles all membership payment operations including checkout, confirmation, and payment intents
 */

const MEMBERSHIP_FEE_SGD = 10; // Annual membership fee in SGD

/**
 * Gets the current membership fee
 * @returns {Promise<number>} - Membership fee amount
 */
const getMembershipFee = async () => {
  try {
    // In production, this could fetch from database or config
    return MEMBERSHIP_FEE_SGD;
  } catch (error) {
    console.error('Error fetching membership fee:', error);
    return MEMBERSHIP_FEE_SGD; // Fallback to default
  }
};

/**
 * Formats amount for display with currency
 * @param {number} amount - Amount in cents
 * @param {string} currency - Currency code (e.g., 'SGD', 'USD')
 * @returns {string} - Formatted amount string
 */
const formatAmount = (amount, currency = 'SGD') => {
  try {
    const value = amount / 100; // Convert cents to dollars
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    })?.format(value);
  } catch (error) {
    console.error('Error formatting amount:', error);
    return `${currency} ${(amount / 100)?.toFixed(2)}`;
  }
};

/**
 * Creates a Stripe payment intent for membership
 * @param {Object} membershipData - Membership payment data
 * @param {string} membershipData.rewardSelection - Selected reward type
 * @param {number} membershipData.amount - Payment amount
 * @param {string} membershipData.currency - Currency code
 * @param {Object} userInfo - User information
 * @param {string} userInfo.userId - User ID
 * @param {string} userInfo.email - User email
 * @param {string} userInfo.username - Username
 * @returns {Promise<{clientSecret: string}>} - Payment intent client secret
 */
const createMembershipPaymentIntent = async (membershipData, userInfo) => {
  try {
    const { data, error } = await supabase?.functions?.invoke('create-membership-payment', {
      body: {
        userId: userInfo?.userId,
        email: userInfo?.email,
        username: userInfo?.username,
        amount: Math.round(membershipData?.amount * 100), // Convert to cents
        currency: membershipData?.currency || 'SGD',
        rewardSelection: membershipData?.rewardSelection,
        payment_type: 'membership', // Metadata for webhook
        successUrl: `${window?.location?.origin}/member-hub-dashboard`,
        cancelUrl: `${window?.location?.origin}/register`
      }
    });

    if (error) {
      console.error('Error creating membership payment intent:', error);
      throw new Error(error?.message || 'Failed to create payment intent');
    }

    return {
      clientSecret: data?.clientSecret
    };
  } catch (error) {
    console.error('Membership payment intent error:', error);
    throw error;
  }
};

/**
 * Confirms membership payment was successful
 * @param {string} sessionId - Stripe checkout session ID
 * @returns {Promise<{success: boolean, membership: Object}>}
 */
const confirmMembershipPayment = async (sessionId) => {
  try {
    const { data, error } = await supabase?.functions?.invoke('confirm-membership-payment', {
      body: { sessionId }
    });

    if (error) {
      console.error('Error confirming membership payment:', error);
      throw new Error(error?.message || 'Failed to confirm payment');
    }

    return data;
  } catch (error) {
    console.error('Membership confirmation error:', error);
    throw error;
  }
};

/**
 * Membership Payment Service Object
 * Contains all membership payment related methods
 */
const membershipPaymentService = {
  /**
   * Create a Stripe Checkout Session for membership payment
   * @param {Object} params - Payment parameters
   * @param {string} params.userId - User ID (optional for guest checkout)
   * @param {string} params.priceId - Stripe Price ID for membership
   * @param {string} params.email - User email
   * @param {Object} params.metadata - Additional metadata (optional)
   * @returns {Promise<{url: string}>} Checkout session URL
   */
  async createMembershipCheckout({ userId = null, priceId, email, metadata = {} }) {
    try {
      console.log('🚀 Starting Stripe Checkout session creation');
      console.log('📞 Calling create-membership-payment edge function:', {
        userId,
        priceId,
        email,
        hasMetadata: Object.keys(metadata)?.length > 0
      });

      const { data, error } = await supabase?.functions?.invoke('create-membership-payment', {
        body: { 
          userId, 
          priceId, 
          email,
          metadata 
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'Failed to create checkout session. Please try again.';
        
        if (error?.message?.includes('Stripe is not configured')) {
          errorMessage = 'Payment system is not configured. Please contact support.';
        } else if (error?.message?.includes('price ID')) {
          errorMessage = 'Invalid payment configuration. Please contact support.';
        } else if (error?.message?.includes('authentication')) {
          errorMessage = 'Payment authentication failed. Please contact support.';
        } else if (error?.message) {
          errorMessage = error?.message;
        }
        
        throw new Error(errorMessage);
      }

      if (!data?.url) {
        console.error('❌ No checkout URL returned from edge function');
        throw new Error('Failed to create checkout session. Please try again.');
      }

      console.log('✅ Checkout session created successfully');
      return data;
      
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      
      // Re-throw with user-friendly message
      throw new Error(
        error.message || 'Unable to create checkout session. Please check your internet connection and try again.'
      );
    }
  },

  getMembershipFee,
  formatAmount,
  createMembershipPaymentIntent,
  confirmMembershipPayment
};

export { membershipPaymentService };