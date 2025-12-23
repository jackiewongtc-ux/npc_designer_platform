import React from 'react';

const NotificationBadge = ({ count = 0, max = 99 }) => {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span className="notification-badge" aria-label={`${count} notifications`}>
      {displayCount}
    </span>
  );
};

export default NotificationBadge;