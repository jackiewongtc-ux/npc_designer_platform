import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FeaturedCarousel = ({ challenges }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? challenges?.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === challenges?.length - 1 ? 0 : prev + 1));
  };

  if (!challenges || challenges?.length === 0) return null;

  const current = challenges?.[currentIndex];

  return (
    <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-border overflow-hidden mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        <div className="relative overflow-hidden rounded-lg h-64 lg:h-80">
          <Image
            src={current?.image}
            alt={current?.imageAlt}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-accent-foreground">
              <Icon name="Star" size={16} />
              Featured Challenge
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-warning/10 text-warning border border-warning/20">
              <Icon name="TrendingUp" size={12} />
              Trending
            </span>
            <span className="text-sm text-muted-foreground">
              {current?.participants} designers participating
            </span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
            {current?.title}
          </h2>

          <p className="text-muted-foreground mb-4 line-clamp-3">
            {current?.description}
          </p>

          <div className="flex items-center gap-4 mb-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Icon name="Clock" size={16} />
              <span>{current?.daysRemaining} days left</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Icon name="ThumbsUp" size={16} />
              <span>{current?.votes} votes</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Icon name="Award" size={16} />
              <span>{current?.reward} credits reward</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/design-details?challengeId=${current?.id}`} className="flex-1">
              <Button variant="default" fullWidth iconName="Eye" iconPosition="left">
                View Challenge
              </Button>
            </Link>
            <Button variant="outline" iconName="Palette" iconPosition="left">
              Apply Now
            </Button>
          </div>
        </div>
      </div>
      {challenges?.length > 1 && (
        <div className="flex items-center justify-center gap-3 pb-4">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Previous challenge"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="flex items-center gap-1">
            {challenges?.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-accent w-6' : 'bg-muted'
                }`}
                aria-label={`Go to challenge ${index + 1}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Next challenge"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FeaturedCarousel;