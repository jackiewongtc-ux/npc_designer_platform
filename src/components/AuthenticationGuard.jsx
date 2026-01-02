import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'
; // Import your hook

const AuthenticationGuard = ({ 
  children, 
  requireAuth = false,
  requireAdmin = false,
  redirectTo = '/login'
}) => {
  const { user, profile, loading } = useAuth(); // Get data from global state
  const location = useLocation();

  useEffect(() => {
    if (requireAuth && !user && !loading) {
      sessionStorage.setItem('redirectAfterLogin', location?.pathname);
    }
  }, [requireAuth, user, loading, location?.pathname]);

  // 1. Wait for loading to finish before making decisions
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // 2. Auth Check
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3. Admin Check - FIX: Check profile.role instead of user.isAdmin
  const isAdmin = profile?.role === 'admin';
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/member-hub-dashboard" replace />;
  }

  // 4. Already Logged In Check (for Login/Register pages)
  if (!requireAuth && user && (location?.pathname === '/login' || location?.pathname === '/register')) {
    const redirectPath = isAdmin ? '/admin-challenge-management' : (sessionStorage.getItem('redirectAfterLogin') || '/member-hub-dashboard');
    sessionStorage.removeItem('redirectAfterLogin');
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default AuthenticationGuard;