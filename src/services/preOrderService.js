import { supabase } from '../lib/supabase';

/**
 * Service for managing pre-orders
 * Handles pre-order creation, updates, and retrieval with proper snake_case/camelCase conversion
 */
export const preOrderService = {
  /**
   * Get design tier pricing data
   * @param {string} designId - Design submission ID
   * @returns {Promise<Object>} Tier pricing information
   */
  async getDesignTierPricing(designId) {
    try {
      const { data, error } = await supabase
        ?.from('design_submissions')
        ?.select('tiered_pricing_data, current_active_tier')
        ?.eq('id', designId)
        ?.single();

      if (error) throw error;

      const tiers = data?.tiered_pricing_data || [];
      const currentTier = data?.current_active_tier || 1;
      const currentTierData = tiers?.find(t => t?.tier === currentTier);

      return {
        tiers,
        currentTier,
        currentPrice: currentTierData?.price || tiers?.[0]?.price || 29.99
      };
    } catch (error) {
      console.error('Error getting design tier pricing:', error);
      throw error;
    }
  },

  /**
   * Get user's shipping details from profile
   * @returns {Promise<Object>} User's shipping details
   */
  async getUserShippingDetails() {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.select('email, preferred_shipping_address')
        ?.eq('id', user?.id)
        ?.single();

      if (error) throw error;

      // Parse shipping address if it's stored as JSON
      const address = data?.preferred_shipping_address ? 
        (typeof data?.preferred_shipping_address === 'string' ? 
          JSON.parse(data?.preferred_shipping_address) : 
          data?.preferred_shipping_address) : null;

      return {
        email: data?.email,
        fullName: address?.fullName || address?.name || '',
        phone: address?.phone || '',
        address: address?.address || address?.address_line_1 || '',
        city: address?.city || '',
        state: address?.state || '',
        zipCode: address?.zipCode || address?.postal_code || '',
        country: address?.country || 'US'
      };
    } catch (error) {
      console.error('Error getting user shipping details:', error);
      return null;
    }
  },

  /**
   * Create Stripe Checkout Session for pre-order
   * @param {Object} orderData - Pre-order and shipping data
   * @returns {Promise<Object>} Checkout session URL and ID
   */
  async createCheckoutSession(orderData) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.functions?.invoke('create-preorder-checkout', {
        body: {
          designId: orderData?.designId,
          designTitle: orderData?.designTitle,
          size: orderData?.size,
          quantity: orderData?.quantity,
          amount: orderData?.amount,
          tier1Price: orderData?.tier1Price,
          shippingDetails: orderData?.shippingDetails,
          userId: user?.id
        }
      });

      if (error) throw error;

      return {
        sessionUrl: data?.url,
        sessionId: data?.sessionId
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        error: error?.message || 'Failed to create checkout session'
      };
    }
  },

  /**
   * Create a new pre-order
   * @param {Object} orderData - Pre-order data
   * @param {string} orderData.designId - Design submission ID
   * @param {string} orderData.size - Size selection
   * @param {number} orderData.quantity - Quantity
   * @param {number} orderData.totalAmount - Total amount
   * @returns {Promise<Object>} Created pre-order
   */
  async create(orderData) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('pre_orders')?.insert({
          design_id: orderData?.designId,
          user_id: user?.id,
          size: orderData?.size,
          quantity: orderData?.quantity,
          total_amount: orderData?.totalAmount,
          status: 'pending'
        })?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        designId: data?.design_id,
        userId: data?.user_id,
        size: data?.size,
        quantity: data?.quantity,
        totalAmount: data?.total_amount,
        status: data?.status,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error creating pre-order:', error);
      throw error;
    }
  },

  /**
   * Get user's pre-orders
   * @returns {Promise<Array>} Array of user's pre-orders
   */
  async getUserPreOrders() {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('pre_orders')?.select(`
          *,
          design_submissions!pre_orders_design_id_fkey (
            id,
            title,
            image_urls
          )
        `)?.eq('user_id', user?.id)?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(order => ({
        id: order?.id,
        designId: order?.design_id,
        userId: order?.user_id,
        size: order?.size,
        quantity: order?.quantity,
        totalAmount: order?.total_amount,
        status: order?.status,
        createdAt: order?.created_at,
        updatedAt: order?.updated_at,
        design: {
          id: order?.design_submissions?.id,
          title: order?.design_submissions?.title,
          imageUrls: order?.design_submissions?.image_urls
        }
      })) || [];
    } catch (error) {
      console.error('Error getting user pre-orders:', error);
      throw error;
    }
  },

  /**
   * Get pre-orders for a specific design
   * @param {string} designId - Design submission ID
   * @returns {Promise<Array>} Array of pre-orders for the design
   */
  async getDesignPreOrders(designId) {
    try {
      const { data, error } = await supabase?.from('pre_orders')?.select('*')?.eq('design_id', designId)?.order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(order => ({
        id: order?.id,
        designId: order?.design_id,
        userId: order?.user_id,
        size: order?.size,
        quantity: order?.quantity,
        totalAmount: order?.total_amount,
        status: order?.status,
        createdAt: order?.created_at,
        updatedAt: order?.updated_at
      })) || [];
    } catch (error) {
      console.error('Error getting design pre-orders:', error);
      throw error;
    }
  },

  /**
   * Update pre-order status
   * @param {string} orderId - Pre-order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated pre-order
   */
  async updateStatus(orderId, status) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase?.from('pre_orders')?.update({ status })?.eq('id', orderId)?.eq('user_id', user?.id)?.select()?.single();

      if (error) throw error;

      return {
        id: data?.id,
        designId: data?.design_id,
        userId: data?.user_id,
        size: data?.size,
        quantity: data?.quantity,
        totalAmount: data?.total_amount,
        status: data?.status,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error updating pre-order status:', error);
      throw error;
    }
  },

  /**
   * Cancel a pre-order
   * @param {string} orderId - Pre-order ID
   * @returns {Promise<void>}
   */
  async cancel(orderId) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase?.from('pre_orders')?.delete()?.eq('id', orderId)?.eq('user_id', user?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error canceling pre-order:', error);
      throw error;
    }
  },

  /**
   * Get pre-order statistics for a design
   * @param {string} designId - Design submission ID
   * @returns {Promise<Object>} Pre-order statistics
   */
  async getPreOrderStats(designId) {
    try {
      const { data, error } = await supabase?.from('pre_orders')?.select('quantity, size')?.eq('design_id', designId);

      if (error) throw error;

      const totalOrders = data?.length || 0;
      const totalQuantity = data?.reduce((sum, order) => sum + order?.quantity, 0) || 0;
      const sizeBreakdown = data?.reduce((acc, order) => {
        acc[order.size] = (acc?.[order?.size] || 0) + order?.quantity;
        return acc;
      }, {}) || {};

      return {
        totalOrders,
        totalQuantity,
        sizeBreakdown
      };
    } catch (error) {
      console.error('Error getting pre-order stats:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time pre-order changes for a design
   * @param {string} designId - Design submission ID
   * @param {Function} callback - Callback function to handle changes
   * @returns {Object} Subscription channel
   */
  subscribeToPreOrders(designId, callback) {
    const channel = supabase
      ?.channel(`pre_orders_${designId}`)
      ?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pre_orders',
          filter: `design_id=eq.${designId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      ?.subscribe();

    return channel;
  }
};

export default preOrderService;

/**
 * Create pre-order checkout session (for test compatibility)
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Checkout session result
 */
export const createPreOrderCheckout = async (orderData) => {
  return preOrderService?.createCheckoutSession(orderData);
};