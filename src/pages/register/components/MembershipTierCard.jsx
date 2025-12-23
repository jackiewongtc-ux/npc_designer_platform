import React from 'react';
import Icon from '../../../components/AppIcon';

import { cn } from '../../../lib/utils';

const MembershipTierCard = ({ 
  tier, 
  isSelected, 
  onSelect 
}) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative cursor-pointer rounded-lg border-2 p-6 transition-all',
        isSelected
          ? 'border-accent bg-accent/5 shadow-lg'
          : 'border-border bg-card hover:border-accent/50 hover:shadow-md'
      )}
    >
      {tier?.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-accent px-4 py-1 text-xs font-semibold text-white">
            Recommended
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground">{tier?.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{tier?.subtitle}</p>
        
        <div className="mt-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold text-foreground">
              {tier?.currency || '$'}{tier?.price?.toFixed(2)}
            </span>
            <span className="text-muted-foreground">/{tier?.billingCycle || 'month'}</span>
          </div>
          
          {tier?.annualSavings && (
            <p className="mt-2 text-sm text-accent">
              Save ${tier?.annualSavings?.toFixed(2)} annually
            </p>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {tier?.benefits?.map((benefit, index) => (
          <li key={index} className="flex items-start gap-2">
            <Icon name="Check" size={16} color="var(--color-success)" className="mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground">{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-center">
        <div
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full border-2',
            isSelected
              ? 'border-accent bg-accent' :'border-border bg-background'
          )}
        >
          {isSelected && (
            <Icon name="Check" className="h-4 w-4 text-white" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MembershipTierCard;