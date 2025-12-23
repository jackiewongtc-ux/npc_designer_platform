import { supabase } from '../lib/supabase';

/**
 * Feed Service
 * Handles all curated design feed operations with proper snake_case ↔ camelCase conversion
 */

export const feedService = {
  /**
   * Get trending designs with high vote counts
   * @param {number} limit - Number of designs to fetch
   * @param {string} category - Optional category filter
   * @param {string} timeframe - Timeframe for trending (week, month, all)
   * @returns {Promise<Array>} Array of trending designs
   */
  async getTrendingDesigns(limit = 12, category = null, timeframe = 'week') {
    try {
      let query = supabase?.from('design_submissions')?.select(`
          *,
          designer:user_profiles!designer_id (
            id,
            username,
            profile_pic,
            user_tier,
            followers_count
          )
        `)?.neq('submission_status', 'draft')?.order('votes_count', { ascending: false })?.limit(limit);

      // Apply category filter if provided
      if (category) {
        query = query?.eq('category', category);
      }

      // Apply timeframe filter
      const now = new Date();
      if (timeframe === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query?.gte('created_at', weekAgo?.toISOString());
      } else if (timeframe === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query?.gte('created_at', monthAgo?.toISOString());
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
        materials: design?.materials,
        sizingInfo: design?.sizing_info,
        designer: design?.designer ? {
          id: design?.designer?.id,
          username: design?.designer?.username,
          profilePic: design?.designer?.profile_pic,
          userTier: design?.designer?.user_tier,
          followersCount: design?.designer?.followers_count
        } : null
      })) || [];
    } catch (error) {
      console.error('Error fetching trending designs:', error);
      throw error;
    }
  },

  /**
   * Get featured challenges
   * @param {number} limit - Number of challenges to fetch
   * @returns {Promise<Array>} Array of featured challenges
   */
  async getFeaturedChallenges(limit = 6) {
    try {
      const { data, error } = await supabase?.from('community_challenges')?.select(`
          *,
          creator:user_profiles!creator_id (
            id,
            username,
            profile_pic
          )
        `)?.eq('is_featured', true)?.in('status', ['accepting_submissions', 'voting'])?.order('created_at', { ascending: false })?.limit(limit);

      if (error) throw error;

      // Convert snake_case to camelCase
      return data?.map(challenge => ({
        id: challenge?.id,
        title: challenge?.title,
        description: challenge?.description,
        category: challenge?.category,
        imageUrl: challenge?.image_url,
        imageAlt: challenge?.image_alt,
        status: challenge?.status,
        deadline: challenge?.deadline,
        submissionDeadline: challenge?.submission_deadline,
        votingStartDate: challenge?.voting_start_date,
        votingEndDate: challenge?.voting_end_date,
        rewardAmount: challenge?.reward_amount,
        maxParticipants: challenge?.max_participants,
        isFeatured: challenge?.is_featured,
        createdAt: challenge?.created_at,
        creator: challenge?.creator ? {
          id: challenge?.creator?.id,
          username: challenge?.creator?.username,
          profilePic: challenge?.creator?.profile_pic
        } : null
      })) || [];
    } catch (error) {
      console.error('Error fetching featured challenges:', error);
      throw error;
    }
  },

  /**
   * Get popular designers based on followers and engagement
   * @param {number} limit - Number of designers to fetch
   * @returns {Promise<Array>} Array of popular designers
   */
  async getPopularDesigners(limit = 8) {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select(`
          id,
          username,
          bio,
          profile_pic,
          user_tier,
          followers_count,
          role
        `)?.eq('role', 'designer')?.order('followers_count', { ascending: false })?.limit(limit);

      if (error) throw error;

      // Get recent designs count for each designer
      const designersWithCounts = await Promise.all(
        (data || [])?.map(async (designer) => {
          const { count } = await supabase?.from('design_submissions')?.select('*', { count: 'exact', head: true })?.eq('designer_id', designer?.id)?.neq('submission_status', 'draft');

          return {
            id: designer?.id,
            username: designer?.username,
            bio: designer?.bio,
            profilePic: designer?.profile_pic,
            userTier: designer?.user_tier,
            followersCount: designer?.followers_count,
            designsCount: count || 0
          };
        })
      );

      return designersWithCounts;
    } catch (error) {
      console.error('Error fetching popular designers:', error);
      throw error;
    }
  },

  /**
   * Get personalized recommendations based on user activity
   * @param {string} userId - Current user ID
   * @param {number} limit - Number of recommendations
   * @returns {Promise<Array>} Array of recommended designs
   */
  async getPersonalizedRecommendations(userId, limit = 8) {
    try {
      if (!userId) {
        // Return trending designs for non-authenticated users
        return this.getTrendingDesigns(limit);
      }

      // Get user's voting history to understand preferences
      const { data: votedDesigns, error: votesError } = await supabase?.from('design_votes')?.select('design_id, vote_type')?.eq('user_id', userId)?.eq('vote_type', 'upvote')?.limit(20);

      if (votesError) throw votesError;

      // Get categories from upvoted designs
      const votedDesignIds = votedDesigns?.map(v => v?.design_id) || [];
      
      if (votedDesignIds?.length === 0) {
        // No voting history, return trending designs
        return this.getTrendingDesigns(limit);
      }

      const { data: likedDesigns, error: designsError } = await supabase?.from('design_submissions')?.select('category')?.in('id', votedDesignIds);

      if (designsError) throw designsError;

      // Count category preferences
      const categoryCount = {};
      likedDesigns?.forEach(design => {
        categoryCount[design.category] = (categoryCount?.[design?.category] || 0) + 1;
      });

      // Get most preferred category
      const preferredCategory = Object.keys(categoryCount)?.reduce((a, b) => 
        categoryCount?.[a] > categoryCount?.[b] ? a : b
      , null);

      // Fetch recommendations from preferred category, excluding already voted designs
      let query = supabase?.from('design_submissions')?.select(`
          *,
          designer:user_profiles!designer_id (
            id,
            username,
            profile_pic,
            user_tier
          )
        `)?.neq('submission_status', 'draft')?.not('id', 'in', `(${votedDesignIds?.join(',')})`)?.order('votes_count', { ascending: false })?.limit(limit);

      if (preferredCategory) {
        query = query?.eq('category', preferredCategory);
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
        recommendationReason: preferredCategory ? `Based on your interest in ${preferredCategory}` : 'Trending in the community',
        designer: design?.designer ? {
          id: design?.designer?.id,
          username: design?.designer?.username,
          profilePic: design?.designer?.profile_pic,
          userTier: design?.designer?.user_tier
        } : null
      })) || [];
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      throw error;
    }
  },

  /**
   * Get user's recent activity for activity feed
   * @param {string} userId - User ID
   * @param {number} limit - Number of activities
   * @returns {Promise<Array>} Array of user activities
   */
  async getUserRecentActivity(userId, limit = 10) {
    try {
      const { data, error } = await supabase?.from('user_activities')?.select('*')?.eq('user_id', userId)?.eq('is_public', true)?.order('created_at', { ascending: false })?.limit(limit);

      if (error) throw error;

      // Convert snake_case to camelCase
      return data?.map(activity => ({
        id: activity?.id,
        userId: activity?.user_id,
        activityType: activity?.activity_type,
        title: activity?.title,
        description: activity?.description,
        expGained: activity?.exp_gained,
        metadata: activity?.metadata,
        isPublic: activity?.is_public,
        createdAt: activity?.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }
  },

  /**
   * Check if user is a member
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user is a member
   */
  async checkMemberStatus(userId) {
    try {
      if (!userId) return false;

      const { data, error } = await supabase?.from('user_profiles')?.select('is_member')?.eq('id', userId)?.single();

      if (error) throw error;

      return data?.is_member || false;
    } catch (error) {
      console.error('Error checking member status:', error);
      return false;
    }
  }
};