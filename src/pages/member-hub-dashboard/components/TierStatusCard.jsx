import React from 'react';
import Icon from '../../../components/AppIcon';
import ProgressIndicator from '../../../components/ui/ProgressIndicator';

const TierStatusCard = ({ tier, expProgress, expCurrent, expRequired, badges }) => {
  const tierInfo = {
    Bronze: {
      color: 'var(--color-warning)',
      icon: 'Award',
      nextTier: 'Silver',
      benefits: ['Basic voting rights', 'Challenge submissions', 'Community access']
    },
    Silver: {
      color: 'var(--color-muted-foreground)',
      icon: 'Medal',
      nextTier: 'Gold',
      benefits: ['Priority voting', 'Designer applications', 'Exclusive challenges']
    },
    Gold: {
      color: 'var(--color-accent)',
      icon: 'Crown',
      nextTier: 'Platinum',
      benefits: ['VIP voting power', 'Early design access', 'Bonus rewards']
    },
    Platinum: {
      color: 'var(--color-primary)',
      icon: 'Gem',
      nextTier: 'Max Level',
      benefits: ['Maximum voting power', 'Designer mentorship', 'Premium rewards']
    }
  };

  const currentTierInfo = tierInfo?.[tier] || tierInfo?.Bronze;

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${currentTierInfo?.color}20` }}
          >
            <Icon 
              name={currentTierInfo?.icon} 
              size={32} 
              color={currentTierInfo?.color} 
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">{tier} Tier</h2>
            <p className="text-sm text-muted-foreground">
              {expRequired - expCurrent} EXP to {currentTierInfo?.nextTier}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground mb-1">Total EXP</p>
          <p className="text-2xl font-bold text-foreground font-data">{expCurrent?.toLocaleString()}</p>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progress to Next Tier</span>
          <span className="text-sm font-data text-muted-foreground">{expProgress}%</span>
        </div>
        <ProgressIndicator 
          progress={expProgress} 
          tier={tier}
          showLabel={false}
          size="lg"
        />
      </div>
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Tier Benefits</h3>
        <div className="space-y-2">
          {currentTierInfo?.benefits?.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <Icon name="Check" size={16} color="var(--color-success)" />
              <span className="text-sm text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Badges</h3>
          <button className="text-sm text-accent hover:underline">View All</button>
        </div>
        <div className="flex flex-wrap gap-3">
          {badges?.slice(0, 6)?.map((badge) => (
            <div
              key={badge?.id}
              className="relative group"
              title={badge?.description}
            >
              <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center border border-border hover:border-accent transition-colors duration-200">
                <Icon name={badge?.icon} size={24} color={badge?.color} />
              </div>
              {badge?.isNew && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-card" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TierStatusCard;