import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getDashboardOverview } from '../../services/gamificationService';

import ActivityFeedItem from './components/ActivityFeedItem';
import CreditBalanceCard from './components/CreditBalanceCard';
import QuickActionsPanel from './components/QuickActionsPanel';
import QuickStatsCard from './components/QuickStatsCard';

const MemberHubDashboard = () => {
  const { user, signUp, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams?.get('session_id');

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountCreating, setAccountCreating] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  // Initial check: if user is already logged in and no pending registration, clear loading states
  useEffect(() => {
    const pendingRegistration = sessionStorage.getItem('pendingRegistration');
    if (user?.id) {
      // User is logged in - clear account creating flag
      if (accountCreating) {
        console.log('✅ User logged in, clearing accountCreating flag');
        setAccountCreating(false);
      }

      // If no pending registration and no session_id, this is a normal visit
      if (!pendingRegistration && !sessionId) {
        console.log('✅ User already logged in on page load');
        setLoading(false);
      }
    }
  }, [user?.id, sessionId, accountCreating]);

  // Handle account creation after payment
  useEffect(() => {
    let isMounted = true;

    const handlePostPaymentAccountCreation = async () => {
      // If user is already logged in, skip account creation
      if (user?.id) {
        console.log('✅ User already logged in, skipping account creation');
        setAccountCreating(false);
        setLoading(false);
        return;
      }

      // Only process if we have session_id
      if (!sessionId || accountCreated) {
        // No session_id means this is a normal visit, not post-payment
        if (!sessionId && !accountCreated) {
          setAccountCreating(false);
        }
        return;
      }

      // Don't process if auth is still loading
      if (authLoading) {
        return;
      }

      // Check for pending registration data
      const pendingRegistration = sessionStorage.getItem('pendingRegistration');
      if (!pendingRegistration) {
        console.log('No pending registration found');
        // If no pending registration but we have session_id, user might already be created
        // Just clear loading and let normal flow continue
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setAccountCreating(true);
          setLoading(true);
        }

        const registrationData = JSON.parse(pendingRegistration);

        console.log('Creating user account after payment:', {
          email: registrationData.email,
          username: registrationData.username
        });

        // Create user account
        const authData = await signUp(
          registrationData.email,
          registrationData.password,
          registrationData.username,
          '' // bio
        );

        if (!authData?.user?.id) {
          throw new Error('Failed to create user account');
        }

        const userId = authData.user.id;

        // If no session after signUp, try to sign in (in case email confirmation is disabled)
        let sessionEstablished = !!authData.session;
        let emailConfirmationRequired = false;

        if (!authData.session) {
          console.log('No session after signUp, attempting sign in...');
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: registrationData.email,
              password: registrationData.password
            });

            if (signInError) {
              // Check if email confirmation is required
              if (signInError.code === 'email_not_confirmed' || signInError.message?.includes('email not confirmed')) {
                console.warn('Email confirmation required, attempting auto-confirm...');
                emailConfirmationRequired = true;

                // Auto-confirm email via edge function (user has already paid)
                try {
                  const { error: confirmError } = await supabase.functions.invoke('confirm-user-email', {
                    body: { userId: userId }
                  });

                  if (confirmError) {
                    console.warn('Could not auto-confirm email:', confirmError);
                    // Fallback: try to resend confirmation email
                    await supabase.auth.resend({
                      type: 'signup',
                      email: registrationData.email
                    });
                    throw new Error('Email confirmation required. Please check your email and confirm your account, then sign in.');
                  } else {
                    console.log('✅ Email auto-confirmed, retrying sign in...');

                    // Retry sign in after email confirmation
                    const { data: retrySignInData, error: retrySignInError } = await supabase.auth.signInWithPassword({
                      email: registrationData.email,
                      password: registrationData.password
                    });

                    if (retrySignInError) {
                      throw new Error(`Sign in failed after email confirmation: ${retrySignInError.message}`);
                    } else if (retrySignInData?.session) {
                      console.log('✅ Signed in successfully after email confirmation');
                      sessionEstablished = true;
                      emailConfirmationRequired = false;
                      await supabase.auth.getSession();
                    }
                  }
                } catch (confirmErr) {
                  console.error('Email confirmation error:', confirmErr);
                  throw new Error('Email confirmation required. Please check your email and confirm your account, then sign in.');
                }
              } else {
                console.warn('Could not sign in after signUp:', signInError);
                throw new Error(`Sign in failed: ${signInError.message}`);
              }
            } else if (signInData?.session) {
              console.log('✅ Signed in successfully after account creation');
              sessionEstablished = true;

              // Force refresh session to ensure auth state updates
              await supabase.auth.getSession();
            }
          } catch (signInErr) {
            console.error('Sign in attempt failed:', signInErr);

            // If email confirmation is the issue, provide better error message
            if (emailConfirmationRequired) {
              // Store info for user to complete later
              sessionStorage.setItem('pendingAccountConfirmation', JSON.stringify({
                email: registrationData.email,
                message: 'Please check your email to confirm your account, then sign in to access your dashboard.'
              }));

              throw new Error('Email confirmation required. Please check your email and confirm your account.');
            }

            throw signInErr;
          }
        }

        if (!sessionEstablished && !emailConfirmationRequired) {
          throw new Error('Failed to establish user session after account creation');
        }

        if (isMounted) {
          setAccountCreated(true);
        }

        // Wait a moment for auth state to propagate
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update user profile with social media if provided
        if (registrationData.socialMedia) {
          const updates = {};
          if (registrationData.socialMedia.instagram) {
            updates.ig_handle = registrationData.socialMedia.instagram;
          }
          if (registrationData.socialMedia.twitter) {
            updates.twitter_handle = registrationData.socialMedia.twitter;
          }
          if (registrationData.socialMedia.portfolio) {
            updates.portfolio_url = registrationData.socialMedia.portfolio;
          }

          if (Object.keys(updates).length > 0) {
            await supabase
              .from('user_profiles')
              .update(updates)
              .eq('id', userId);
          }
        }

        // Link Stripe customer to user account
        if (sessionId) {
          try {
            // Call edge function to link payment to user
            const { error: linkError } = await supabase.functions.invoke('link-payment-to-user', {
              body: {
                sessionId: sessionId,
                userId: userId
              }
            });

            if (linkError) {
              console.warn('Could not link payment immediately:', linkError);
              // Webhook will handle this eventually
            } else {
              console.log('✅ Payment linked to user account successfully');
            }
          } catch (err) {
            console.warn('Payment linking error (non-critical):', err);
          }
        }

        // Clear pending registration
        sessionStorage.removeItem('pendingRegistration');

        // Remove session_id from URL to prevent re-processing
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);

        // Wait for auth state to update via onAuthStateChange
        // The auth context will update automatically
        // Give it a moment to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (isMounted) {
          // Check if user is now available
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log('✅ User session confirmed after account creation');
            // Clear all loading states
            setAccountCreating(false);
            setLoading(false);
            // User should be available now, dashboard will load via useEffect
          } else {
            console.warn('Session not available yet, but account created');
            // Still clear accountCreating to allow normal flow
            setAccountCreating(false);
            // Loading will be cleared when user becomes available
          }
        }

      } catch (err) {
        console.error('Error creating account after payment:', err);
        if (isMounted) {
          // Provide more helpful error messages
          let errorMessage = 'Payment successful but account creation failed. Please contact support.';

          if (err?.message?.includes('Email confirmation required')) {
            errorMessage = err.message + ' Your payment was successful and your account has been created.';
          } else if (err?.message) {
            errorMessage = err.message;
          }

          setError(errorMessage);
          setAccountCreating(false);
          setLoading(false);
        }
        // Don't clear sessionStorage so user can retry
      }
    };

    handlePostPaymentAccountCreation();

    return () => {
      isMounted = false;
    };
  }, [sessionId, user?.id, signUp, accountCreated, authLoading]);

  // Monitor user availability after account creation
  useEffect(() => {
    if (accountCreated && user?.id && !accountCreating) {
      console.log('✅ User became available after account creation');
      setAccountCreating(false); // Ensure it's cleared
      setLoading(false); // Clear loading
      loadDashboardData(); // Load dashboard
    }
  }, [user?.id, accountCreated, accountCreating]);

  // Load dashboard data when user is available
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If user is available and not creating account, load dashboard
    if (user?.id) {
      // Always clear account creating when user is available
      if (accountCreating) {
        console.log('Clearing accountCreating flag - user is available');
        setAccountCreating(false);
      }

      // Only load if not already loading/loaded
      if (loading && !dashboardData) {
        console.log('✅ User available, loading dashboard data');
        setLoading(false);
        loadDashboardData();
      } else if (!loading && !dashboardData) {
        // Dashboard data not loaded yet, load it
        loadDashboardData();
      }
      return;
    }

    // If account was created but user not available yet, check session directly
    if (accountCreated && !user?.id) {
      console.log('Account created, checking session...');
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('✅ Session found, waiting for auth context to update');
          // Auth context will update via onAuthStateChange
          // Give it a moment
          setTimeout(async () => {
            if (!user?.id) {
              // Force refresh by checking session again
              const { data: { session: newSession } } = await supabase.auth.getSession();
              if (newSession?.user) {
                console.log('✅ Session confirmed, user should be available');
              } else {
                setError('Account created but session not available. Please sign in.');
                setLoading(false);
              }
            }
          }, 1000);
        } else {
          console.warn('No session found after account creation');
          setError('Account created but session not available. Please sign in.');
          setLoading(false);
        }
      };

      const timer = setTimeout(checkSession, 1500);
      return () => clearTimeout(timer);
    }

    // No user and no pending payment - redirect to login
    if (!user?.id && !accountCreating && !sessionId && !accountCreated) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, accountCreating, sessionId, navigate, authLoading, accountCreated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const data = await getDashboardOverview(user.id);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading only if:
  // 1. Auth is loading AND no user yet
  // 2. Account is being created AND no user yet
  // 3. Dashboard data is loading AND user exists
  const shouldShowLoading = (authLoading && !user?.id) ||
    (accountCreating && !user?.id) ||
    (loading && user?.id && !dashboardData);

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {accountCreating && !user?.id ? 'Setting up your account...' : 'Loading your command center...'}
          </p>
          {accountCreating && !user?.id && (
            <p className="text-purple-300 text-sm mt-2">Please wait while we complete your registration</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { experience, badges, recentActivities, credits } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Member Command Center
              </h1>
              <p className="text-purple-300">
                Welcome back, {user?.email?.split('@')?.[0] || 'Member'}! 🎮
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* <NotificationsList /> */}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickStatsCard
            title="Level"
            value={experience?.level || 1}
            icon="⭐"
            color="from-yellow-500 to-orange-500"
            stats={{}}
          />
          <QuickStatsCard
            title="Total EXP"
            value={experience?.totalExpEarned?.toLocaleString() || '0'}
            icon="🎯"
            color="from-blue-500 to-cyan-500"
            stats={{}}
          />
          <QuickStatsCard
            title="Badges Earned"
            value={badges?.length || 0}
            icon="🏆"
            color="from-purple-500 to-pink-500"
            stats={{}}
          />
          <QuickStatsCard
            title="Credits"
            value={`${credits?.balance?.toFixed(2) || '0.00'}`}
            icon="💎"
            color="from-green-500 to-emerald-500"
            stats={{}}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Tier Status & EXP */}
          <div className="lg:col-span-2 space-y-6">
            {/* EXP Progress Card */}
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Experience Progress</h2>
                <span className="text-purple-300 font-semibold">
                  Level {experience?.level || 1}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-purple-300 mb-2">
                  <span>{experience?.currentExp || 0} EXP</span>
                  <span>{experience?.expToNextLevel || 100} EXP to Level {(experience?.level || 1) + 1}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${experience?.progressPercentage || 0}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <div className="text-center mt-2 text-purple-300 text-sm font-semibold">
                  {experience?.progressPercentage || 0}% Complete
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {experience?.totalExpEarned?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-purple-300 mt-1">Total EXP Earned</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {((experience?.totalExpEarned || 0) / 100)?.toFixed(1)}k
                  </div>
                  <div className="text-sm text-purple-300 mt-1">EXP Milestone</div>
                </div>
              </div>
            </div>

            {/* Badges Showcase */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Earned Badges</h2>
                <span className="text-purple-300 text-sm">
                  {badges?.length || 0} / ∞
                </span>
              </div>

              {badges && badges?.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {badges?.slice(0, 12)?.map((badge) => (
                    <div
                      key={badge?.id}
                      className="group relative bg-black/30 rounded-lg p-3 text-center hover:bg-purple-600/20 transition-all duration-200 cursor-pointer"
                      title={badge?.name}
                    >
                      <div className="text-4xl mb-2">{badge?.icon || '🏆'}</div>
                      <div className="text-xs text-purple-300 truncate">{badge?.name}</div>

                      {/* Rarity Indicator */}
                      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${badge?.rarity === 'legendary' ? 'bg-yellow-400' :
                        badge?.rarity === 'epic' ? 'bg-purple-500' :
                          badge?.rarity === 'rare' ? 'bg-blue-500' : 'bg-gray-400'
                        }`}></div>

                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {badge?.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-purple-300">
                  <div className="text-4xl mb-2">🎯</div>
                  <p>Start earning badges by completing activities!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Credits & Quick Actions */}
          <div className="space-y-6">
            <CreditBalanceCard balance={credits?.balance || 0} />
            <QuickActionsPanel />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-gradient-to-br from-slate-900/40 to-purple-900/40 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <button className="text-purple-300 hover:text-purple-100 text-sm font-medium transition">
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {recentActivities && recentActivities?.length > 0 ? (
              recentActivities?.map((activity) => (
                <ActivityFeedItem key={activity?.id} activity={activity} />
              ))
            ) : (
              <div className="text-center py-8 text-purple-300">
                <div className="text-4xl mb-2">📝</div>
                <p>No recent activity yet. Start exploring!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberHubDashboard;