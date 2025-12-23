import { supabase } from '../lib/supabase';

/**
 * Service for managing design votes
 * Handles vote creation, updates, and retrieval with proper snake_case/camelCase conversion
 */
export const voteService = {
  /**
   * Get user's vote for a specific design
   * @param {string} designId - Design submission ID
   * @returns {Promise<Object|null>} User's vote or null if no vote
   */
  async getUserVote(designId) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) return null;

      const { data, error } = await supabase?.from('design_votes')?.select('*')?.eq('design_id', designId)?.eq('user_id', user?.id)?.single();

      if (error && error?.code !== 'PGRST116') throw error;
      if (!data) return null;

      return {
        id: data?.id,
        designId: data?.design_id,
        userId: data?.user_id,
        voteType: data?.vote_type,
        createdAt: data?.created_at,
        updatedAt: data?.updated_at
      };
    } catch (error) {
      console.error('Error getting user vote:', error);
      throw error;
    }
  },

  /**
   * Cast or update a vote for a design
   * @param {string} designId - Design submission ID
   * @param {string} voteType - 'upvote' or 'downvote'
   * @returns {Promise<Object>} Created/updated vote
   */
  async castVote(designId, voteType) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const existingVote = await this.getUserVote(designId);

      if (existingVote) {
        // Update existing vote
        const { data, error } = await supabase?.from('design_votes')?.update({ vote_type: voteType })?.eq('id', existingVote?.id)?.select()?.single();

        if (error) throw error;

        return {
          id: data?.id,
          designId: data?.design_id,
          userId: data?.user_id,
          voteType: data?.vote_type,
          createdAt: data?.created_at,
          updatedAt: data?.updated_at
        };
      } else {
        // Create new vote
        const { data, error } = await supabase?.from('design_votes')?.insert({
            design_id: designId,
            user_id: user?.id,
            vote_type: voteType
          })?.select()?.single();

        if (error) throw error;

        return {
          id: data?.id,
          designId: data?.design_id,
          userId: data?.user_id,
          voteType: data?.vote_type,
          createdAt: data?.created_at,
          updatedAt: data?.updated_at
        };
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  },

  /**
   * Remove user's vote for a design
   * @param {string} designId - Design submission ID
   * @returns {Promise<void>}
   */
  async removeVote(designId) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase?.from('design_votes')?.delete()?.eq('design_id', designId)?.eq('user_id', user?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing vote:', error);
      throw error;
    }
  },

  /**
   * Get voting history for a design (paginated)
   * @param {string} designId - Design submission ID
   * @param {number} limit - Number of votes to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Array of votes with user info
   */
  async getVotingHistory(designId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase?.from('design_votes')?.select(`
          *,
          user_profiles!design_votes_user_id_fkey (
            username,
            profile_pic
          )
        `)?.eq('design_id', designId)?.order('created_at', { ascending: false })?.range(offset, offset + limit - 1);

      if (error) throw error;

      return data?.map(vote => ({
        id: vote?.id,
        designId: vote?.design_id,
        userId: vote?.user_id,
        voteType: vote?.vote_type,
        createdAt: vote?.created_at,
        username: vote?.user_profiles?.username,
        profilePic: vote?.user_profiles?.profile_pic
      })) || [];
    } catch (error) {
      console.error('Error getting voting history:', error);
      throw error;
    }
  },

  /**
   * Get vote statistics for a design
   * @param {string} designId - Design submission ID
   * @returns {Promise<Object>} Vote statistics
   */
  async getVoteStats(designId) {
    try {
      const { data, error } = await supabase?.from('design_votes')?.select('vote_type')?.eq('design_id', designId);

      if (error) throw error;

      const upvotes = data?.filter(v => v?.vote_type === 'upvote')?.length || 0;
      const downvotes = data?.filter(v => v?.vote_type === 'downvote')?.length || 0;

      return {
        upvotes,
        downvotes,
        total: upvotes - downvotes,
        percentage: data?.length > 0 ? ((upvotes / data?.length) * 100)?.toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error getting vote stats:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time vote changes for a design
   * @param {string} designId - Design submission ID
   * @param {Function} callback - Callback function to handle changes
   * @returns {Object} Subscription object
   */
  subscribeToVotes(designId, callback) {
    const channel = supabase?.channel(`design_votes_${designId}`)?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'design_votes',
          filter: `design_id=eq.${designId}`
        },
        (payload) => {
          callback(payload);
        }
      )?.subscribe();

    return channel;
  }
};

export default voteService;

/**
 * Vote on a design (for test compatibility)
 * @param {string} designId - Design submission ID
 * @param {string} voteType - 'upvote' or 'downvote'
 * @returns {Promise<Object>} Vote result
 */
export const voteDesign = async (designId, voteType) => {
  return voteService?.castVote(designId, voteType);
};

/**
 * Remove vote from a design (for test compatibility)
 * @param {string} designId - Design submission ID
 * @returns {Promise<void>}
 */
export const removeVote = async (designId) => {
  return voteService?.removeVote(designId);
};