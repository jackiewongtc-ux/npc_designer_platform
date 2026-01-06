import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthenticationGuard = ({ children, requireAuth = false, requireAdmin = false }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 1. Wait for AuthContext to finish loading the session and profile
  if (loading) return null;

  // 2. Basic Authentication Check
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Define Roles based on your 'user_profiles' schema
  const isAdmin = profile?.role === 'admin';
  const isDesigner = profile?.role === 'designer';
  const isProfilePage = location.pathname === '/profile-completion';

  /**
   * 4. THE MEMBER BYPASS LOGIC
   * This section only triggers if the user is NOT an Admin or Designer.
   * This ensures Admin/Designer tools are NEVER hidden or redirected.
   */
  if (user && profile && !isAdmin && !isDesigner) {
    // Using your exact DB column name: ig_handle
    const hasIg = profile?.ig_handle;
    
    // If a Member is missing their IG handle, force them to complete profile
    // unless they are already on that page.
    if (!hasIg && !isProfilePage) {
      return <Navigate to="/profile-completion" replace />;
    }
  }

  /**
   * 5. ADMIN SECURITY
   * Specifically protects routes marked with 'requireAdmin'
   */
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If all checks pass, render the protected content
  return <>{children}</>;
};

export default AuthenticationGuard;