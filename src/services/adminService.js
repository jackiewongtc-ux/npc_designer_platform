import { supabase } from '../lib/supabase';

/**
 * Admin Service
 * Comprehensive admin operations for design review, pricing, transactions, user management, and system settings
 */

// ==================== DESIGN REVIEW WORKFLOW ====================

/**
 * Get designs by status for admin review
 * @param {string} status - Design submission status
 * @returns {Promise<Array>} Filtered designs
 */
export const getDesignsByStatus = async (status) => {
  try {
    const { data, error } = await supabase
      ?.from('design_submissions')
      ?.select(`
        *,
        designer:user_profiles(
          id,
          username,
          email,
          role
        )
      `)
      ?.eq('submission_status', status)
      ?.order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(design => ({
      id: design?.id,
      title: design?.title,
      description: design?.description,
      submissionStatus: design?.submission_status,
      category: design?.category,
      imageUrls: design?.image_urls,
      materials: design?.materials,
      votesCount: design?.votes_count,
      createdAt: design?.created_at,
      submittedAt: design?.submitted_at,
      reviewStartedAt: design?.review_started_at,
      votingStartedAt: design?.voting_started_at,
      designer: design?.designer ? {
        id: design?.designer?.id,
        username: design?.designer?.username,
        email: design?.designer?.email,
        role: design?.designer?.role
      } : null
    })) || [];
  } catch (error) {
    console.error('Error fetching designs by status:', error);
    throw error;
  }
};

/**
 * Approve design - move to voting status
 * @param {string} designId - Design ID
 * @returns {Promise<Object>} Updated design
 */
export const approveDesign = async (designId) => {
  try {
    const { data, error } = await supabase
      ?.from('design_submissions')
      ?.update({
        submission_status: 'community_voting',
        voting_started_at: new Date()?.toISOString(),
        review_started_at: new Date()?.toISOString()
      })
      ?.eq('id', designId)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      submissionStatus: data?.submission_status,
      votingStartedAt: data?.voting_started_at
    };
  } catch (error) {
    console.error('Error approving design:', error);
    throw error;
  }
};

/**
 * Reject design with reason
 * @param {string} designId - Design ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Updated design
 */
export const rejectDesign = async (designId, reason) => {
  try {
    const { data, error } = await supabase
      ?.from('design_submissions')
      ?.update({
        submission_status: 'rejected',
        production_notes: reason,
        review_started_at: new Date()?.toISOString()
      })
      ?.eq('id', designId)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      submissionStatus: data?.submission_status,
      productionNotes: data?.production_notes
    };
  } catch (error) {
    console.error('Error rejecting design:', error);
    throw error;
  }
};

/**
 * Flag design for IP review
 * @param {string} designId - Design ID
 * @returns {Promise<Object>} Updated design
 */
export const flagDesignForReview = async (designId) => {
  try {
    const { data, error } = await supabase
      ?.from('design_submissions')
      ?.update({
        submission_status: 'pending_review',
        review_started_at: new Date()?.toISOString()
      })
      ?.eq('id', designId)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      submissionStatus: data?.submission_status
    };
  } catch (error) {
    console.error('Error flagging design for review:', error);
    throw error;
  }
};

// ==================== PRICING DASHBOARD ====================

/**
 * Set tiered pricing for a design
 * @param {string} designId - Design ID
 * @param {Object} pricingData - Tiered pricing configuration
 * @returns {Promise<Object>} Updated design
 */
export const setDesignPricing = async (designId, pricingData) => {
  try {
    // Validate pricing tiers (Tier2 must be < Tier1)
    if (pricingData?.tiers && pricingData?.tiers?.length >= 2) {
      const tier1Price = parseFloat(pricingData?.tiers?.[0]?.price);
      const tier2Price = parseFloat(pricingData?.tiers?.[1]?.price);
      
      if (tier2Price >= tier1Price) {
        throw new Error('Validation Error: Tier 2 price must be less than Tier 1 price');
      }
    }

    const { data, error } = await supabase
      ?.from('design_submissions')
      ?.update({
        tiered_pricing_data: pricingData
      })
      ?.eq('id', designId)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      tieredPricingData: data?.tiered_pricing_data
    };
  } catch (error) {
    console.error('Error setting design pricing:', error);
    throw error;
  }
};

/**
 * Launch pre-order for a design
 * @param {string} designId - Design ID
 * @returns {Promise<Object>} Updated design
 */
export const launchPreOrder = async (designId) => {
  try {
    const { data, error } = await supabase
      ?.from('design_submissions')
      ?.update({
        submission_status: 'in_production',
        preorder_start_date: new Date()?.toISOString()
      })
      ?.eq('id', designId)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      submissionStatus: data?.submission_status,
      preorderStartDate: data?.preorder_start_date
    };
  } catch (error) {
    console.error('Error launching pre-order:', error);
    throw error;
  }
};

// ==================== TRANSACTION MONITORING ====================

/**
 * Get all pre-orders with details
 * @returns {Promise<Array>} Pre-orders list
 */
export const getAllPreOrders = async () => {
  try {
    const { data, error } = await supabase
      ?.from('pre_orders')
      ?.select(`
        *,
        user:user_profiles(id, username, email),
        design:design_submissions(id, title, designer_id)
      `)
      ?.order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(order => ({
      id: order?.id,
      size: order?.size,
      quantity: order?.quantity,
      status: order?.status,
      totalAmount: order?.total_amount,
      amountPaid: order?.amount_paid,
      refundCreditIssued: order?.refund_credit_issued,
      shippingAddress: order?.shipping_address,
      stripePaymentIntentId: order?.stripe_payment_intent_id,
      createdAt: order?.created_at,
      user: order?.user ? {
        id: order?.user?.id,
        username: order?.user?.username,
        email: order?.user?.email
      } : null,
      design: order?.design ? {
        id: order?.design?.id,
        title: order?.design?.title,
        designerId: order?.design?.designer_id
      } : null
    })) || [];
  } catch (error) {
    console.error('Error fetching all pre-orders:', error);
    throw error;
  }
};

/**
 * Get all refunds issued
 * @returns {Promise<Array>} Refunded orders
 */
export const getAllRefunds = async () => {
  try {
    const { data, error } = await supabase
      ?.from('pre_orders')
      ?.select(`
        *,
        user:user_profiles(id, username, email),
        design:design_submissions(id, title)
      `)
      ?.eq('status', 'refunded')
      ?.order('updated_at', { ascending: false });

    if (error) throw error;

    return data?.map(order => ({
      id: order?.id,
      totalAmount: order?.total_amount,
      refundCreditIssued: order?.refund_credit_issued,
      updatedAt: order?.updated_at,
      user: order?.user ? {
        id: order?.user?.id,
        username: order?.user?.username,
        email: order?.user?.email
      } : null,
      design: order?.design ? {
        id: order?.design?.id,
        title: order?.design?.title
      } : null
    })) || [];
  } catch (error) {
    console.error('Error fetching refunds:', error);
    throw error;
  }
};

/**
 * Get all designer payouts
 * @returns {Promise<Array>} Payout records
 */
export const getDesignerPayouts = async () => {
  try {
    const { data, error } = await supabase
      ?.from('payouts')
      ?.select(`
        *,
        designer:user_profiles(id, username, email),
        design:design_submissions(id, title)
      `)
      ?.order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(payout => ({
      id: payout?.id,
      amount: payout?.amount,
      status: payout?.status,
      stripeTransferId: payout?.stripe_transfer_id,
      errorMessage: payout?.error_message,
      metadata: payout?.metadata,
      createdAt: payout?.created_at,
      designer: payout?.designer ? {
        id: payout?.designer?.id,
        username: payout?.designer?.username,
        email: payout?.designer?.email
      } : null,
      design: payout?.design ? {
        id: payout?.design?.id,
        title: payout?.design?.title
      } : null
    })) || [];
  } catch (error) {
    console.error('Error fetching designer payouts:', error);
    throw error;
  }
};

/**
 * Export financial data (CSV format data)
 * @param {string} startDate - Start date for export
 * @param {string} endDate - End date for export
 * @returns {Promise<Object>} Financial data summary
 */
export const exportFinancialData = async (startDate, endDate) => {
  try {
    // Get pre-orders in date range
    const { data: orders, error: ordersError } = await supabase
      ?.from('pre_orders')
      ?.select('*')
      ?.gte('created_at', startDate)
      ?.lte('created_at', endDate);

    if (ordersError) throw ordersError;

    // Get payouts in date range
    const { data: payouts, error: payoutsError } = await supabase
      ?.from('payouts')
      ?.select('*')
      ?.gte('created_at', startDate)
      ?.lte('created_at', endDate);

    if (payoutsError) throw payoutsError;

    // Calculate totals
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order?.total_amount || 0), 0);
    const totalPayouts = payouts?.reduce((sum, payout) => sum + parseFloat(payout?.amount || 0), 0);
    const totalRefunds = orders?.filter(o => o?.status === 'refunded')?.reduce((sum, order) => sum + parseFloat(order?.refund_credit_issued || 0), 0);

    return {
      startDate,
      endDate,
      totalOrders: orders?.length || 0,
      totalRevenue: totalRevenue?.toFixed(2),
      totalPayouts: totalPayouts?.toFixed(2),
      totalRefunds: totalRefunds?.toFixed(2),
      netProfit: (totalRevenue - totalPayouts - totalRefunds)?.toFixed(2),
      orders,
      payouts
    };
  } catch (error) {
    console.error('Error exporting financial data:', error);
    throw error;
  }
};

// ==================== MANUAL OVERRIDES ====================

/**
 * Force cancel a design
 * @param {string} designId - Design ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Updated design
 */
export const forceCancelDesign = async (designId, reason) => {
  try {
    const { data, error } = await supabase
      ?.from('design_submissions')
      ?.update({
        submission_status: 'rejected',
        production_notes: `FORCE CANCELLED: ${reason}`
      })
      ?.eq('id', designId)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      submissionStatus: data?.submission_status,
      productionNotes: data?.production_notes
    };
  } catch (error) {
    console.error('Error force cancelling design:', error);
    throw error;
  }
};

/**
 * Issue manual refund
 * @param {string} preOrderId - Pre-order ID
 * @param {number} refundAmount - Refund amount
 * @returns {Promise<Object>} Updated pre-order
 */
export const issueManualRefund = async (preOrderId, refundAmount) => {
  try {
    const { data, error } = await supabase
      ?.from('pre_orders')
      ?.update({
        status: 'refunded',
        refund_credit_issued: refundAmount
      })
      ?.eq('id', preOrderId)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      status: data?.status,
      refundCreditIssued: data?.refund_credit_issued
    };
  } catch (error) {
    console.error('Error issuing manual refund:', error);
    throw error;
  }
};

/**
 * Block/unblock user
 * @param {string} userId - User ID
 * @param {boolean} blocked - Block status
 * @returns {Promise<Object>} Updated user
 */
export const toggleUserBlock = async (userId, blocked) => {
  try {
    const { data, error } = await supabase
      ?.from('user_profiles')
      ?.update({
        is_blocked: blocked
      })
      ?.eq('id', userId)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      isBlocked: data?.is_blocked,
      username: data?.username
    };
  } catch (error) {
    console.error('Error toggling user block:', error);
    throw error;
  }
};

// ==================== USER MANAGEMENT ====================

/**
 * Get all users with filters
 * @param {Object} filters - Search and filter options
 * @returns {Promise<Array>} Users list
 */
export const getAllUsers = async (filters = {}) => {
  try {
    let query = supabase
      ?.from('user_profiles')
      ?.select('*')
      ?.order('created_at', { ascending: false });

    if (filters?.role) {
      query = query?.eq('role', filters?.role);
    }
    if (filters?.isBlocked !== undefined) {
      query = query?.eq('is_blocked', filters?.isBlocked);
    }
    if (filters?.searchTerm) {
      query = query?.or(`username.ilike.%${filters?.searchTerm}%,email.ilike.%${filters?.searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(user => ({
      id: user?.id,
      username: user?.username,
      email: user?.email,
      role: user?.role,
      userTier: user?.user_tier,
      isMember: user?.is_member,
      isBlocked: user?.is_blocked,
      totalEarnings: user?.total_earnings,
      rewardCreditBalance: user?.reward_credit_balance,
      createdAt: user?.created_at,
      membershipSignupDate: user?.membership_signup_date
    })) || [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Change user role
 * @param {string} userId - User ID
 * @param {string} newRole - New role (consumer/designer/admin)
 * @returns {Promise<Object>} Updated user
 */
export const changeUserRole = async (userId, newRole) => {
  try {
    const { data, error } = await supabase
      ?.from('user_profiles')
      ?.update({
        role: newRole
      })
      ?.eq('id', userId)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      username: data?.username,
      role: data?.role
    };
  } catch (error) {
    console.error('Error changing user role:', error);
    throw error;
  }
};

/**
 * Get user activity logs
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Activity logs
 */
export const getUserActivityLogs = async (userId) => {
  try {
    const { data, error } = await supabase
      ?.from('user_activities')
      ?.select('*')
      ?.eq('user_id', userId)
      ?.order('created_at', { ascending: false })
      ?.limit(50);

    if (error) throw error;

    return data?.map(activity => ({
      id: activity?.id,
      activityType: activity?.activity_type,
      title: activity?.title,
      description: activity?.description,
      expGained: activity?.exp_gained,
      isPublic: activity?.is_public,
      metadata: activity?.metadata,
      createdAt: activity?.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    throw error;
  }
};

// ==================== SYSTEM SETTINGS ====================

/**
 * Get all system settings
 * @returns {Promise<Array>} System settings
 */
export const getSystemSettings = async () => {
  try {
    const { data, error } = await supabase
      ?.from('system_settings')
      ?.select('*')
      ?.order('setting_key', { ascending: true });

    if (error) throw error;

    return data?.map(setting => ({
      id: setting?.id,
      settingKey: setting?.setting_key,
      settingValue: setting?.setting_value,
      description: setting?.description,
      updatedAt: setting?.updated_at
    })) || [];
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

/**
 * Update system setting
 * @param {string} settingKey - Setting key
 * @param {any} settingValue - Setting value (will be converted to JSONB)
 * @param {string} description - Setting description
 * @returns {Promise<Object>} Updated setting
 */
export const updateSystemSetting = async (settingKey, settingValue, description = null) => {
  try {
    const updateData = {
      setting_value: settingValue,
      updated_at: new Date()?.toISOString()
    };

    if (description) {
      updateData.description = description;
    }

    const { data, error } = await supabase
      ?.from('system_settings')
      ?.update(updateData)
      ?.eq('setting_key', settingKey)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      settingKey: data?.setting_key,
      settingValue: data?.setting_value,
      description: data?.description,
      updatedAt: data?.updated_at
    };
  } catch (error) {
    console.error('Error updating system setting:', error);
    throw error;
  }
};

/**
 * Get email templates
 * @returns {Promise<Array>} Email templates
 */
export const getEmailTemplates = async () => {
  try {
    const { data, error } = await supabase
      ?.from('email_templates')
      ?.select('*')
      ?.order('template_type', { ascending: true });

    if (error) throw error;

    return data?.map(template => ({
      id: template?.id,
      templateType: template?.template_type,
      subjectTemplate: template?.subject_template,
      bodyTemplate: template?.body_template,
      isActive: template?.is_active,
      updatedAt: template?.updated_at
    })) || [];
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }
};

/**
 * Update email template
 * @param {string} templateType - Template type
 * @param {Object} updates - Template updates
 * @returns {Promise<Object>} Updated template
 */
export const updateEmailTemplate = async (templateType, updates) => {
  try {
    const { data, error } = await supabase
      ?.from('email_templates')
      ?.update({
        subject_template: updates?.subjectTemplate,
        body_template: updates?.bodyTemplate,
        is_active: updates?.isActive,
        updated_at: new Date()?.toISOString()
      })
      ?.eq('template_type', templateType)
      ?.select()
      ?.single();

    if (error) throw error;

    return {
      id: data?.id,
      templateType: data?.template_type,
      subjectTemplate: data?.subject_template,
      bodyTemplate: data?.body_template,
      isActive: data?.is_active,
      updatedAt: data?.updated_at
    };
  } catch (error) {
    console.error('Error updating email template:', error);
    throw error;
  }
};
function adminService(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: adminService is not implemented yet.', args);
  return null;
}

export default adminService;