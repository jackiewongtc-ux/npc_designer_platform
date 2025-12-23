import React from 'react';

const ActivityFeedItem = ({ activity }) => {
  const getActivityIcon = (activityType) => {
    const icons = {
      badge_earned: '🏆',
      challenge_join: '⚡',
      design_upload: '🎨',
      vote_cast: '🗳️',
      level_up: '⭐',
      credit_earned: '💎',
      follow: '👥',
      comment: '💬',
      purchase: '🛍️'
    };
    return icons?.[activityType] || '📌';
  };

  const getActivityColor = (activityType) => {
    const colors = {
      badge_earned: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
      challenge_join: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
      design_upload: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      vote_cast: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
      level_up: 'from-yellow-400/20 to-yellow-600/20 border-yellow-500/30',
      credit_earned: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30'
    };
    return colors?.[activityType] || 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return activityTime?.toLocaleDateString();
  };

  return (
    <div className={`bg-gradient-to-r ${getActivityColor(activity?.activityType)} backdrop-blur-sm rounded-lg border p-4 hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-start gap-4">
        {/* Activity Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center text-2xl">
            {getActivityIcon(activity?.activityType)}
          </div>
        </div>

        {/* Activity Content */}
        <div className="flex-grow">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">
                {activity?.title || 'Activity'}
              </h3>
              <p className="text-purple-200 text-sm">
                {activity?.description || 'Completed an activity'}
              </p>
            </div>
            
            {/* EXP Gained Badge */}
            {activity?.expGained > 0 && (
              <div className="flex-shrink-0 bg-yellow-500/20 border border-yellow-500/40 rounded-full px-3 py-1 flex items-center gap-1">
                <span className="text-yellow-400 font-bold text-xs">+{activity?.expGained}</span>
                <span className="text-yellow-300 text-xs">EXP</span>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="mt-2 flex items-center gap-2 text-xs text-purple-300">
            <span>🕐</span>
            <span>{formatTimeAgo(activity?.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeedItem;