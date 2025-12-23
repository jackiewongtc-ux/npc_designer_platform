import { supabase } from '../lib/supabase';

export const challengeService = {
  async getAll(filters = {}) {
    let query = supabase?.from('community_challenges')?.select(`
        *,
        creator:creator_id (
          id,
          username,
          profile_pic,
          user_tier
        )
      `)?.order('created_at', { ascending: false });

    if (filters?.category && filters?.category !== 'all') {
      query = query?.eq('category', filters?.category);
    }

    if (filters?.status && filters?.status !== 'all') {
      query = query?.eq('status', filters?.status);
    }

    if (filters?.featured) {
      query = query?.eq('is_featured', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data?.map(row => ({
      id: row?.id,
      title: row?.title,
      description: row?.description,
      image: row?.image_url,
      imageAlt: row?.image_alt,
      category: row?.category,
      reward: row?.reward_amount,
      deadline: new Date(row.deadline),
      submissionDeadline: new Date(row.submission_deadline),
      votingStartDate: row?.voting_start_date ? new Date(row.voting_start_date) : null,
      votingEndDate: row?.voting_end_date ? new Date(row.voting_end_date) : null,
      status: row?.status,
      featured: row?.is_featured,
      maxParticipants: row?.max_participants,
      creator: row?.creator,
      createdAt: new Date(row.created_at)
    }));
  },

  async getById(challengeId) {
    const { data, error } = await supabase?.from('community_challenges')?.select(`
        *,
        creator:creator_id (
          id,
          username,
          profile_pic,
          user_tier,
          followers_count
        )
      `)?.eq('id', challengeId)?.single();

    if (error) throw error;

    return {
      id: data?.id,
      title: data?.title,
      description: data?.description,
      image: data?.image_url,
      imageAlt: data?.image_alt,
      category: data?.category,
      reward: data?.reward_amount,
      deadline: new Date(data.deadline),
      submissionDeadline: new Date(data.submission_deadline),
      votingStartDate: data?.voting_start_date ? new Date(data.voting_start_date) : null,
      votingEndDate: data?.voting_end_date ? new Date(data.voting_end_date) : null,
      status: data?.status,
      featured: data?.is_featured,
      maxParticipants: data?.max_participants,
      creator: data?.creator,
      createdAt: new Date(data.created_at)
    };
  },

  async create(challengeData) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase?.from('community_challenges')?.insert({
        creator_id: user?.id,
        title: challengeData?.title,
        description: challengeData?.description,
        image_url: challengeData?.image,
        image_alt: challengeData?.imageAlt,
        category: challengeData?.category,
        reward_amount: challengeData?.reward || 0,
        deadline: challengeData?.deadline,
        submission_deadline: challengeData?.submissionDeadline,
        max_participants: challengeData?.maxParticipants,
        status: challengeData?.status || 'draft'
      })?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      title: data?.title,
      description: data?.description,
      image: data?.image_url,
      imageAlt: data?.image_alt,
      category: data?.category,
      reward: data?.reward_amount,
      deadline: new Date(data.deadline),
      submissionDeadline: new Date(data.submission_deadline),
      status: data?.status,
      createdAt: new Date(data.created_at)
    };
  },

  async update(challengeId, updates) {
    const { data, error } = await supabase?.from('community_challenges')?.update({
        title: updates?.title,
        description: updates?.description,
        image_url: updates?.image,
        image_alt: updates?.imageAlt,
        category: updates?.category,
        reward_amount: updates?.reward,
        deadline: updates?.deadline,
        submission_deadline: updates?.submissionDeadline,
        status: updates?.status
      })?.eq('id', challengeId)?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      title: data?.title,
      description: data?.description,
      image: data?.image_url,
      imageAlt: data?.image_alt,
      category: data?.category,
      reward: data?.reward_amount,
      deadline: new Date(data.deadline),
      submissionDeadline: new Date(data.submission_deadline),
      status: data?.status
    };
  },

  async delete(challengeId) {
    const { error } = await supabase?.from('community_challenges')?.delete()?.eq('id', challengeId);

    if (error) throw error;
  },

  async getParticipantCount(challengeId) {
    const { count, error } = await supabase?.from('challenge_responses')?.select('*', { count: 'exact', head: true })?.eq('challenge_id', challengeId);

    if (error) throw error;
    return count;
  },

  async getVoteCount(challengeId) {
    const { count, error } = await supabase?.from('challenge_votes')?.select('*', { count: 'exact', head: true })?.eq('challenge_id', challengeId);

    if (error) throw error;
    return count;
  },

  async getStats() {
    const today = new Date();
    today?.setHours(0, 0, 0, 0);

    const [votesResult, usersResult, completedResult] = await Promise.all([
      supabase?.from('challenge_votes')?.select('*', { count: 'exact', head: true })?.gte('created_at', today?.toISOString()),
      
      supabase?.from('challenge_responses')?.select('designer_id', { count: 'exact' })?.gte('created_at', today?.toISOString()),
      
      supabase?.from('community_challenges')?.select('*', { count: 'exact', head: true })?.eq('status', 'completed')
    ]);

    const uniqueUsers = new Set(usersResult.data?.map(r => r.designer_id) || [])?.size;

    return {
      todayVotes: votesResult?.count || 0,
      activeUsers: uniqueUsers || 0,
      completedChallenges: completedResult?.count || 0,
      trendingCount: 0
    };
  }
};

export const challengeResponseService = {
  async create(challengeId, designSubmissionId) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: challenge } = await supabase?.from('community_challenges')?.select('id')?.eq('id', challengeId)?.single();

    if (!challenge) throw new Error('Challenge not found or no access');

    const { data, error } = await supabase?.from('challenge_responses')?.insert({
        challenge_id: challengeId,
        designer_id: user?.id,
        design_submission_id: designSubmissionId,
        status: 'pending'
      })?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      challengeId: data?.challenge_id,
      designerId: data?.designer_id,
      designSubmissionId: data?.design_submission_id,
      status: data?.status,
      createdAt: new Date(data.created_at)
    };
  },

  async getByChallengeId(challengeId) {
    const { data, error } = await supabase?.from('challenge_responses')?.select(`
        *,
        designer:designer_id (
          id,
          username,
          profile_pic,
          user_tier
        ),
        submission:design_submission_id (
          id,
          title,
          image_urls
        )
      `)?.eq('challenge_id', challengeId)?.order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(row => ({
      id: row?.id,
      challengeId: row?.challenge_id,
      designer: row?.designer,
      submission: row?.submission,
      status: row?.status,
      acceptedAt: row?.accepted_at ? new Date(row.accepted_at) : null,
      createdAt: new Date(row.created_at)
    }));
  },

  async updateStatus(responseId, status, adminNotes) {
    const { data, error } = await supabase?.from('challenge_responses')?.update({
        status: status,
        admin_notes: adminNotes,
        accepted_at: status === 'accepted' ? new Date()?.toISOString() : null,
        rejected_at: status === 'rejected' ? new Date()?.toISOString() : null
      })?.eq('id', responseId)?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      status: data?.status,
      adminNotes: data?.admin_notes,
      acceptedAt: data?.accepted_at ? new Date(data.accepted_at) : null
    };
  }
};

export const challengeVoteService = {
  async vote(challengeId, responseId, voteValue) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: response } = await supabase?.from('challenge_responses')?.select('id')?.eq('id', responseId)?.single();

    if (!response) throw new Error('Response not found or no access');

    const { data: existingVote } = await supabase?.from('challenge_votes')?.select('*')?.eq('response_id', responseId)?.eq('user_id', user?.id)?.single();

    if (existingVote) {
      if (existingVote?.vote_value === voteValue) {
        const { error } = await supabase?.from('challenge_votes')?.delete()?.eq('id', existingVote?.id);

        if (error) throw error;
        return null;
      } else {
        const { data, error } = await supabase?.from('challenge_votes')?.update({ vote_value: voteValue })?.eq('id', existingVote?.id)?.select()?.single();

        if (error) throw error;
        return { id: data?.id, voteValue: data?.vote_value };
      }
    } else {
      const { data, error } = await supabase?.from('challenge_votes')?.insert({
          challenge_id: challengeId,
          response_id: responseId,
          user_id: user?.id,
          vote_value: voteValue
        })?.select()?.single();

      if (error) throw error;
      return { id: data?.id, voteValue: data?.vote_value };
    }
  },

  async getResponseVoteCounts(responseId) {
    const { data, error } = await supabase?.from('challenge_votes')?.select('vote_value')?.eq('response_id', responseId);

    if (error) throw error;

    const upvotes = data?.filter(v => v?.vote_value === 1)?.length;
    const downvotes = data?.filter(v => v?.vote_value === -1)?.length;

    return { upvotes, downvotes, total: upvotes - downvotes };
  }
};

export const challengeCommentService = {
  async create(challengeId, content, responseId = null, parentCommentId = null) {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: challenge } = await supabase?.from('community_challenges')?.select('id')?.eq('id', challengeId)?.single();

    if (!challenge) throw new Error('Challenge not found or no access');

    const { data, error } = await supabase?.from('challenge_comments')?.insert({
        challenge_id: challengeId,
        response_id: responseId,
        user_id: user?.id,
        content: content,
        parent_comment_id: parentCommentId
      })?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      challengeId: data?.challenge_id,
      responseId: data?.response_id,
      userId: data?.user_id,
      content: data?.content,
      parentCommentId: data?.parent_comment_id,
      createdAt: new Date(data.created_at)
    };
  },

  async getByChallengeId(challengeId) {
    const { data, error } = await supabase?.from('challenge_comments')?.select(`
        *,
        user:user_id (
          id,
          username,
          profile_pic
        )
      `)?.eq('challenge_id', challengeId)?.is('parent_comment_id', null)?.order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(row => ({
      id: row?.id,
      challengeId: row?.challenge_id,
      responseId: row?.response_id,
      user: row?.user,
      content: row?.content,
      createdAt: new Date(row.created_at)
    }));
  },

  async delete(commentId) {
    const { error } = await supabase?.from('challenge_comments')?.delete()?.eq('id', commentId);

    if (error) throw error;
  }
};

/**
 * Get all challenges (for test compatibility)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of challenges
 */
export const getChallenges = async (filters = {}) => {
  return challengeService?.getAll(filters);
};

/**
 * Create new challenge (for test compatibility)
 * @param {Object} challengeData - Challenge data
 * @returns {Promise<Object>} Created challenge
 */
export const createChallenge = async (challengeData) => {
  return challengeService?.create(challengeData);
};

/**
 * Vote on a challenge (for test compatibility)
 * @param {string} challengeId - Challenge ID
 * @param {number} voteValue - Vote value (1 or -1)
 * @returns {Promise<Object>} Vote result
 */
export const voteOnChallenge = async (challengeId, voteValue) => {
  try {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingVote } = await supabase?.from('challenge_votes')?.select('*')?.eq('challenge_id', challengeId)?.eq('user_id', user?.id)?.maybeSingle();

    if (existingVote) {
      const { error } = await supabase?.from('challenge_votes')?.update({ vote_value: voteValue })?.eq('id', existingVote?.id);

      if (error) throw error;
    } else {
      const { error } = await supabase?.from('challenge_votes')?.insert({
          challenge_id: challengeId,
          user_id: user?.id,
          vote_value: voteValue
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error voting on challenge:', error);
    throw error;
  }
};

/**
 * Vote on a challenge response (for test compatibility)
 * IMPORTANT: Challenge voting is for designer submissions/responses, not the challenge itself
 * 
 * @param {string} challengeId - Challenge ID
 * @param {string} responseId - Response ID (designer's submission to the challenge)
 * @param {number} voteValue - Vote value (1 for upvote or -1 for downvote)
 * @returns {Promise<Object>} Vote result
 */
export const voteOnChallengeResponse = async (challengeId, responseId, voteValue) => {
  return challengeVoteService?.vote(challengeId, responseId, voteValue);
};