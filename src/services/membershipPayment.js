import { supabase } from '../lib/supabase';

/**
 * Creates a Stripe checkout session for membership payment
 * @param {Object} params - Payment parameters
 * @param {string} params.userId - User ID from Supabase auth
 * @param {string} params.priceId - Stripe Price ID for the membership plan
 * @param {string} params.email - User email
 * @returns {Promise<{url: string}>} - Checkout session URL
 */
export const createMembershipCheckout = async ({ userId, priceId, email }) => {
  try {
    const { data, error } = await supabase?.functions?.invoke('create-membership-payment', {
      body: {
        userId,
        priceId,
        email,
        successUrl: `${window.location?.origin}/member-hub-dashboard`,
        cancelUrl: `${window.location?.origin}/register`
      }
    });

    if (error) {
      console.error('Error creating membership checkout:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }

    return data;
  } catch (error) {
    console.error('Membership checkout error:', error);
    throw error;
  }
};

/**
 * Confirms membership payment was successful
 * @param {string} sessionId - Stripe checkout session ID
 * @returns {Promise<{success: boolean, membership: Object}>}
 */
export const confirmMembershipPayment = async (sessionId) => {
  try {
    const { data, error } = await supabase?.functions?.invoke('confirm-membership-payment', {
      body: { sessionId }
    });

    if (error) {
      console.error('Error confirming membership payment:', error);
      throw new Error(error.message || 'Failed to confirm payment');
    }

    return data;
  } catch (error) {
    console.error('Membership confirmation error:', error);
    throw error;
  }
};
function membershipPaymentService(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: membershipPaymentService is not implemented yet.', args);
  return null;
}

export { membershipPaymentService };