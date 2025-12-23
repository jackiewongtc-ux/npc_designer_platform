import { supabase } from '../lib/supabase';

/**
 * Design Submission Service
 * Handles all design submission CRUD operations with proper case conversion
 */
export const designService = {
  /**
   * Get all submissions for current user
   */
  async getUserSubmissions() {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('design_submissions')?.select('*')?.eq('designer_id', user?.id)?.order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(row => ({
      id: row?.id,
      designerId: row?.designer_id,
      title: row?.title,
      description: row?.description,
      category: row?.category,
      materials: row?.materials,
      sizingInfo: row?.sizing_info,
      productionNotes: row?.production_notes,
      submissionStatus: row?.submission_status,
      imageUrls: row?.image_urls || [],
      votesCount: row?.votes_count,
      createdAt: row?.created_at,
      updatedAt: row?.updated_at,
      submittedAt: row?.submitted_at,
      reviewStartedAt: row?.review_started_at,
      votingStartedAt: row?.voting_started_at,
      productionStartedAt: row?.production_started_at,
      completedAt: row?.completed_at
    })) || [];
  },

  /**
   * Get single submission by ID
   */
  async getSubmission(submissionId) {
    const { data, error } = await supabase?.from('design_submissions')?.select('*')?.eq('id', submissionId)?.single();

    if (error) throw error;

    return {
      id: data?.id,
      designerId: data?.designer_id,
      title: data?.title,
      description: data?.description,
      category: data?.category,
      materials: data?.materials,
      sizingInfo: data?.sizing_info,
      productionNotes: data?.production_notes,
      submissionStatus: data?.submission_status,
      imageUrls: data?.image_urls || [],
      votesCount: data?.votes_count,
      tieredPricingData: data?.tiered_pricing_data,
      baseProductionCost: data?.base_production_cost,
      estimatedShippingCost: data?.estimated_shipping_cost,
      adminNotes: data?.admin_notes,
      createdAt: data?.created_at,
      updatedAt: data?.updated_at,
      submittedAt: data?.submitted_at,
      reviewStartedAt: data?.review_started_at,
      votingStartedAt: data?.voting_started_at,
      productionStartedAt: data?.production_started_at,
      completedAt: data?.completed_at
    };
  },

  /**
   * Create new design submission (draft)
   */
  async createSubmission(submissionData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('design_submissions')?.insert({
        designer_id: user?.id,
        title: submissionData?.title,
        description: submissionData?.description,
        category: submissionData?.category,
        materials: submissionData?.materials,
        sizing_info: submissionData?.sizingInfo,
        production_notes: submissionData?.productionNotes,
        image_urls: submissionData?.imageUrls || [],
        submission_status: 'draft'
      })?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      designerId: data?.designer_id,
      title: data?.title,
      description: data?.description,
      category: data?.category,
      materials: data?.materials,
      sizingInfo: data?.sizing_info,
      productionNotes: data?.production_notes,
      submissionStatus: data?.submission_status,
      imageUrls: data?.image_urls || [],
      votesCount: data?.votes_count,
      createdAt: data?.created_at
    };
  },

  /**
   * Update existing submission
   */
  async updateSubmission(submissionId, updates) {
    const { data, error } = await supabase?.from('design_submissions')?.update({
        title: updates?.title,
        description: updates?.description,
        category: updates?.category,
        materials: updates?.materials,
        sizing_info: updates?.sizingInfo,
        production_notes: updates?.productionNotes,
        image_urls: updates?.imageUrls
      })?.eq('id', submissionId)?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      designerId: data?.designer_id,
      title: data?.title,
      description: data?.description,
      category: data?.category,
      materials: data?.materials,
      sizingInfo: data?.sizing_info,
      productionNotes: data?.production_notes,
      submissionStatus: data?.submission_status,
      imageUrls: data?.image_urls || [],
      votesCount: data?.votes_count,
      updatedAt: data?.updated_at
    };
  },

  /**
   * Submit design for review
   */
  async submitForReview(submissionId) {
    const { data, error } = await supabase?.from('design_submissions')?.update({
        submission_status: 'pending_review',
        submitted_at: new Date()?.toISOString()
      })?.eq('id', submissionId)?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      submissionStatus: data?.submission_status,
      submittedAt: data?.submitted_at
    };
  },

  /**
   * Delete submission
   */
  async deleteSubmission(submissionId) {
    const { error } = await supabase?.from('design_submissions')?.delete()?.eq('id', submissionId);

    if (error) throw error;
  },

  /**
   * Upload design image
   */
  async uploadImage(file, userId) {
    if (!file) throw new Error('No file provided');

    // Generate unique filename
    const fileExt = file?.name?.split('.')?.pop();
    const fileName = `${Date.now()}-${Math.random()?.toString(36)?.substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase?.storage?.from('design-images')?.upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase?.storage?.from('design-images')?.getPublicUrl(filePath);

    return {
      path: data?.path,
      url: urlData?.publicUrl
    };
  },

  /**
   * Delete design image
   */
  async deleteImage(imagePath) {
    const { error } = await supabase?.storage?.from('design-images')?.remove([imagePath]);

    if (error) throw error;
  },

  /**
   * Get design categories
   */
  getCategories() {
    return [
      { value: 'apparel', label: 'Apparel', icon: '👕' },
      { value: 'accessories', label: 'Accessories', icon: '👜' },
      { value: 'footwear', label: 'Footwear', icon: '👟' },
      { value: 'outerwear', label: 'Outerwear', icon: '🧥' },
      { value: 'activewear', label: 'Activewear', icon: '🏃' },
      { value: 'loungewear', label: 'Loungewear', icon: '🛋️' }
    ];
  },

  /**
   * Get status display info
   */
  getStatusInfo(status) {
    const statusMap = {
      draft: {
        label: 'Draft',
        color: 'gray',
        description: 'Design is being created'
      },
      pending_review: {
        label: 'Pending Review',
        color: 'yellow',
        description: 'Submitted for team review'
      },
      community_voting: {
        label: 'Community Voting',
        color: 'blue',
        description: 'Open for community votes'
      },
      in_production: {
        label: 'In Production',
        color: 'purple',
        description: 'Being manufactured'
      },
      completed: {
        label: 'Completed',
        color: 'green',
        description: 'Available for purchase'
      },
      rejected: {
        label: 'Rejected',
        color: 'red',
        description: 'Did not meet requirements'
      }
    };

    return statusMap?.[status] || statusMap?.draft;
  },

  /**
   * Subscribe to real-time design submission changes
   * @param {string} designId - Design submission ID
   * @param {Function} callback - Callback function to handle changes
   * @returns {Object} Subscription channel
   */
  subscribeToDesignChanges(designId, callback) {
    const channel = supabase
      ?.channel(`design_submission_${designId}`)
      ?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'design_submissions',
          filter: `id=eq.${designId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      ?.subscribe();

    return channel;
  }
};

/**
 * Get all designs with optional filters (for test compatibility)
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of designs
 */
export const getDesigns = async (options = {}) => {
  try {
    let query = supabase?.from('design_submissions')?.select('*')?.neq('submission_status', 'draft')?.order('created_at', { ascending: false });

    if (options?.limit) {
      query = query?.limit(options?.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(row => ({
      id: row?.id,
      designerId: row?.designer_id,
      title: row?.title,
      description: row?.description,
      category: row?.category,
      materials: row?.materials,
      sizingInfo: row?.sizing_info,
      productionNotes: row?.production_notes,
      submissionStatus: row?.submission_status,
      imageUrls: row?.image_urls || [],
      votesCount: row?.votes_count,
      createdAt: row?.created_at,
      updatedAt: row?.updated_at
    })) || [];
  } catch (error) {
    console.error('Error fetching designs:', error);
    throw error;
  }
};

/**
 * Get single design by ID (for test compatibility)
 * @param {string} designId - Design ID
 * @returns {Promise<Object>} Design details
 */
export const getDesignById = async (designId) => {
  return designService?.getSubmission(designId);
};