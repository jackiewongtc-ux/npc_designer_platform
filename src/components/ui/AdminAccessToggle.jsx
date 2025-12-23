import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const AdminAccessToggle = ({ user = null }) => {
  const location = useLocation();

  if (!user || !user?.isAdmin) {
    return null;
  }

  const isAdminRoute = location?.pathname?.startsWith('/admin');

  return (
    <Link
      to={isAdminRoute ? '/member-hub-dashboard' : '/admin-challenge-management'}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20 transition-all duration-200 no-underline"
    >
      <Icon name={isAdminRoute ? 'User' : 'Shield'} size={16} />
      <span>{isAdminRoute ? 'User View' : 'Admin Panel'}</span>
    </Link>
  );
};

export default AdminAccessToggle;