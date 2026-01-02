import React from 'react';


const QuickStatsCard = ({ stats }) => {
  const statItems = [
  {
    id: 'designs',
    label: 'Designs Voted',
    value: stats?.designsVoted,
    icon: 'ThumbsUp',
    color: 'var(--color-accent)',
    trend: stats?.designsTrend
  },
  {
    id: 'challenges',
    label: 'Challenges Joined',
    value: stats?.challengesJoined,
    icon: 'Trophy',
    color: 'var(--color-warning)',
    trend: stats?.challengesTrend
  },
  {
    id: 'rank',
    label: 'Community Rank',
    value: `#${stats?.communityRank}`,
    icon: 'TrendingUp',
    color: 'var(--color-success)',
    trend: stats?.rankTrend
  },
  {
    id: 'streak',
    label: 'Active Days',
    value: stats?.activeStreak,
    icon: 'Flame',
    color: 'var(--color-error)',
    trend: stats?.streakTrend
  }];


  return;












































};

export default QuickStatsCard;