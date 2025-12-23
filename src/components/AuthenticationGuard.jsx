import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const AuthenticationGuard = ({ 
  children, 
  user = null, 
  requireAuth = false,
  requireAdmin = false,
  redirectTo = '/login'
}) => {
  const location = useLocation();

  useEffect(() => {
    if (requireAuth && !user) {
      sessionStorage.setItem('redirectAfterLogin', location?.pathname);
    }
  }, [requireAuth, user, location?.pathname]);

  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requireAdmin && (!user || !user?.isAdmin)) {
    return <Navigate to="/member-hub-dashboard" replace />;
  }

  if (!requireAuth && user && (location?.pathname === '/login' || location?.pathname === '/register')) {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/member-hub-dashboard';
    sessionStorage.removeItem('redirectAfterLogin');
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default AuthenticationGuard;