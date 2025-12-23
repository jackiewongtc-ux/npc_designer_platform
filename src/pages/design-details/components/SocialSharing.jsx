import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SocialSharing = ({ designTitle, designUrl }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = designUrl || window.location?.href;
  const shareText = `Check out this amazing design: ${designTitle}`;

  const socialPlatforms = [
    {
      name: "Twitter",
      icon: "Twitter",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      color: "#1DA1F2"
    },
    {
      name: "Facebook",
      icon: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: "#1877F2"
    },
    {
      name: "LinkedIn",
      icon: "Linkedin",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: "#0A66C2"
    },
    {
      name: "Pinterest",
      icon: "Image",
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`,
      color: "#E60023"
    }
  ];

  const handleShare = (platform) => {
    window.open(platform?.url, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Icon name="Share2" size={20} />
        Share This Design
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {socialPlatforms?.map((platform) => (
          <button
            key={platform?.name}
            onClick={() => handleShare(platform)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors duration-200 text-sm font-medium text-foreground"
          >
            <Icon name={platform?.icon} size={18} color={platform?.color} />
            <span>{platform?.name}</span>
          </button>
        ))}
      </div>
      <div className="pt-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground border border-border"
          />
          <Button
            variant={copied ? "success" : "outline"}
            size="default"
            iconName={copied ? "Check" : "Copy"}
            onClick={handleCopyLink}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SocialSharing;