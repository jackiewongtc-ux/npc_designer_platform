import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-black/40 backdrop-blur-md border-b border-purple-500/30 sticky top-0 z-50 h-16 w-full">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo - Top Left */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/assets/images/logos_-_Copy-1765345915130.png" 
            alt="NPC Designer Logo" 
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Main Navigation - Top Center */}
        <nav className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-8">
          <Link 
            to="/discover" 
            className="text-white hover:text-purple-400 transition-colors font-medium"
          >
            Discover
          </Link>
          <Link 
            to="/community-challenge-board" 
            className="text-white hover:text-purple-400 transition-colors font-medium"
          >
            Community Challenge Board
          </Link>
          <Link 
            to="/blog" 
            className="text-white hover:text-purple-400 transition-colors font-medium"
          >
            Blog
          </Link>
        </nav>

        {/* Profile Management - Top Right */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link 
                to="/member-hub-dashboard"
                className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
              >
                <User size={18} />
                <span className="font-medium">Profile</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-900/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm hover:bg-red-900/40 transition-all"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login"
                className="text-white hover:text-purple-400 transition-colors font-medium px-4 py-2"
              >
                Login
              </Link>
              <Link 
                to="/register"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all font-medium"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}