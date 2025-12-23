import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import AuthenticationGuard from '../../components/AuthenticationGuard';
import { LoginForm } from './components/LoginForm';
import SocialLogin from './components/SocialLogin';
import PlatformShowcase from './components/PlatformShowcase';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const Login = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('npcUser') || sessionStorage.getItem('npcUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  return (
    <AuthenticationGuard user={user} requireAuth={false}>
      <div className="min-h-screen bg-background">
        <Header 
          user={user}
          notifications={0}
          expProgress={0}
          currentTier="Bronze"
        />

        <main className="main-content">
          <div className="max-w-7xl mx-auto py-8 lg:py-12">
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

                  <LoginForm onLogin={handleLogin} />

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

                  <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-start gap-3">
                      <Icon name="Info" size={18} color="var(--color-accent)" className="flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Demo Credentials:</p>
                        <p>User: designer@npcdesigner.com / Design2024!</p>
                        <p>Admin: admin@npcdesigner.com / Admin2024!</p>
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

            {/* Additional Features Section */}
            <div className="mt-12 lg:mt-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Why Join NPC Designer?
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Be part of a thriving community where creativity meets opportunity
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: 'Zap',
                    title: 'Fast Track',
                    description: 'Quick design approval process with community voting',
                    color: 'var(--color-warning)'
                  },
                  {
                    icon: 'Shield',
                    title: 'IP Protection',
                    description: 'Automated copyright scanning and design protection',
                    color: 'var(--color-success)'
                  },
                  {
                    icon: 'DollarSign',
                    title: 'Fair Revenue',
                    description: 'Transparent pricing with designer profit sharing',
                    color: 'var(--color-accent)'
                  },
                  {
                    icon: 'Globe',
                    title: 'Global Reach',
                    description: 'Multi-language support for international designers',
                    color: 'var(--color-primary)'
                  }
                ]?.map((feature, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                      <Icon name={feature?.icon} size={24} color={feature?.color} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {feature?.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature?.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card mt-16">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                © {new Date()?.getFullYear()} NPC Designer Platform. All rights reserved.
              </div>
              <div className="flex items-center gap-6">
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link to="/support" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AuthenticationGuard>
  );
};

export default Login;