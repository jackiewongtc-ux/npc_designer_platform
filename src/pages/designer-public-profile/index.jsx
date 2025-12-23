import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { profileService } from '../../services/profileService';
import { ProfileHeader } from './components/ProfileHeader';
import { TierStatusCard } from './components/TierStatusCard';
import { BadgesShowcase } from './components/BadgesShowcase';
import { DesignPortfolio } from './components/DesignPortfolio';
import Button from '../../components/ui/Button';

export default function DesignerPublicProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const designerId = searchParams?.get('id');

  const [profile, setProfile] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!designerId) {
      setError('Designer ID is required');
      setLoading(false);
      return;
    }

    loadDesignerData();
  }, [designerId]);

  const loadDesignerData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load profile, designs, and stats in parallel
      const [profileData, designsData, statsData] = await Promise.all([
        profileService?.getDesignerProfile(designerId),
        profileService?.getDesignerDesigns(designerId),
        profileService?.getDesignerStats(designerId)
      ]);

      setProfile(profileData);
      setDesigns(designsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading designer data:', err);
      setError(err?.message || 'Failed to load designer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (filters) => {
    try {
      setLoading(true);
      const filteredDesigns = await profileService?.getDesignerDesigns(designerId, filters);
      setDesigns(filteredDesigns);
    } catch (err) {
      console.error('Error filtering designs:', err);
      setError(err?.message || 'Failed to filter designs');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      await profileService?.toggleFollow(designerId);
      setIsFollowing(!isFollowing);
      
      // Update follower count in profile
      if (profile) {
        setProfile({
          ...profile,
          followersCount: isFollowing 
            ? profile?.followersCount - 1 
            : profile?.followersCount + 1
        });
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      // Show error message or toast notification
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading designer profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{profile?.username ? `${profile?.username} - Designer Profile` : 'Designer Profile'} | NPC</title>
        <meta 
          name="description" 
          content={profile?.bio || 'View designer profile, tier status, badges, and design portfolio'} 
        />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <ProfileHeader
            profile={profile}
            stats={stats}
            onFollowToggle={handleFollowToggle}
            isFollowing={isFollowing}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tier & Badges */}
            <div className="lg:col-span-1">
              <TierStatusCard 
                profile={profile}
                tier={profile?.tier}
                expProgress={profile?.expProgress}
                expCurrent={profile?.expCurrent}
                expRequired={profile?.expRequired}
                badges={profile?.badges}
              />
              <BadgesShowcase 
                badges={profile?.badges} 
                achievements={profile?.achievementsUnlocked} 
              />
            </div>

            {/* Right Column - Design Portfolio */}
            <div className="lg:col-span-2">
              <DesignPortfolio 
                designs={designs}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Loading Overlay for Filter Changes */}
          {loading && profile && (
            <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <span className="text-gray-700">Updating...</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}