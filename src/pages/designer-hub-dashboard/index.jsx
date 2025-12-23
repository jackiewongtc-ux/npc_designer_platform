import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Header } from '../../components/Header';
import { Helmet } from 'react-helmet';
import { Briefcase, TrendingUp, Award, DollarSign, Clock, CheckCircle, AlertCircle, Loader, Target } from 'lucide-react';

const DesignerHubDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [experience, setExperience] = useState(null);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    loadDesignerData();
  }, []);

  const loadDesignerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: authError } = await supabase?.auth?.getUser();
      if (authError) throw authError;
      if (!user) {
        navigate('/login');
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase?.from('user_profiles')?.select('*')?.eq('id', user?.id)?.single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Get designs
      const { data: designsData, error: designsError } = await supabase?.from('design_submissions')?.select('*')?.eq('designer_id', user?.id)?.order('created_at', { ascending: false });

      if (designsError) throw designsError;
      setDesigns(designsData || []);

      // Get challenge responses
      const { data: challengesData, error: challengesError } = await supabase?.from('challenge_responses')?.select(`
          *,
          community_challenges(*)
        `)?.eq('designer_id', user?.id)?.order('created_at', { ascending: false });

      if (challengesError) throw challengesError;
      setChallenges(challengesData || []);

      // Get payouts
      const { data: payoutsData, error: payoutsError } = await supabase?.from('payouts')?.select('*')?.eq('user_id', user?.id)?.order('created_at', { ascending: false });

      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData || []);

      // Get experience
      const { data: expData, error: expError } = await supabase?.from('user_experience')?.select('*')?.eq('user_id', user?.id)?.single();

      if (expError && expError?.code !== 'PGRST116') throw expError;
      setExperience(expData);

      // Get badges
      const { data: badgesData, error: badgesError } = await supabase?.from('user_badges')?.select(`
          *,
          badges(*)
        `)?.eq('user_id', user?.id);

      if (badgesError) throw badgesError;
      setBadges(badgesData || []);

    } catch (err) {
      console.error('Error loading designer data:', err);
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  // Group designs by status for pipeline
  const designPipeline = {
    draft: designs?.filter(d => d?.submission_status === 'draft'),
    pending_review: designs?.filter(d => d?.submission_status === 'pending_review'),
    community_voting: designs?.filter(d => d?.submission_status === 'community_voting'),
    in_production: designs?.filter(d => d?.submission_status === 'in_production'),
    completed: designs?.filter(d => d?.submission_status === 'completed'),
    rejected: designs?.filter(d => d?.submission_status === 'rejected')
  };

  // Calculate earnings
  const totalEarnings = profile?.total_earnings || 0;
  const quarterlyEarnings = profile?.current_quarter_bonus_earned || 0;
  const quarterlyMax = profile?.quarterly_bonus_cap || 5000;
  const completedPayouts = payouts?.filter(p => p?.status === 'completed');
  const pendingPayouts = payouts?.filter(p => p?.status === 'pending');

  // Calculate tier progress
  const currentTier = profile?.user_tier || 'fan';
  const currentExp = experience?.current_exp || 0;
  const expToNextLevel = experience?.exp_to_next_level || 100;
  const expProgress = (currentExp / expToNextLevel) * 100;

  // Active challenges
  const activeChallenges = challenges?.filter(
    c => c?.status === 'pending' || c?.status === 'accepted'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Designer Hub - Dashboard</title>
      </Helmet>
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.username}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your designs
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Designs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Designs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {designs?.length}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-indigo-600" />
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${totalEarnings?.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Active Challenges */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Challenges</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {activeChallenges?.length}
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          {/* Badges Earned */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Badges Earned</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {badges?.length}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Project Pipeline */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  My Project Pipeline
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Track your designs through each stage
                </p>
              </div>
              <div className="p-6 space-y-4">
                {Object.entries(designPipeline)?.map(([status, items]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/discover?status=${status}`)}
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {getStatusLabel(status)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {items?.length} {items?.length === 1 ? 'design' : 'designs'}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {items?.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Payouts */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Recent Payouts
                </h2>
              </div>
              <div className="p-6">
                {payouts?.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No payouts yet. Keep creating to earn!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {payouts?.slice(0, 5)?.map((payout) => (
                      <div
                        key={payout?.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            ${Number(payout?.amount)?.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(payout.created_at)?.toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            payout?.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : payout?.status === 'pending' ?'bg-yellow-100 text-yellow-800' :'bg-red-100 text-red-800'
                          }`}
                        >
                          {payout?.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Earnings Gauge */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Earnings Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Quarterly Earnings
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      ${quarterlyEarnings?.toFixed(2)} / ${quarterlyMax?.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((quarterlyEarnings / quarterlyMax) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {pendingPayouts?.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Payouts</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {completedPayouts?.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Tier Progress */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Tier Progress
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Current Tier</span>
                  <span className="text-sm font-bold text-indigo-600 uppercase">
                    {currentTier}
                  </span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Experience</span>
                    <span className="text-sm font-medium text-gray-900">
                      {currentExp} / {expToNextLevel} XP
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${expProgress}%` }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Recent Badges</p>
                  <div className="flex flex-wrap gap-2">
                    {badges?.slice(0, 6)?.map((badge) => (
                      <div
                        key={badge?.id}
                        className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs"
                        title={badge?.badges?.description}
                      >
                        <span>{badge?.badges?.icon}</span>
                        <span>{badge?.badges?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Challenge Workspace */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Challenge Workspace
              </h3>
              {activeChallenges?.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">
                    No active challenges
                  </p>
                  <button
                    onClick={() => navigate('/challenges')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Browse Challenges
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeChallenges?.slice(0, 3)?.map((challenge) => (
                    <div
                      key={challenge?.id}
                      className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => navigate(`/challenges/${challenge?.challenge_id}`)}
                    >
                      <p className="font-medium text-gray-900">
                        {challenge?.community_challenges?.title}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            challenge?.status === 'accepted' ?'bg-green-100 text-green-800' :'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {challenge?.status}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(challenge.created_at)?.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stripe Connect Status */}
            {!profile?.stripe_connect_account_id && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800">
                      Connect Stripe Account
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Link your Stripe account to receive payouts for funded designs.
                    </p>
                    <button className="mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900">
                      Connect Now →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getStatusIcon = (status) => {
  const icons = {
    draft: <Clock className="w-5 h-5 text-gray-600" />,
    pending_review: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    community_voting: <TrendingUp className="w-5 h-5 text-blue-600" />,
    in_production: <Briefcase className="w-5 h-5 text-purple-600" />,
    completed: <CheckCircle className="w-5 h-5 text-green-600" />,
    rejected: <AlertCircle className="w-5 h-5 text-red-600" />
  };
  return icons?.[status] || <Briefcase className="w-5 h-5 text-gray-600" />;
};

const getStatusLabel = (status) => {
  const labels = {
    draft: 'Drafts',
    pending_review: 'Pending Review',
    community_voting: 'Community Voting',
    in_production: 'In Production',
    completed: 'Completed',
    rejected: 'Rejected'
  };
  return labels?.[status] || status;
};

export default DesignerHubDashboard;