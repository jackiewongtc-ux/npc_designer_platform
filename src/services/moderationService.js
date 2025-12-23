import { supabase } from '../lib/supabase';

/**
 * Moderation Service
 * Handles admin moderation operations, IP risk analysis, and flagging systems
 */

// Fetch all challenges with moderation data
export const getModerationChallenges = async (filters = {}) => {
  try {
    let query = supabase?.from('community_challenges')?.select(`
        *,
        creator:user_profiles!community_challenges_creator_id_fkey(
          id,
          username,
          email,
          role,
          user_tier
        ),
        moderated_by_user:user_profiles!community_challenges_moderated_by_fkey(
          id,
          username,
          email
        ),
        challenge_votes(count),
        challenge_flags(
          id,
          reason,
          severity,
          reviewed,
          created_at
        )
      `)?.order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query?.eq('moderation_status', filters?.status);
    }
    if (filters?.riskLevel) {
      query = query?.eq('risk_level', filters?.riskLevel);
    }
    if (filters?.autoFlagged !== undefined) {
      query = query?.eq('auto_flagged', filters?.autoFlagged);
    }
    if (filters?.startDate) {
      query = query?.gte('created_at', filters?.startDate);
    }
    if (filters?.endDate) {
      query = query?.lte('created_at', filters?.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to camelCase
    return data?.map(challenge => ({
      id: challenge?.id,
      title: challenge?.title,
      description: challenge?.description,
      category: challenge?.category,
      deadline: challenge?.deadline,
      submissionDeadline: challenge?.submission_deadline,
      votingStartDate: challenge?.voting_start_date,
      votingEndDate: challenge?.voting_end_date,
      rewardAmount: challenge?.reward_amount,
      maxParticipants: challenge?.max_participants,
      status: challenge?.status,
      isFeatured: challenge?.is_featured,
      imageUrl: challenge?.image_url,
      imageAlt: challenge?.image_alt,
      moderationStatus: challenge?.moderation_status,
      moderationNotes: challenge?.moderation_notes,
      moderatedAt: challenge?.moderated_at,
      riskScore: challenge?.risk_score,
      riskLevel: challenge?.risk_level,
      ipAddress: challenge?.ip_address,
      flaggedCount: challenge?.flagged_count,
      autoFlagged: challenge?.auto_flagged,
      createdAt: challenge?.created_at,
      updatedAt: challenge?.updated_at,
      creator: challenge?.creator ? {
        id: challenge?.creator?.id,
        username: challenge?.creator?.username,
        email: challenge?.creator?.email,
        role: challenge?.creator?.role,
        userTier: challenge?.creator?.user_tier
      } : null,
      moderatedBy: challenge?.moderated_by_user ? {
        id: challenge?.moderated_by_user?.id,
        username: challenge?.moderated_by_user?.username,
        email: challenge?.moderated_by_user?.email
      } : null,
      voteCount: challenge?.challenge_votes?.[0]?.count || 0,
      flags: challenge?.challenge_flags?.map(flag => ({
        id: flag?.id,
        reason: flag?.reason,
        severity: flag?.severity,
        reviewed: flag?.reviewed,
        createdAt: flag?.created_at
      })) || []
    })) || [];
  } catch (error) {
    console.error('Error fetching moderation challenges:', error);
    throw error;
  }
};

// Moderate a challenge (approve/reject/flag)
export const moderateChallenge = async (challengeId, action, notes = '') => {
  try {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase?.from('community_challenges')?.update({
        moderation_status: action,
        moderation_notes: notes,
        moderated_at: new Date()?.toISOString(),
        moderated_by: user?.id
      })?.eq('id', challengeId)?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      moderationStatus: data?.moderation_status,
      moderationNotes: data?.moderation_notes,
      moderatedAt: data?.moderated_at
    };
  } catch (error) {
    console.error('Error moderating challenge:', error);
    throw error;
  }
};

// Bulk moderate challenges
export const bulkModerate = async (challengeIds, action, notes = '') => {
  try {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase?.from('community_challenges')?.update({
        moderation_status: action,
        moderation_notes: notes,
        moderated_at: new Date()?.toISOString(),
        moderated_by: user?.id
      })?.in('id', challengeIds)?.select();

    if (error) throw error;

    return data?.map(challenge => ({
      id: challenge?.id,
      moderationStatus: challenge?.moderation_status
    })) || [];
  } catch (error) {
    console.error('Error bulk moderating challenges:', error);
    throw error;
  }
};

// Get IP risk analysis
export const getIpRiskAnalysis = async (ipAddress = null) => {
  try {
    let query = supabase?.from('ip_risk_analysis')?.select('*')?.order('risk_score', { ascending: false });

    if (ipAddress) {
      query = query?.eq('ip_address', ipAddress);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(ip => ({
      id: ip?.id,
      ipAddress: ip?.ip_address,
      submissionCount: ip?.submission_count,
      duplicateContentCount: ip?.duplicate_content_count,
      suspiciousPatterns: ip?.suspicious_patterns,
      riskScore: ip?.risk_score,
      riskLevel: ip?.risk_level,
      blocked: ip?.blocked,
      lastSeenAt: ip?.last_seen_at,
      createdAt: ip?.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching IP risk analysis:', error);
    throw error;
  }
};

// Submit a flag for a challenge
export const flagChallenge = async (challengeId, reason, description, severity = 'low') => {
  try {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase?.from('challenge_flags')?.insert({
        challenge_id: challengeId,
        reporter_id: user?.id,
        reason,
        description,
        severity
      })?.select()?.single();

    if (error) throw error;

    // Increment flagged count on challenge using rpc or direct increment
    const { error: updateError } = await supabase
      ?.from('community_challenges')
      ?.update({ 
        flagged_count: supabase?.raw('COALESCE(flagged_count, 0) + 1') 
      })
      ?.eq('id', challengeId);

    if (updateError) console.error('Error updating flagged count:', updateError);

    return {
      id: data?.id,
      challengeId: data?.challenge_id,
      reason: data?.reason,
      severity: data?.severity,
      createdAt: data?.created_at
    };
  } catch (error) {
    console.error('Error flagging challenge:', error);
    throw error;
  }
};

// Get all flags (admin only)
export const getAllFlags = async (reviewedFilter = null) => {
  try {
    let query = supabase?.from('challenge_flags')?.select(`
        *,
        challenge:community_challenges(id, title, moderation_status),
        reporter:user_profiles!challenge_flags_reporter_id_fkey(
          id,
          username,
          email
        ),
        reviewer:user_profiles!challenge_flags_reviewed_by_fkey(
          id,
          username,
          email
        )
      `)?.order('created_at', { ascending: false });

    if (reviewedFilter !== null) {
      query = query?.eq('reviewed', reviewedFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(flag => ({
      id: flag?.id,
      challengeId: flag?.challenge_id,
      reason: flag?.reason,
      description: flag?.description,
      severity: flag?.severity,
      reviewed: flag?.reviewed,
      reviewedAt: flag?.reviewed_at,
      createdAt: flag?.created_at,
      challenge: flag?.challenge ? {
        id: flag?.challenge?.id,
        title: flag?.challenge?.title,
        moderationStatus: flag?.challenge?.moderation_status
      } : null,
      reporter: flag?.reporter ? {
        id: flag?.reporter?.id,
        username: flag?.reporter?.username,
        email: flag?.reporter?.email
      } : null,
      reviewer: flag?.reviewer ? {
        id: flag?.reviewer?.id,
        username: flag?.reviewer?.username,
        email: flag?.reviewer?.email
      } : null
    })) || [];
  } catch (error) {
    console.error('Error fetching flags:', error);
    throw error;
  }
};

// Review a flag (admin only)
export const reviewFlag = async (flagId) => {
  try {
    const { data: { user } } = await supabase?.auth?.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase?.from('challenge_flags')?.update({
        reviewed: true,
        reviewed_by: user?.id,
        reviewed_at: new Date()?.toISOString()
      })?.eq('id', flagId)?.select()?.single();

    if (error) throw error;

    return {
      id: data?.id,
      reviewed: data?.reviewed,
      reviewedAt: data?.reviewed_at
    };
  } catch (error) {
    console.error('Error reviewing flag:', error);
    throw error;
  }
};

// Get moderation statistics
export const getModerationStats = async (days = 7) => {
  try {
    const startDate = new Date();
    startDate?.setDate(startDate?.getDate() - days);

    const { data, error } = await supabase?.from('moderation_statistics')?.select('*')?.gte('date', startDate?.toISOString()?.split('T')?.[0])?.order('date', { ascending: false });

    if (error) throw error;

    return data?.map(stat => ({
      id: stat?.id,
      date: stat?.date,
      totalReviewed: stat?.total_reviewed,
      approvedCount: stat?.approved_count,
      rejectedCount: stat?.rejected_count,
      flaggedCount: stat?.flagged_count,
      averageReviewTimeMinutes: stat?.average_review_time_minutes,
      pendingCount: stat?.pending_count,
      createdAt: stat?.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching moderation statistics:', error);
    throw error;
  }
};

// Get moderation logs for a challenge
export const getModerationLogs = async (challengeId) => {
  try {
    const { data, error } = await supabase?.from('challenge_moderation_logs')?.select(`
        *,
        moderator:user_profiles(
          id,
          username,
          email
        )
      `)?.eq('challenge_id', challengeId)?.order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(log => ({
      id: log?.id,
      challengeId: log?.challenge_id,
      action: log?.action,
      notes: log?.notes,
      previousStatus: log?.previous_status,
      newStatus: log?.new_status,
      createdAt: log?.created_at,
      moderator: log?.moderator ? {
        id: log?.moderator?.id,
        username: log?.moderator?.username,
        email: log?.moderator?.email
      } : null
    })) || [];
  } catch (error) {
    console.error('Error fetching moderation logs:', error);
    throw error;
  }
};

// Block an IP address
export const blockIpAddress = async (ipAddress) => {
  try {
    const { data, error } = await supabase?.from('ip_risk_analysis')?.update({ blocked: true })?.eq('ip_address', ipAddress)?.select()?.single();

    if (error) throw error;

    return {
      ipAddress: data?.ip_address,
      blocked: data?.blocked
    };
  } catch (error) {
    console.error('Error blocking IP address:', error);
    throw error;
  }
};

// Update moderation statistics (admin utility)
export const updateModerationStatistics = async () => {
  try {
    const { error } = await supabase?.rpc('update_moderation_stats');

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating moderation statistics:', error);
    throw error;
  }
};
function moderationService(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: moderationService is not implemented yet.', args);
  return null;
}

export default moderationService;