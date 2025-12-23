import { supabase } from '../lib/supabase';

export const profileService = {
  /**
   * FIX: Add getCurrentProfile method (was missing, causing "not a function" error)
   */
  async getCurrentProfile() {
    try {
      const { data: { user }, error: authError } = await supabase?.auth?.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.select(`
          id,
          username,
          bio,
          profile_pic,
          user_tier,
          user_exp,
          badges,
          achievements_unlocked,
          followers_count,
          ig_handle,
          email,
          role,
          created_at
        `)
        ?.eq('id', user?.id)
        ?.maybeSingle(); // FIX: Use maybeSingle() to handle missing profile

      if (error) throw error;
      
      // FIX: Handle case when profile doesn't exist yet
      if (!data) {
        return {
          id: user?.id,
          email: user?.email,
          username: null,
          bio: null,
          profilePic: null,
          userTier: 'newcomer',
          userExp: 0,
          badges: [],
          achievementsUnlocked: [],
          followersCount: 0,
          igHandle: null,
          role: 'consumer',
          createdAt: new Date()?.toISOString()
        };
      }

      // Convert snake_case to camelCase
      return {
        id: data?.id,
        username: data?.username,
        bio: data?.bio,
        profilePic: data?.profile_pic,
        userTier: data?.user_tier,
        userExp: data?.user_exp,
        badges: data?.badges || [],
        achievementsUnlocked: data?.achievements_unlocked || [],
        followersCount: data?.followers_count || 0,
        igHandle: data?.ig_handle,
        email: data?.email,
        role: data?.role,
        createdAt: data?.created_at
      };
    } catch (error) {
      console.error('Error fetching current profile:', error);
      throw error;
    }
  },

  /**
   * Fetch designer profile by ID with all relevant data
   */
  async getDesignerProfile(designerId) {
    try {
      const { data, error } = await supabase
        ?.from('user_profiles')
        ?.select(`
          id,
          username,
          bio,
          profile_pic,
          user_tier,
          user_exp,
          badges,
          achievements_unlocked,
          followers_count,
          ig_handle,
          created_at
        `)
        ?.eq('id', designerId)
        ?.maybeSingle(); // FIX: Use maybeSingle()

      if (error) throw error;
      
      // FIX: Handle not found case
      if (!data) {
        throw new Error('Designer profile not found');
      }

      // Convert snake_case to camelCase
      return {
        id: data?.id,
        username: data?.username,
        bio: data?.bio,
        profilePic: data?.profile_pic,
        userTier: data?.user_tier,
        userExp: data?.user_exp,
        badges: data?.badges || [],
        achievementsUnlocked: data?.achievements_unlocked || [],
        followersCount: data?.followers_count || 0,
        igHandle: data?.ig_handle,
        createdAt: data?.created_at
      };
    } catch (error) {
      console.error('Error fetching designer profile:', error);
      throw error;
    }
  },

  /**
   * Fetch all designs submitted by a designer
   */
  async getDesignerDesigns(designerId, filters = {}) {
    try {
      let query = supabase?.from('design_submissions')?.select(`
          id,
          title,
          description,
          category,
          image_urls,
          votes_count,
          submission_status,
          created_at,
          submitted_at
        `)?.eq('designer_id', designerId)?.neq('submission_status', 'draft')?.order('created_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query?.eq('category', filters?.category);
      }

      if (filters?.sortBy === 'popularity') {
        query = query?.order('votes_count', { ascending: false });
      } else if (filters?.sortBy === 'recent') {
        query = query?.order('submitted_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Convert snake_case to camelCase
      return data?.map(design => ({
        id: design?.id,
        title: design?.title,
        description: design?.description,
        category: design?.category,
        imageUrls: design?.image_urls || [],
        votesCount: design?.votes_count || 0,
        submissionStatus: design?.submission_status,
        createdAt: design?.created_at,
        submittedAt: design?.submitted_at
      }));
    } catch (error) {
      console.error('Error fetching designer designs:', error);
      throw error;
    }
  },

  /**
   * Get designer statistics
   */
  async getDesignerStats(designerId) {
    try {
      const { data, error } = await supabase?.from('design_submissions')?.select('id, submission_status, votes_count')?.eq('designer_id', designerId)?.neq('submission_status', 'draft');

      if (error) throw error;

      const totalDesigns = data?.length;
      const totalVotes = data?.reduce((sum, design) => sum + (design?.votes_count || 0), 0);
      const inProduction = data?.filter(d => d?.submission_status === 'in_production')?.length;
      const completed = data?.filter(d => d?.submission_status === 'completed')?.length;

      return {
        totalDesigns,
        totalVotes,
        inProduction,
        completed
      };
    } catch (error) {
      console.error('Error fetching designer stats:', error);
      throw error;
    }
  },

  /**
   * Toggle follow/unfollow for a designer (requires authentication)
   */
  async toggleFollow(designerId) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      // This is a placeholder - you would implement a follows table
      // For now, we'll just return success
      return { success: true };
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  }
};

/**
 * Get current user profile (for test compatibility)
 * @returns {Promise<Object>} User profile
 */
export const getCurrentUserProfile = async () => {
  return profileService?.getCurrentProfile();
};

/**
 * Update user profile (for test compatibility)
 * @param {Object} updates - Profile updates
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (updates) => {
  try {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('user_profiles')?.update({
        username: updates?.username,
        bio: updates?.bio,
        ig_handle: updates?.igHandle,
        profile_pic: updates?.profilePic,
        body_measurements: updates?.body_measurements,
        preferred_tshirt_size: updates?.preferred_tshirt_size,
        preferred_shipping_address: updates?.preferred_shipping_address
      })?.eq('id', user?.id)?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      username: data?.username,
      bio: data?.bio,
      profilePic: data?.profile_pic,
      userTier: data?.user_tier,
      userExp: data?.user_exp,
      badges: data?.badges || [],
      achievementsUnlocked: data?.achievements_unlocked || [],
      followersCount: data?.followers_count || 0,
      igHandle: data?.ig_handle,
      email: data?.email,
      role: data?.role,
      bodyMeasurements: data?.body_measurements,
      preferredTshirtSize: data?.preferred_tshirt_size,
      preferredShippingAddress: data?.preferred_shipping_address,
      createdAt: data?.created_at,
      updatedAt: data?.updated_at
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};