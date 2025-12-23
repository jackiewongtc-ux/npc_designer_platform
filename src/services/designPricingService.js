import { supabase } from '../lib/supabase';

export const designPricingService = {
  /**
   * Get design with pricing data by ID
   * @param {string} designId - Design submission ID
   * @returns {Promise<Object>} Design with pricing data
   */
  async getDesignById(designId) {
    const { data, error } = await supabase?.from('design_submissions')?.select('*')?.eq('id', designId)?.single();

    if (error) throw error;

    // Convert snake_case to camelCase for React
    return {
      id: data?.id,
      title: data?.title,
      description: data?.description,
      submissionStatus: data?.submission_status,
      tieredPricingData: data?.tiered_pricing_data,
      currentActiveTier: data?.current_active_tier,
      potentialRefundPerUnit: data?.potential_refund_per_unit,
      preorderStartDate: data?.preorder_start_date,
      productionTimelineEst: data?.production_timeline_est,
      imageUrls: data?.image_urls,
      createdAt: data?.created_at,
      votesCount: data?.votes_count
    };
  },

  /**
   * Get system settings for supplier list configuration
   * @returns {Promise<Object>} System settings
   */
  async getSupplierSettings() {
    const { data, error } = await supabase?.from('system_settings')?.select('*')?.eq('setting_key', 'supplier_list')?.single();

    if (error && error?.code !== 'PGRST116') throw error; // PGRST116 = not found

    return data ? data?.setting_value : null;
  },

  /**
   * Update design tiered pricing data
   * @param {string} designId - Design submission ID
   * @param {Object} pricingData - Tiered pricing configuration
   * @returns {Promise<Object>} Updated design
   */
  async updateDesignPricing(designId, pricingData) {
    const { data, error } = await supabase?.from('design_submissions')?.update({
        tiered_pricing_data: pricingData
      })?.eq('id', designId)?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      tieredPricingData: data?.tiered_pricing_data
    };
  },

  /**
   * Launch pre-order for a design
   * @param {string} designId - Design submission ID
   * @param {Object} pricingData - Tiered pricing configuration
   * @returns {Promise<Object>} Updated design
   */
  async launchPreOrder(designId, pricingData) {
    const { data, error } = await supabase?.from('design_submissions')?.update({
        tiered_pricing_data: pricingData,
        submission_status: 'pre-order',
        preorder_start_date: new Date()?.toISOString()
      })?.eq('id', designId)?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      submissionStatus: data?.submission_status,
      preorderStartDate: data?.preorder_start_date,
      tieredPricingData: data?.tiered_pricing_data
    };
  }
};