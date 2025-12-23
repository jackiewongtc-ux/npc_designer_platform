import React from 'react';
import Icon from '../../../components/AppIcon';

const VoteTrackingPanel = ({ stats }) => {
  const metrics = [
    {
      icon: 'TrendingUp',
      label: 'Total Votes Today',
      value: stats?.todayVotes,
      change: '+12%',
      positive: true
    },
    {
      icon: 'Users',
      label: 'Active Participants',
      value: stats?.activeUsers,
      change: '+8%',
      positive: true
    },
    {
      icon: 'Award',
      label: 'Challenges Completed',
      value: stats?.completedChallenges,
      change: '+5',
      positive: true
    },
    {
      icon: 'Zap',
      label: 'Trending Now',
      value: stats?.trendingCount,
      change: 'Hot',
      positive: true
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="BarChart3" size={20} color="var(--color-accent)" />
        <h3 className="text-lg font-semibold text-foreground">Community Engagement</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics?.map((metric, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Icon name={metric?.icon} size={16} color="var(--color-accent)" />
              </div>
              <span className="text-xs text-muted-foreground">{metric?.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{metric?.value}</span>
              <span className={`text-xs font-medium ${metric?.positive ? 'text-success' : 'text-error'}`}>
                {metric?.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoteTrackingPanel;