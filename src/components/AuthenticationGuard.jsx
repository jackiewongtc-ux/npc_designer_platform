import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthenticationGuard = ({ 
  children, 
  requireAuth = false,
  requireAdmin = false,
  redirectTo = '/login'
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Store the intended destination if they need to login first
    if (requireAuth && !user && !loading) {
      sessionStorage.setItem('redirectAfterLogin', location?.pathname);
    }
  }, [requireAuth, user, loading, location?.pathname]);

  // 1. Loading state - important to prevent flickering redirects
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-accent"></div>
      </div>
    );
  }

  // 2. Auth Check: If page requires login but user isn't logged in
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Define helper role constants
  const isAdmin = profile?.role === 'admin';
  const isDesigner = profile?.role === 'designer';
  const isProfilePage = location?.pathname === '/profile-completion';

  // 3. SMART PROFILE REDIRECT:
  // If user is logged in, has NO IG handle, is NOT an admin/designer, 
  // and is NOT already on the profile page -> Force redirect to profile completion.
  if (user && profile && !isAdmin && !isDesigner) {
    const hasIg = profile?.ig_handle || profile?.igHandle;
    if (!hasIg && !isProfilePage) {
      return <Navigate to="/profile-completion" replace />;
    }
  }

  // 4. Admin Check: If page requires admin permissions
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/member-hub-dashboard" replace />;
  }

  // 5. Already Logged In Check: Prevents logged-in users from seeing Login/Register pages
  const isAuthPage = location?.pathname === '/login' || location?.pathname === '/register';
  
  if (!requireAuth && user && isAuthPage) {
    let targetPath = '/member-hub-dashboard';
    
    if (isAdmin) {
      targetPath = '/admin-challenge-management';
    } else if (isDesigner) {
      targetPath = '/designer-hub-dashboard';
    }

    const savedPath = sessionStorage.getItem('redirectAfterLogin');
    const finalPath = savedPath || targetPath;
    
    sessionStorage.removeItem('redirectAfterLogin');
    return <Navigate to={finalPath} replace />;
  }

  return <>{children}</>;
};

export default AuthenticationGuard;