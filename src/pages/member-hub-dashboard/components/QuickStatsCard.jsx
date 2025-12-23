import React from 'react';
import Icon from '../../../components/AppIcon';

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
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statItems?.map((item) => (
          <div 
            key={item?.id}
            className="p-4 rounded-lg bg-muted/30 border border-border hover:border-accent/50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${item?.color}20` }}
              >
                <Icon name={item?.icon} size={20} color={item?.color} />
              </div>
              {item?.trend && (
                <div className={`flex items-center gap-1 ${item?.trend > 0 ? 'text-success' : 'text-error'}`}>
                  <Icon 
                    name={item?.trend > 0 ? 'TrendingUp' : 'TrendingDown'} 
                    size={14} 
                  />
                  <span className="text-xs font-medium">{Math.abs(item?.trend)}%</span>
                </div>
              )}
            </div>
            
            <p className="text-2xl font-bold text-foreground mb-1 font-data">{item?.value}</p>
            <p className="text-sm text-muted-foreground">{item?.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} color="var(--color-accent)" className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Community Score</p>
            <p className="text-xs text-muted-foreground">
              Your score is calculated based on voting activity, challenge participation, and community engagement. Keep active to climb the rankings!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsCard;