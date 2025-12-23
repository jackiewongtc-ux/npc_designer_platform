import { supabase } from '../lib/supabase';

/**
 * Email Service for queuing and managing notification emails
 */
export const emailService = {
  /**
   * Queue a pre-order confirmation email
   * @param {string} userId - User ID
   * @param {Object} data - Email template data
   * @param {string} data.designName - Design name
   * @param {string} data.designId - Design ID
   * @param {number} data.amount - Amount paid
   * @param {number} data.preorderCount - Current pre-order count
   * @param {string} data.size - Selected size
   * @returns {Promise<Object>} Queue result
   */
  async queuePreorderConfirmation(userId, data) {
    try {
      const { data: result, error } = await supabase?.rpc('queue_email', {
        p_user_id: userId,
        p_template_type: 'PREORDER_CONFIRMATION',
        p_template_data: {
          design_name: data?.designName,
          design_id: data?.designId,
          amount: data?.amount?.toFixed(2),
          preorder_count: data?.preorderCount?.toString(),
          size: data?.size
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, queueId: result };
    } catch (error) {
      console.error('Error queuing preorder confirmation email:', error);
      throw error;
    }
  },

  /**
   * Queue a tier achieved email
   * @param {string} userId - User ID
   * @param {Object} data - Email template data
   * @param {string} data.designName - Design name
   * @param {string} data.designId - Design ID
   * @param {number} data.tier - New tier number
   * @param {number} data.oldPrice - Previous price
   * @param {number} data.newPrice - New price
   * @param {number} data.refundAmount - Refund amount
   * @returns {Promise<Object>} Queue result
   */
  async queueTierAchieved(userId, data) {
    try {
      const { data: result, error } = await supabase?.rpc('queue_email', {
        p_user_id: userId,
        p_template_type: 'TIER_ACHIEVED',
        p_template_data: {
          design_name: data?.designName,
          design_id: data?.designId,
          tier: data?.tier?.toString(),
          old_price: data?.oldPrice?.toFixed(2),
          new_price: data?.newPrice?.toFixed(2),
          refund_amount: data?.refundAmount?.toFixed(2)
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, queueId: result };
    } catch (error) {
      console.error('Error queuing tier achieved email:', error);
      throw error;
    }
  },

  /**
   * Queue a refund issued email
   * @param {string} userId - User ID
   * @param {Object} data - Email template data
   * @param {string} data.designName - Design name
   * @param {number} data.tier - Final tier
   * @param {number} data.refundAmount - Refund amount
   * @param {number} data.creditBalance - New credit balance
   * @returns {Promise<Object>} Queue result
   */
  async queueRefundIssued(userId, data) {
    try {
      const { data: result, error } = await supabase?.rpc('queue_email', {
        p_user_id: userId,
        p_template_type: 'REFUND_ISSUED',
        p_template_data: {
          design_name: data?.designName,
          tier: data?.tier?.toString(),
          refund_amount: data?.refundAmount?.toFixed(2),
          credit_balance: data?.creditBalance?.toFixed(2)
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, queueId: result };
    } catch (error) {
      console.error('Error queuing refund issued email:', error);
      throw error;
    }
  },

  /**
   * Queue a payout sent email
   * @param {string} userId - User ID (designer)
   * @param {Object} data - Email template data
   * @param {string} data.designName - Design name
   * @param {number} data.amount - Payout amount
   * @param {number} data.totalEarnings - Total earnings to date
   * @returns {Promise<Object>} Queue result
   */
  async queuePayoutSent(userId, data) {
    try {
      const { data: result, error } = await supabase?.rpc('queue_email', {
        p_user_id: userId,
        p_template_type: 'PAYOUT_SENT',
        p_template_data: {
          design_name: data?.designName,
          amount: data?.amount?.toFixed(2),
          total_earnings: data?.totalEarnings?.toFixed(2)
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, queueId: result };
    } catch (error) {
      console.error('Error queuing payout sent email:', error);
      throw error;
    }
  },

  /**
   * Get email queue for current user
   * @param {Object} filters - Optional filters
   * @param {string} filters.status - Filter by status
   * @param {string} filters.templateType - Filter by template type
   * @returns {Promise<Array>} Email queue items
   */
  async getUserEmailQueue(filters = {}) {
    try {
      let query = supabase?.from('email_queue')?.select('*')?.order('created_at', { ascending: false });

      if (filters?.status) {
        query = query?.eq('status', filters?.status);
      }

      if (filters?.templateType) {
        query = query?.eq('template_type', filters?.templateType);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching email queue:', error);
      throw error;
    }
  },

  /**
   * Get email templates (for admin)
   * @returns {Promise<Array>} Email templates
   */
  async getEmailTemplates() {
    try {
      const { data, error } = await supabase?.from('email_templates')?.select('*')?.order('template_type');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }
  },

  /**
   * Update email template (admin only)
   * @param {string} templateId - Template ID
   * @param {Object} updates - Template updates
   * @returns {Promise<Object>} Updated template
   */
  async updateEmailTemplate(templateId, updates) {
    try {
      const { data, error } = await supabase?.from('email_templates')?.update(updates)?.eq('id', templateId)?.select()?.single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
  }
};