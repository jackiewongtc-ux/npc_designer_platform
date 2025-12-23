import React from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ChallengeCard = ({ challenge, onVote, onApply }) => {
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-accent/10 text-accent border-accent/20',
      voting: 'bg-warning/10 text-warning border-warning/20',
      completed: 'bg-muted text-muted-foreground border-border'
    };
    return colors?.[status] || colors?.active;
  };

  const formatTimeRemaining = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Ending soon';
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link to={`/design-details?challengeId=${challenge?.id}`} className="block relative overflow-hidden h-48">
        <Image
          src={challenge?.image}
          alt={challenge?.imageAlt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(challenge?.status)}`}>
            <Icon name="Clock" size={12} />
            {formatTimeRemaining(challenge?.deadline)}
          </span>
        </div>
        {challenge?.featured && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-accent text-accent-foreground">
              <Icon name="Star" size={12} />
              Featured
            </span>
          </div>
        )}
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link to={`/design-details?challengeId=${challenge?.id}`} className="no-underline">
            <h3 className="text-base font-semibold text-foreground hover:text-accent transition-colors line-clamp-2">
              {challenge?.title}
            </h3>
          </Link>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(challenge?.status)}`}>
            {challenge?.status}
          </span>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {challenge?.description}
        </p>

        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icon name="Users" size={16} />
            <span>{challenge?.participants} designers</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="ThumbsUp" size={16} />
            <span>{challenge?.votes} votes</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="ThumbsUp"
            iconPosition="left"
            onClick={() => onVote(challenge?.id)}
            className="flex-1"
          >
            Vote
          </Button>
          <Button
            variant="default"
            size="sm"
            iconName="Palette"
            iconPosition="left"
            onClick={() => onApply(challenge?.id)}
            className="flex-1"
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeCard;