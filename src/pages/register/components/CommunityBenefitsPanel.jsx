import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const CommunityBenefitsPanel = () => {
  const benefits = [
  {
    icon: 'Users',
    title: 'Join Creative Community',
    description: 'Connect with designers and fashion enthusiasts worldwide'
  },
  {
    icon: 'Trophy',
    title: 'Earn Rewards & Badges',
    description: 'Build reputation through challenges and voting participation'
  },
  {
    icon: 'Sparkles',
    title: 'Exclusive Designs',
    description: 'Access community-driven apparel before anyone else'
  },
  {
    icon: 'TrendingUp',
    title: 'Level Up Your Profile',
    description: 'Progress through tiers and unlock premium features'
  }];


  const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Designer',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1d92ac120-1763293804988.png",
    avatarAlt: 'Professional Asian woman with long black hair wearing white blouse smiling at camera',
    quote: 'This platform helped me launch my design career and connect with amazing clients.',
    rating: 5
  },
  {
    name: 'Marcus Johnson',
    role: 'Community Member',
    avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1aee345c1-1763293960594.png",
    avatarAlt: 'African American man with short hair and beard wearing blue shirt with friendly expression',
    quote: 'I love being part of the design process. My votes actually matter here!',
    rating: 5
  }];


  const featuredDesigns = [
  {
    image: "https://images.unsplash.com/photo-1735553816849-fed0daf9bf48",
    imageAlt: 'Modern black streetwear hoodie with geometric white patterns displayed on mannequin against urban background',
    title: 'Urban Edge Collection',
    votes: 1247
  },
  {
    image: "https://images.unsplash.com/photo-1605760719369-be714c32a7f6",
    imageAlt: 'Elegant white minimalist t-shirt with subtle embroidered details hanging on wooden hanger in natural light',
    title: 'Minimalist Essentials',
    votes: 892
  }];


  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Why Join Our Community?</h3>
        <div className="space-y-4">
          {benefits?.map((benefit, index) =>
          <div key={index} className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg">
              <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0">
                <Icon name={benefit?.icon} size={20} color="var(--color-accent)" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{benefit?.title}</h4>
                <p className="text-xs text-muted-foreground">{benefit?.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">Featured Designs</h3>
        <div className="grid grid-cols-2 gap-4">
          {featuredDesigns?.map((design, index) =>
          <div key={index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg mb-2 aspect-square">
                <Image
                src={design?.image}
                alt={design?.imageAlt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <h4 className="text-sm font-medium text-foreground mb-1">{design?.title}</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon name="ThumbsUp" size={12} />
                <span>{design?.votes?.toLocaleString()} votes</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">What Members Say</h3>
        <div className="space-y-4">
          {testimonials?.map((testimonial, index) =>
          <div key={index} className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Image
                src={testimonial?.avatar}
                alt={testimonial?.avatarAlt}
                className="w-12 h-12 rounded-full object-cover" />

                <div>
                  <h4 className="text-sm font-semibold text-foreground">{testimonial?.name}</h4>
                  <p className="text-xs text-muted-foreground">{testimonial?.role}</p>
                </div>
              </div>
              <p className="text-sm text-foreground mb-2">{testimonial?.quote}</p>
              <div className="flex gap-1">
                {[...Array(testimonial?.rating)]?.map((_, i) =>
              <Icon key={i} name="Star" size={14} color="var(--color-warning)" />
              )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Icon name="Gift" size={24} color="var(--color-accent)" className="flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-1">Welcome Bonus</h4>
            <p className="text-xs text-muted-foreground">
              Get 500 reward credits when you complete your first challenge vote!
            </p>
          </div>
        </div>
      </div>
    </div>);

};

export default CommunityBenefitsPanel;