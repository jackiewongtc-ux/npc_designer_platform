import React from 'react';
import Icon from '../AppIcon';

const ProgressIndicator = ({ 
  progress = 0, 
  tier = 'Bronze', 
  showLabel = true,
  size = 'default'
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  const sizeClasses = {
    sm: 'w-16',
    default: 'w-24',
    lg: 'w-32'
  };

  const tierColors = {
    Bronze: 'var(--color-warning)',
    Silver: 'var(--color-muted-foreground)',
    Gold: 'var(--color-accent)',
    Platinum: 'var(--color-primary)',
  };

  const tierColor = tierColors?.[tier] || tierColors?.Bronze;

  return (
    <div className="progress-indicator">
      <Icon name="Award" size={16} color={tierColor} />
      <div className="flex flex-col gap-1">
        {showLabel && (
          <span className="progress-text">{tier}</span>
        )}
        <div className={`progress-bar ${sizeClasses?.[size]}`}>
          <div 
            className="progress-fill" 
            style={{ 
              width: `${clampedProgress}%`,
              backgroundColor: tierColor
            }}
            role="progressbar"
            aria-valuenow={clampedProgress}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label={`${clampedProgress}% progress to next tier`}
          />
        </div>
      </div>
      {showLabel && (
        <span className="progress-text font-data">{clampedProgress}%</span>
      )}
    </div>
  );
};

export default ProgressIndicator;