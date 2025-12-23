import { supabase } from '../lib/supabase';

/**
 * Gamification Service
 * Handles EXP, badges, activities, and credits
 */

// =====================================================
// USER EXPERIENCE (EXP) OPERATIONS
// =====================================================

/**
 * Get user's current EXP and level data
 */
export const getUserExperience = async (userId) => {
  try {
    const { data, error } = await supabase
      ?.from('user_experience')
      ?.select('*')
      ?.eq('user_id', userId)
      ?.maybeSingle(); // FIX: Use maybeSingle() instead of single() to handle no rows case

    if (error) throw error;
    
    // FIX: Handle case when no experience record exists yet
    if (!data) {
      return {
        level: 1,
        currentExp: 0,
        expToNextLevel: 100,
        totalExpEarned: 0,
        progressPercentage: 0
      };
    }
    
    return {
      level: data?.level || 1,
      currentExp: data?.current_exp || 0,
      expToNextLevel: data?.exp_to_next_level || 100,
      totalExpEarned: data?.total_exp_earned || 0,
      progressPercentage: data ? Math.floor((data?.current_exp / data?.exp_to_next_level) * 100) : 0
    };
  } catch (error) {
    console.error('Error fetching user experience:', error);
    throw error;
  }
};

/**
 * Add EXP to user (with automatic level up)
 */
export const addUserExp = async (userId, expAmount, source = 'activity') => {
  try {
    const { data, error } = await supabase?.rpc('add_user_exp', {
      p_user_id: userId,
      p_exp_amount: expAmount
    });

    if (error) throw error;
    
    return {
      level: data?.level,
      currentExp: data?.current_exp,
      expToNextLevel: data?.exp_to_next_level,
      leveledUp: data?.leveled_up || false
    };
  } catch (error) {
    console.error('Error adding user EXP:', error);
    throw error;
  }
};

// =====================================================
// BADGES OPERATIONS
// =====================================================

/**
 * Get all available badges
 */
export const getAllBadges = async () => {
  try {
    const { data, error } = await supabase?.from('badges')?.select('*')?.eq('is_active', true)?.order('rarity', { ascending: false });

    if (error) throw error;
    
    return data?.map(badge => ({
      id: badge?.id,
      name: badge?.name,
      description: badge?.description,
      icon: badge?.icon,
      rarity: badge?.rarity,
      expReward: badge?.exp_reward,
      requirements: badge?.requirements
    })) || [];
  } catch (error) {
    console.error('Error fetching badges:', error);
    throw error;
  }
};

/**
 * Get user's earned badges
 */
export const getUserBadges = async (userId) => {
  try {
    const { data, error } = await supabase?.from('user_badges')?.select(`
        *,
        badges:badge_id (*)
      `)?.eq('user_id', userId)?.order('earned_at', { ascending: false });

    if (error) throw error;
    
    return data?.map(userBadge => ({
      id: userBadge?.id,
      badgeId: userBadge?.badge_id,
      name: userBadge?.badges?.name,
      description: userBadge?.badges?.description,
      icon: userBadge?.badges?.icon,
      rarity: userBadge?.badges?.rarity,
      earnedAt: userBadge?.earned_at,
      progress: userBadge?.progress,
      isDisplayed: userBadge?.is_displayed
    })) || [];
  } catch (error) {
    console.error('Error fetching user badges:', error);
    throw error;
  }
};

/**
 * Award badge to user
 */
export const awardBadge = async (userId, badgeId) => {
  try {
    const { data, error } = await supabase?.rpc('award_badge', {
      p_user_id: userId,
      p_badge_id: badgeId
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error awarding badge:', error);
    throw error;
  }
};

// =====================================================
// ACTIVITY FEED OPERATIONS
// =====================================================

/**
 * Get user's activity feed
 */
export const getUserActivities = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase?.from('user_activities')?.select('*')?.eq('user_id', userId)?.order('created_at', { ascending: false })?.limit(limit);

    if (error) throw error;
    
    return data?.map(activity => ({
      id: activity?.id,
      activityType: activity?.activity_type,
      title: activity?.title,
      description: activity?.description,
      metadata: activity?.metadata,
      expGained: activity?.exp_gained,
      isPublic: activity?.is_public,
      createdAt: activity?.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
};

/**
 * Get public activity feed (community feed)
 */
export const getPublicActivities = async (limit = 50) => {
  try {
    const { data, error } = await supabase?.from('user_activities')?.select(`
        *,
        user_profiles:user_id (username, avatar_url)
      `)?.eq('is_public', true)?.order('created_at', { ascending: false })?.limit(limit);

    if (error) throw error;
    
    return data?.map(activity => ({
      id: activity?.id,
      userId: activity?.user_id,
      username: activity?.user_profiles?.username,
      avatarUrl: activity?.user_profiles?.avatar_url,
      activityType: activity?.activity_type,
      title: activity?.title,
      description: activity?.description,
      metadata: activity?.metadata,
      expGained: activity?.exp_gained,
      createdAt: activity?.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching public activities:', error);
    throw error;
  }
};

/**
 * Create new activity
 */
export const createActivity = async (userId, activityData) => {
  try {
    const { data, error } = await supabase?.from('user_activities')?.insert([{
        user_id: userId,
        activity_type: activityData?.activityType,
        title: activityData?.title,
        description: activityData?.description,
        metadata: activityData?.metadata || {},
        exp_gained: activityData?.expGained || 0,
        is_public: activityData?.isPublic !== false
      }])?.select()?.single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

// =====================================================
// CREDITS OPERATIONS
// =====================================================

/**
 * Get user's credit balance
 */
export const getUserCredits = async (userId) => {
  try {
    const { data, error } = await supabase
      ?.from('user_credits')
      ?.select('*')
      ?.eq('user_id', userId)
      ?.maybeSingle(); // FIX: Use maybeSingle() instead of single()

    if (error) throw error;
    
    // FIX: Handle case when no credits record exists yet
    if (!data) {
      return {
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0
      };
    }
    
    return {
      balance: parseFloat(data?.balance || 0),
      lifetimeEarned: parseFloat(data?.lifetime_earned || 0),
      lifetimeSpent: parseFloat(data?.lifetime_spent || 0)
    };
  } catch (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }
};

/**
 * Get user's credit transaction history
 */
export const getCreditTransactions = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase?.from('credit_transactions')?.select('*')?.eq('user_id', userId)?.order('created_at', { ascending: false })?.limit(limit);

    if (error) throw error;
    
    return data?.map(transaction => ({
      id: transaction?.id,
      amount: parseFloat(transaction?.amount),
      transactionType: transaction?.transaction_type,
      source: transaction?.source,
      description: transaction?.description,
      metadata: transaction?.metadata,
      createdAt: transaction?.created_at
    })) || [];
  } catch (error) {
    console.error('Error fetching credit transactions:', error);
    throw error;
  }
};

/**
 * Add credits to user
 */
export const addCredits = async (userId, amount, source, description = null) => {
  try {
    const { data, error } = await supabase?.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_source: source,
      p_description: description
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
};

/**
 * Spend user credits
 */
export const spendCredits = async (userId, amount, source, description = null) => {
  try {
    const { data, error } = await supabase?.rpc('spend_user_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_source: source,
      p_description: description
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error spending credits:', error);
    throw error;
  }
};

// =====================================================
// DASHBOARD OVERVIEW
// =====================================================

/**
 * Get complete dashboard data for user
 */
export const getDashboardOverview = async (userId) => {
  try {
    // FIX: Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled([
      getUserExperience(userId),
      getUserBadges(userId),
      getUserActivities(userId, 10),
      getUserCredits(userId)
    ]);

    // FIX: Extract values and handle rejections
    const [experienceResult, badgesResult, activitiesResult, creditsResult] = results;

    return {
      experience: experienceResult?.status === 'fulfilled' ? experienceResult?.value : { level: 1, currentExp: 0, expToNextLevel: 100, totalExpEarned: 0, progressPercentage: 0 },
      badges: badgesResult?.status === 'fulfilled' ? badgesResult?.value : [],
      recentActivities: activitiesResult?.status === 'fulfilled' ? activitiesResult?.value : [],
      credits: creditsResult?.status === 'fulfilled' ? creditsResult?.value : { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 }
    };
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
};

export default {
  getUserExperience,
  addUserExp,
  getAllBadges,
  getUserBadges,
  awardBadge,
  getUserActivities,
  getPublicActivities,
  createActivity,
  getUserCredits,
  getCreditTransactions,
  addCredits,
  spendCredits,
  getDashboardOverview
};
function gamificationService(...args) {
  // eslint-disable-next-line no-console
  console.warn('Placeholder: gamificationService is not implemented yet.', args);
  return null;
}

export { gamificationService };