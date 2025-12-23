import React from 'react';
import Icon from '../../../components/AppIcon';

const DesignStatistics = ({ statistics = {} }) => {
  const {
    views = 0,
    likes = 0,
    comments = 0,
    shares = 0,
    preOrders = 0,
    ranking = 0,
    createdDate = new Date()?.toISOString()
  } = statistics;

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000)?.toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000)?.toFixed(1)}K`;
    return num?.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date?.toLocaleDateString();
  };

  const stats = [
    { icon: "Eye", label: "Views", value: formatNumber(views), color: "var(--color-primary)" },
    { icon: "Heart", label: "Likes", value: formatNumber(likes), color: "var(--color-error)" },
    { icon: "MessageCircle", label: "Comments", value: formatNumber(comments), color: "var(--color-accent)" },
    { icon: "Share2", label: "Shares", value: formatNumber(shares), color: "var(--color-success)" },
    { icon: "ShoppingBag", label: "Pre-orders", value: formatNumber(preOrders), color: "var(--color-warning)" },
    { icon: "TrendingUp", label: "Ranking", value: `#${ranking}`, color: "var(--color-secondary)" }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Icon name="BarChart3" size={20} />
          Design Statistics
        </h3>
        <span className="text-sm text-muted-foreground">
          {formatDate(createdDate)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats?.map((stat, index) => (
          <div
            key={index}
            className="bg-muted/50 rounded-lg p-4 space-y-2 hover:bg-muted transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <Icon name={stat?.icon} size={18} color={stat?.color} />
              <span className="text-sm text-muted-foreground">{stat?.label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground font-data">
              {stat?.value}
            </div>
          </div>
        ))}
      </div>
      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Engagement Rate</span>
          <span className="font-semibold text-success">
            {((likes + comments + shares) / Math.max(views, 1) * 100)?.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default DesignStatistics;