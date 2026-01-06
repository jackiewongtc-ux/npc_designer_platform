import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthenticationGuard from '../../components/AuthenticationGuard';
import { LoginForm } from './components/LoginForm';
import SocialLogin from './components/SocialLogin';
import PlatformShowcase from './components/PlatformShowcase';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  // Destructuring loading to ensure we wait for the AuthContext to finish its check
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // REDIRECT LOGIC: Only run when NOT loading and data is present
    if (!loading && user && profile) {
      // 1. Check for Admin
      if (profile?.role === 'admin') {
        navigate('/admin-challenge-management');
        return;
      }

      // 2. Check for Designer
      if (profile?.role === 'designer') {
        navigate('/designer-hub-dashboard');
        return;
      }

      // 3. Check for Regular Member / Onboarding
      const hasIg = profile?.ig_handle || profile?.igHandle;
      if (!hasIg) {
        navigate('/profile-completion');
      } else {
        navigate('/member-hub-dashboard');
      }
    }
  }, [user, profile, loading, navigate]);

  // If loading the auth state, show a clean background to prevent "flickering" 
  // or premature execution of child component logic
  if (loading && !user) {
    return <div className="min-h-screen bg-background animate-pulse" />;
  }

  return (
    <AuthenticationGuard requireAuth={false}>
      <div className="min-h-screen bg-background">
        <main className="main-content">
          <div className="max-w-7xl mx-auto py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              
              {/* Login Form Section */}
              <div className="order-2 lg:order-1">
                <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 lg:p-10 shadow-sm">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Icon name="LogIn" size={24} color="var(--color-accent)" />
                      </div>
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                          Sign In
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                          Access your designer community account
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* The LoginForm handles the Supabase auth logic */}
                  <LoginForm />

                  <div className="mt-8">
                    <SocialLogin />
                  </div>

                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Don't have an account yet?
                      </p>
                      <Button
                        variant="outline"
                        fullWidth
                        iconName="UserPlus"
                        iconPosition="left"
                        onClick={() => navigate('/register')}
                      >
                        Create New Account
                      </Button>
                    </div>
                  </div>

                  {/* Demo Credentials Box */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start gap-3">
                      <Icon name="Info" size={18} color="var(--color-accent)" className="flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Credentials:</p>
                        <p>User: designer@npcdesigner.com</p>
                        <p>Admin: admin@npcdesigner.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Trust Signals */}
                <div className="lg:hidden mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="text-2xl font-bold text-accent mb-1">15K+</div>
                    <div className="text-xs text-muted-foreground">Active Designers</div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="text-2xl font-bold text-success mb-1">8.5K</div>
                    <div className="text-xs text-muted-foreground">Designs Created</div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="text-2xl font-bold text-warning mb-1">98%</div>
                    <div className="text-xs text-muted-foreground">Satisfaction</div>
                  </div>
                </div>
              </div>

              {/* Platform Showcase Section - Desktop Only */}
              <div className="order-1 lg:order-2 hidden lg:block lg:sticky lg:top-24">
                <PlatformShowcase />
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-12 lg:mt-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Why Join NPC Designer?
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: 'Zap', title: 'Fast Track', color: 'var(--color-warning)' },
                  { icon: 'Shield', title: 'IP Protection', color: 'var(--color-success)' },
                  { icon: 'DollarSign', title: 'Fair Revenue', color: 'var(--color-accent)' },
                  { icon: 'Globe', title: 'Global Reach', color: 'var(--color-primary)' }
                ]?.map((feature, index) => (
                  <div key={index} className="p-6 rounded-xl bg-card border border-border">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                      <Icon name={feature?.icon} size={24} color={feature?.color} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature?.title}</h3>
                    <p className="text-sm text-muted-foreground">Professional designer tools and community support.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t border-border bg-card mt-16">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date()?.getFullYear()} NPC Designer Platform.
            </div>
            <div className="flex gap-6">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">Terms</Link>
              <Link to="/support" className="text-sm text-muted-foreground hover:text-accent transition-colors">Support</Link>
            </div>
          </div>
        </footer>
      </div>
    </AuthenticationGuard>
  );
};

export default Login;