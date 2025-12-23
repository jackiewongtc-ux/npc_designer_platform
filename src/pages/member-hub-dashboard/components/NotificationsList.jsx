import React from 'react';
import Icon from '../../../components/AppIcon';

const NotificationsList = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const getNotificationIcon = (type) => {
    const icons = {
      badge: 'Award',
      tier: 'TrendingUp',
      vote: 'ThumbsUp',
      challenge: 'Trophy',
      design: 'Palette',
      comment: 'MessageSquare',
      system: 'Bell'
    };
    return icons?.[type] || 'Bell';
  };

  const getNotificationColor = (type) => {
    const colors = {
      badge: 'var(--color-primary)',
      tier: 'var(--color-accent)',
      vote: 'var(--color-success)',
      challenge: 'var(--color-warning)',
      design: 'var(--color-accent)',
      comment: 'var(--color-muted-foreground)',
      system: 'var(--color-foreground)'
    };
    return colors?.[type] || 'var(--color-foreground)';
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
        {notifications?.some(n => !n?.read) && (
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-accent hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {notifications?.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="Bell" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications?.map((notification) => (
              <div
                key={notification?.id}
                className={`p-4 hover:bg-muted/30 transition-colors duration-200 ${
                  !notification?.read ? 'bg-accent/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${getNotificationColor(notification?.type)}20` }}
                  >
                    <Icon 
                      name={getNotificationIcon(notification?.type)} 
                      size={20} 
                      color={getNotificationColor(notification?.type)} 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">{notification?.title}</p>
                      {!notification?.read && (
                        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification?.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(notification?.timestamp)}
                      </span>
                      {!notification?.read && (
                        <button
                          onClick={() => onMarkAsRead(notification?.id)}
                          className="text-xs text-accent hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;