import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';

const PlatformShowcase = () => {
  const features = [
  {
    icon: 'Users',
    title: 'Community-Driven',
    description: 'Join thousands of designers and fashion enthusiasts shaping the future of apparel'
  },
  {
    icon: 'Trophy',
    title: 'Earn Rewards',
    description: 'Complete challenges, vote on designs, and climb the tier system to unlock exclusive benefits'
  },
  {
    icon: 'Palette',
    title: 'Creative Freedom',
    description: 'Submit your design ideas or bring community challenges to life with your unique vision'
  },
  {
    icon: 'TrendingUp',
    title: 'Build Reputation',
    description: 'Showcase your portfolio, gain followers, and establish yourself in the designer community'
  }];


  const featuredDesign = {
    image: "https://images.unsplash.com/photo-1710504971937-18b917eaf684",
    imageAlt: 'Modern minimalist white t-shirt with geometric black pattern design displayed on mannequin against clean studio background',
    designer: 'Sarah Chen',
    designerAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d92ac120-1763293804988.png",
    designerAvatarAlt: 'Professional headshot of Asian woman with long black hair wearing white blouse smiling warmly',
    title: 'Urban Geometry Collection',
    votes: 1247,
    tier: 'Platinum'
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Welcome to NPC Designer
        </h2>
        <p className="text-lg text-muted-foreground">
          Where community creativity meets fashion innovation
        </p>
      </div>
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 p-6">
        <div className="relative z-10">
          <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-muted">
            <Image
              src={featuredDesign?.image}
              alt={featuredDesign?.imageAlt}
              className="w-full h-full object-cover" />

          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={featuredDesign?.designerAvatar}
                alt={featuredDesign?.designerAvatarAlt}
                className="w-full h-full object-cover" />

            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {featuredDesign?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                by {featuredDesign?.designer}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
              <Icon name="Award" size={16} color="var(--color-accent)" />
              <span className="text-sm font-medium text-accent">{featuredDesign?.tier}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="ThumbsUp" size={16} />
            <span className="text-sm font-medium">{featuredDesign?.votes?.toLocaleString()} votes</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {features?.map((feature, index) =>
        <div
          key={index}
          className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border hover:border-accent/30 transition-colors">

            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Icon name={feature?.icon} size={20} color="var(--color-accent)" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground mb-1">
                {feature?.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {feature?.description}
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="p-6 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
        <div className="flex items-start gap-3">
          <Icon name="Sparkles" size={24} color="var(--color-accent)" className="flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-foreground mb-2">
              New Member Benefits
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Icon name="Check" size={16} color="var(--color-success)" />
                <span>500 bonus EXP points to start</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="Check" size={16} color="var(--color-success)" />
                <span>Access to exclusive design challenges</span>
              </li>
              <li className="flex items-center gap-2">
                <Icon name="Check" size={16} color="var(--color-success)" />
                <span>Free design enhancement credits</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>);

};

export default PlatformShowcase;