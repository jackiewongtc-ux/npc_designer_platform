import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Settings, LayoutDashboard, ChevronDown, ShieldCheck, Paintbrush } from 'lucide-react';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut();
    navigate('/login');
  };

  const isAdmin = profile?.role === 'admin';
  const isDesigner = profile?.role === 'designer';

  return (
    <header className="bg-black/40 backdrop-blur-md border-b border-purple-500/30 sticky top-0 z-50 h-16 w-full">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between relative">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/assets/images/logos_-_Copy-1765345915130.png" 
            alt="NPC Designer Logo" 
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Main Navigation */}
        <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-8">
          <Link to="/discover" className="text-white hover:text-purple-400 transition-colors font-medium">Discover</Link>
          <Link to="/community-challenge-board" className="text-white hover:text-purple-400 transition-colors font-medium">Community</Link>
          <Link to="/blog" className="text-white hover:text-purple-400 transition-colors font-medium">Blog</Link>
        </nav>

        {/* Right Side: Auth/Profile */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 px-3 py-2 rounded-xl transition-all text-white"
              >
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold">
                  {user.email?.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden sm:block">Account</span>
                <ChevronDown size={14} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden py-2">
                  <div className="px-4 py-3 border-b border-white/5 mb-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Account</p>
                    <p className="text-sm text-slate-200 truncate font-medium">{user.email}</p>
                  </div>

                  {/* Standard Member Links */}
                  <Link 
                    to="/member-hub-dashboard" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
                  >
                    <LayoutDashboard size={18} className="text-purple-500" />
                    Member Dashboard
                  </Link>

                  <Link 
                    to="/profile-completion" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
                  >
                    <Settings size={18} className="text-purple-500" />
                    Account Settings
                  </Link>

                  {/* DESIGNER SECTION */}
                  {isDesigner && (
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <div className="px-4 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-cyan-500 font-bold">Designer Console</p>
                      </div>
                      <Link 
                        to="/designer-hub-dashboard" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                      >
                        <Paintbrush size={18} className="text-cyan-500" />
                        Designer Dashboard
                      </Link>
                    </div>
                  )}

                  {/* ADMIN SECTION */}
                  {isAdmin && (
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <div className="px-4 py-2">
                        <p className="text-[10px] uppercase tracking-wider text-red-500 font-bold">Admin Console</p>
                      </div>
                      <Link 
                        to="/admin-challenge-management" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <ShieldCheck size={18} className="text-red-500" />
                        Challenge Management
                      </Link>
                    </div>
                  )}

                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-400 hover:bg-white/5 transition-colors font-medium"
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-white hover:text-purple-400 transition-colors font-medium">Login</Link>
              <Link to="/register" className="bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700 transition-all font-bold">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}