import React from 'react';
import { Link } from 'react-router-dom';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DesignerProfile = ({ designer = {} }) => {
  const {
    id = 1,
    name = "Unknown Designer",
    avatar = "https://randomuser.me/api/portraits/women/44.jpg",
    avatarAlt = "Professional headshot of female designer with long brown hair wearing black turtleneck",
    tier = "Gold",
    totalDesigns = 0,
    followers = 0,
    bio = "",
    isFollowing = false
  } = designer;

  const tierColors = {
    Bronze: 'var(--color-warning)',
    Silver: 'var(--color-muted-foreground)',
    Gold: 'var(--color-accent)',
    Platinum: 'var(--color-primary)'
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Link to={`/profile/${id}`} className="flex-shrink-0">
          <div className="relative">
            <Image
              src={avatar}
              alt={avatarAlt}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div 
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-card"
              style={{ backgroundColor: tierColors?.[tier] }}
            >
              <Icon name="Award" size={14} color="white" />
            </div>
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link 
            to={`/profile/${id}`}
            className="text-lg font-semibold text-foreground hover:text-accent transition-colors duration-200 no-underline"
          >
            {name}
          </Link>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="Palette" size={14} />
              {totalDesigns} designs
            </span>
            <span className="flex items-center gap-1">
              <Icon name="Users" size={14} />
              {followers} followers
            </span>
          </div>
        </div>

        <Button
          variant={isFollowing ? "outline" : "default"}
          size="sm"
          iconName={isFollowing ? "UserCheck" : "UserPlus"}
          iconPosition="left"
        >
          {isFollowing ? "Following" : "Follow"}
        </Button>
      </div>
      {bio && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {bio}
        </p>
      )}
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          iconName="MessageCircle"
          iconPosition="left"
          fullWidth
        >
          Message
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconName="ExternalLink"
          iconPosition="left"
          fullWidth
        >
          Portfolio
        </Button>
      </div>
    </div>
  );
};

export default DesignerProfile;