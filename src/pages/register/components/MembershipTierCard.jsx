import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const MembershipTierCard = ({ 
  tier, 
  isSelected, 
  onSelect 
}) => {
  const tierStyles = {
    Bronze: {
      gradient: 'from-amber-600/10 to-amber-800/10',
      border: 'border-amber-600/30',
      icon: 'Award',
      iconColor: 'var(--color-warning)'
    },
    Silver: {
      gradient: 'from-gray-400/10 to-gray-600/10',
      border: 'border-gray-400/30',
      icon: 'Star',
      iconColor: 'var(--color-muted-foreground)'
    },
    Gold: {
      gradient: 'from-yellow-500/10 to-yellow-700/10',
      border: 'border-yellow-500/30',
      icon: 'Crown',
      iconColor: 'var(--color-accent)'
    }
  };

  const style = tierStyles?.[tier?.name] || tierStyles?.Bronze;

  return (
    <div 
      className={`relative p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
        isSelected 
          ? `${style?.border} bg-gradient-to-br ${style?.gradient}` 
          : 'border-border bg-card hover:border-muted-foreground/30'
      }`}
      onClick={onSelect}
    >
      {tier?.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full">
          Most Popular
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSelected ? 'bg-background/50' : 'bg-muted/50'}`}>
            <Icon name={style?.icon} size={24} color={style?.iconColor} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{tier?.name}</h3>
            <p className="text-sm text-muted-foreground">{tier?.subtitle}</p>
          </div>
        </div>
        {isSelected && (
          <div className="p-1 rounded-full bg-accent">
            <Icon name="Check" size={16} color="white" />
          </div>
        )}
      </div>
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">${tier?.price}</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
        {tier?.annualSavings && (
          <p className="text-xs text-success mt-1">Save ${tier?.annualSavings} with annual billing</p>
        )}
      </div>
      <ul className="space-y-3 mb-6">
        {tier?.benefits?.map((benefit, index) => (
          <li key={index} className="flex items-start gap-2">
            <Icon name="Check" size={16} color="var(--color-success)" className="mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground">{benefit}</span>
          </li>
        ))}
      </ul>
      <Button 
        variant={isSelected ? "default" : "outline"} 
        fullWidth
        onClick={onSelect}
      >
        {isSelected ? 'Selected' : 'Select Plan'}
      </Button>
    </div>
  );
};

export default MembershipTierCard;