import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthenticationGuard = ({ 
  children, 
  requireAuth = false, 
  requireAdmin = false 
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
      </div>
    );
  }

  // 1. Basic Auth Check (Existing Logic)
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = profile?.role === 'admin';
  const isDesigner = profile?.role === 'designer';
  const isProfilePage = location.pathname === '/profile-completion';

  // 2. MEMBER-ONLY ONBOARDING CHECK
  // We explicitly bypass this check for Admins and Designers 
  // to ensure their dropdowns and access remain untouched.
  if (user && profile && !isAdmin && !isDesigner) {
    const hasIg = profile?.ig_handle || profile?.igHandle;
    
    // If they are a member and missing their handle, send to completion
    // BUT only if they aren't already there (prevents the infinite loop)
    if (!hasIg && !isProfilePage) {
      return <Navigate to="/profile-completion" replace />;
    }
  }

  // 3. Admin Security (Existing Logic - Untouched)
  if (requireAdmin && !isAdmin) {
    const fallback = isDesigner ? '/designer-hub-dashboard' : '/member-hub-dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default AuthenticationGuard;