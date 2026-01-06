import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from './AppIcon';
import Button from './ui/Button';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location]);

  const handleSignOut = async () => {
    try {
      setIsDropdownOpen(false);
      await signOut();
      // Use replace: true to prevent user from going back to protected pages
      navigate('/login', { replace: true });
    } catch (error) {
      console.error("Sign out failed:", error);
      navigate('/login');
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isDesigner = profile?.role === 'designer';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Icon name="Zap" size={20} color="white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                NPC Designer
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/challenges" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Challenges
              </Link>
              <Link to="/discover" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Discover
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                  </div>
                  <Icon name="ChevronDown" size={16} className={`text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-card shadow-lg py-2 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-2 border-b border-border mb-2">
                      <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>

                    {/* ADMIN SECTION */}
                    {isAdmin && (
                      <div className="pb-2 mb-2 border-b border-border">
                        <div className="px-4 py-1 text-[10px] font-bold text-red-500 uppercase tracking-wider">Admin Tools</div>
                        <Link to="/admin-challenge-management" className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                          <Icon name="Shield" size={18} className="text-red-500" />
                          Challenge Management
                        </Link>
                        <Link to="/admin-challenge-moderation" className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                          <Icon name="CheckSquare" size={18} className="text-orange-500" />
                          Moderation
                        </Link>
                        <Link to="/admin-design-pricing-configuration" className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                          <Icon name="DollarSign" size={18} className="text-emerald-500" />
                          Pricing Config
                        </Link>
                      </div>
                    )}

                    {/* DESIGNER SECTION */}
                    {isDesigner && (
                      <Link to="/designer-hub-dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                        <Icon name="LayoutDashboard" size={18} className="text-cyan-500" />
                        Designer Console
                      </Link>
                    )}

                    {/* COMMON LINKS */}
                    <Link to="/member-hub-dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      <Icon name="User" size={18} />
                      Member Hub
                    </Link>

                    <Link to="/profile-completion" className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      <Icon name="Settings" size={18} className="text-accent" />
                      Account Settings
                    </Link>

                    <div className="h-px bg-border my-2" />

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <Icon name="LogOut" size={18} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
                <Link to="/register"><Button variant="primary" size="sm">Join</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;