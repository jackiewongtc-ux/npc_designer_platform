import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import { getDashboardOverview } from '../../services/gamificationService';

import ActivityFeedItem from './components/ActivityFeedItem';
import CreditBalanceCard from './components/CreditBalanceCard';
import QuickActionsPanel from './components/QuickActionsPanel';
import QuickStatsCard from './components/QuickStatsCard';


const MemberHubDashboard = () => {
  const { user, profile, signUp, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams?.get('session_id');

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accountCreating, setAccountCreating] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  // 1. SAFETY CHECK: Redirect to profile completion if Instagram is missing
  useEffect(() => {
    if (!authLoading && user && profile && !profile?.ig_handle) {
      console.log('Redirecting to profile completion: Missing IG Handle');
      navigate('/profile-completion');
    }
  }, [authLoading, user, profile, navigate]);

  // 2. Initial check: clear loading states
  useEffect(() => {
    const pendingRegistration = sessionStorage.getItem('pendingRegistration');
    if (user?.id) {
      if (accountCreating) setAccountCreating(false);
      if (!pendingRegistration && !sessionId) setLoading(false);
    }
  }, [user?.id, sessionId, accountCreating]);

  // 3. Handle account creation after payment
  useEffect(() => {
    let isMounted = true;
    const handlePostPaymentAccountCreation = async () => {
      if (user?.id || !sessionId || accountCreated || authLoading) return;

      const pendingRegistration = sessionStorage.getItem('pendingRegistration');
      if (!pendingRegistration) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (isMounted) {
          setAccountCreating(true);
          setLoading(true);
        }

        const registrationData = JSON.parse(pendingRegistration);
        const authData = await signUp(
          registrationData?.email,
          registrationData?.password,
          registrationData?.username,
          ''
        );

        if (!authData?.user?.id) throw new Error('Failed to create user account');

        if (isMounted) setAccountCreated(true);
        sessionStorage.removeItem('pendingRegistration');
      } catch (err) {
        if (isMounted) setError(err?.message);
      } finally {
        if (isMounted) {
          setAccountCreating(false);
          setLoading(false);
        }
      }
    };

    handlePostPaymentAccountCreation();
    return () => { isMounted = false; };
  }, [sessionId, user?.id, signUp, accountCreated, authLoading]);

  // 4. THE FIX: Safer Redirect Logic
  useEffect(() => {
    if (authLoading) return;

    if (!user?.id && !accountCreating && !sessionId && !accountCreated) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, accountCreating, sessionId, navigate, authLoading, accountCreated]);

  // 5. Load data logic
  const loadDashboardData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getDashboardOverview(user?.id);
      setDashboardData(data);
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id && !dashboardData && !authLoading) {
      loadDashboardData();
    }
  }, [user?.id, authLoading]);

  const shouldShowLoading = (authLoading && !user?.id) || (accountCreating && !user?.id) || (loading && user?.id && !dashboardData);

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your command center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <h3 className="text-red-400 font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-300 mb-4">{error}</p>
          <button onClick={loadDashboardData} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition">
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
              <h1 className="text-3xl font-bold text-white mb-2">Member Command Center</h1>
              <p className="text-purple-300">
                Welcome back, {user?.email?.split('@')?.[0] || 'Member'}! 🎮
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickStatsCard title="Level" value={experience?.level || 1} icon="⭐" color="from-yellow-500 to-orange-500" stats={{}} />
          <QuickStatsCard title="Total EXP" value={experience?.totalExpEarned?.toLocaleString() || '0'} icon="🎯" color="from-blue-500 to-cyan-500" stats={{}} />
          <QuickStatsCard title="Badges" value={badges?.length || 0} icon="🏆" color="from-purple-500 to-pink-500" stats={{}} />
          <QuickStatsCard title="Credits" value={`${credits?.balance?.toFixed(2) || '0.00'}`} icon="💎" color="from-green-500 to-emerald-500" stats={{}} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Experience Progress</h2>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden mb-4">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${experience?.progressPercentage || 0}%` }}
                />
              </div>
              <p className="text-center text-purple-300 text-sm">{experience?.progressPercentage || 0}% Complete</p>
            </div>

            <div className="bg-gradient-to-br from-slate-900/40 to-purple-900/40 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivities?.length > 0 ? (
                  recentActivities?.map((activity) => <ActivityFeedItem key={activity?.id} activity={activity} />)
                ) : (
                  <p className="text-center text-purple-300 py-8">No recent activity yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <CreditBalanceCard balance={credits?.balance || 0} />
            <QuickActionsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberHubDashboard;