import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error?.message);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/assets/images/logos_-_Copy-1765345915130.png" 
              alt="NPC Logo" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/discover" className="text-gray-700 hover:text-gray-900 font-medium">
              Discover
            </Link>
            <Link to="/community-challenge-board" className="text-gray-700 hover:text-gray-900 font-medium">
              Community Challenge
            </Link>
            <Link to="/challenges" className="text-gray-700 hover:text-gray-900 font-medium">
              Challenges
            </Link>
            <Link to="/blog" className="text-gray-700 hover:text-gray-900 font-medium">
              Blog
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {profile?.profile_pic ? (
                    <img 
                      src={profile?.profile_pic} 
                      alt={profile?.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {profile?.username || user?.email?.split('@')?.[0]}
                  </span>
                </button>

                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {profile?.username || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {user?.email}
                        </p>
                        {profile?.user_tier && (
                          <p className="text-xs text-blue-600 mt-1 capitalize">
                            {profile?.user_tier?.replace('_', ' ')}
                          </p>
                        )}
                      </div>
                      
                      <Link
                        to="/member-hub-dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Dashboard
                      </Link>
                      
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Profile Settings
                      </Link>
                      
                      {profile?.role === 'designer' && (
                        <Link
                          to="/designer-hub"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Designer Hub
                        </Link>
                      )}
                      
                      {profile?.role === 'admin' && (
                        <Link
                          to="/admin-challenge-management"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Admin Panel
                        </Link>
                      )}

                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Join Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}