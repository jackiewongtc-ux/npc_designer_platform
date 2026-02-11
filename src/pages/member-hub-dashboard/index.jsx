import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardOverview } from '../../services/gamificationService';

import ActivityFeedItem from './components/ActivityFeedItem';
import CreditBalanceCard from './components/CreditBalanceCard';
import QuickActionsPanel from './components/QuickActionsPanel';
import QuickStatsCard from './components/QuickStatsCard';

const MemberHubDashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams?.get('session_id');

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // 1. Show welcome message if coming from successful payment
  useEffect(() => {
    if (sessionId && user?.id) {
      setShowWelcome(true);
      // Clear the session_id from URL after 3 seconds
      setTimeout(() => {
        navigate('/member-hub-dashboard', { replace: true });
      }, 3000);
    }
  }, [sessionId, user?.id, navigate]);

  // 2. Redirect to profile completion if Instagram is missing
  useEffect(() => {
    if (!authLoading && user && profile && !profile?.ig_handle) {
      console.log('Redirecting to profile completion: Missing IG Handle');
      navigate('/profile-completion');
    }
  }, [authLoading, user, profile, navigate]);

  // 3. Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user?.id) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, navigate, authLoading]);

  // 4. Load gamification data
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

  const shouldShowLoading = authLoading || (loading && user?.id && !dashboardData);

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
      {/* Welcome Banner */}
      {showWelcome && (
        <div className="bg-green-900/50 border-b border-green-500/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎉</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Welcome to NPC Designer!</h3>
                  <p className="text-green-300 text-sm">Your membership has been activated successfully.</p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcome(false)}
                className="text-green-300 hover:text-white transition"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Member Command Center</h1>
              <p className="text-purple-300">
                {/* CRITICAL FIX: 
                  We now prioritize profile.username (CreativeDesignerr1).
                  If that is empty, we fall back to the email prefix.
                */}
                Welcome back, {profile?.username || user?.email?.split('@')?.[0] || 'Member'}! 🎮
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