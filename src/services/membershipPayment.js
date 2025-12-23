import { supabase } from '../lib/supabase';

export const membershipPaymentService = {
  /**
   * Create a payment intent for membership signup
   * @param {Object} membershipData - Membership signup data
   * @param {Object} userInfo - User information
   * @returns {Promise<Object>} Payment intent details
   */
  async createMembershipPaymentIntent(membershipData, userInfo) {
    try {
      const { data, error } = await supabase?.functions?.invoke('create-membership-payment', {
        body: {
          membershipData,
          userInfo
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating membership payment intent:', error);
      throw error;
    }
  },

  /**
   * Confirm membership payment and create signup record
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Promise<Object>} Membership signup confirmation
   */
  async confirmMembershipPayment(paymentIntentId) {
    try {
      const { data, error } = await supabase?.functions?.invoke('confirm-membership-payment', {
        body: { paymentIntentId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error confirming membership payment:', error);
      throw error;
    }
  },

  /**
   * Get membership fee from system settings
   * @returns {Promise<number>} Membership fee in SGD
   */
  async getMembershipFee() {
    try {
      const { data, error } = await supabase?.from('system_settings')?.select('setting_value')?.eq('setting_key', 'membership_fee_sgd')?.single();

      if (error) throw error;
      return parseFloat(data?.setting_value || 10);
    } catch (error) {
      console.error('Error fetching membership fee:', error);
      return 10; // Default to SGD 10
    }
  },

  /**
   * Format amount for display
   * @param {number} amount - Amount in cents
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  formatAmount(amount, currency = 'SGD') {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: currency,
    })?.format(amount / 100);
  }
};