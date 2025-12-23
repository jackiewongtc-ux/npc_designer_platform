import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardOverview } from '../../services/gamificationService';

import QuickStatsCard from './components/QuickStatsCard';
import CreditBalanceCard from './components/CreditBalanceCard';
import QuickActionsPanel from './components/QuickActionsPanel';
import ActivityFeedItem from './components/ActivityFeedItem';
import NotificationsList from './components/NotificationsList';

const MemberHubDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardOverview(user?.id);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
                      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                        badge?.rarity === 'legendary' ? 'bg-yellow-400' :
                        badge?.rarity === 'epic' ? 'bg-purple-500' :
                        badge?.rarity === 'rare'? 'bg-blue-500' : 'bg-gray-400'
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