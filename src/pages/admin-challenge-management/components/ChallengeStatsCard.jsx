import React from 'react';
import Icon from '../../../components/AppIcon';

const ChallengeStatsCard = ({ icon, label, value, trend, trendValue, variant = 'default' }) => {
  const variantStyles = {
    default: 'bg-card border-border',
    warning: 'bg-warning/10 border-warning/20',
    success: 'bg-success/10 border-success/20',
    error: 'bg-error/10 border-error/20'
  };

  const iconColors = {
    default: 'var(--color-primary)',
    warning: 'var(--color-warning)',
    success: 'var(--color-success)',
    error: 'var(--color-error)'
  };

  return (
    <div className={`${variantStyles?.[variant]} border rounded-lg p-6 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-background/50">
          <Icon name={icon} size={24} color={iconColors?.[variant]} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-success' : 'text-error'}`}>
            <Icon name={trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={16} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
};

export default ChallengeStatsCard;