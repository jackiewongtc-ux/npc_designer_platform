import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ChallengeCard from './components/ChallengeCard';
import FilterToolbar from './components/FilterToolbar';
import FeaturedCarousel from './components/FeaturedCarousel';
import CreateChallengeModal from './components/CreateChallengeModal';
import VoteTrackingPanel from './components/VoteTrackingPanel';
import MobileFilterPanel from './components/MobileFilterPanel';
import { challengeService, challengeVoteService } from '../../services/challengeService';

const CommunityChallengeBoard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    sort: 'popular'
  });

  const [challenges, setChallenges] = useState([]);
  const [featuredChallenges, setFeaturedChallenges] = useState([]);
  const [stats, setStats] = useState({
    todayVotes: 0,
    activeUsers: 0,
    completedChallenges: 0,
    trendingCount: 0
  });
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [voteCounts, setVoteCounts] = useState({});

  useEffect(() => {
    loadChallenges();
    loadStats();
  }, []);

  useEffect(() => {
    filterAndSortChallenges();
  }, [challenges, filters]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [allChallenges, featured] = await Promise.all([
        challengeService?.getAll(),
        challengeService?.getAll({ featured: true })
      ]);

      setChallenges(allChallenges);
      setFeaturedChallenges(featured);

      const counts = {};
      const votes = {};
      await Promise.all(allChallenges?.map(async (challenge) => {
        counts[challenge.id] = await challengeService?.getParticipantCount(challenge?.id);
        votes[challenge.id] = await challengeService?.getVoteCount(challenge?.id);
      }));

      setParticipantCounts(counts);
      setVoteCounts(votes);
    } catch (err) {
      setError(err?.message);
      console.error('Error loading challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await challengeService?.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const filterAndSortChallenges = () => {
    let result = [...challenges];

    if (filters?.category !== 'all') {
      result = result?.filter((c) => c?.category === filters?.category);
    }

    if (filters?.status !== 'all') {
      result = result?.filter((c) => c?.status === filters?.status);
    }

    switch (filters?.sort) {
      case 'newest':
        result?.sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt));
        break;
      case 'deadline':
        result?.sort((a, b) => new Date(a?.deadline) - new Date(b?.deadline));
        break;
      case 'votes':
        result?.sort((a, b) => (voteCounts?.[b?.id] || 0) - (voteCounts?.[a?.id] || 0));
        break;
      default:
        result?.sort((a, b) => (participantCounts?.[b?.id] || 0) - (participantCounts?.[a?.id] || 0));
    }

    setFilteredChallenges(result);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleVote = async (challengeId) => {
    try {
      await challengeVoteService?.vote(challengeId, challengeId, 1);
      await loadChallenges();
      await loadStats();
    } catch (err) {
      setError(err?.message);
      console.error('Error voting:', err);
    }
  };

  const handleApply = (challengeId) => {
    navigate(`/design-details?challengeId=${challengeId}`);
  };

  const handleCreateChallenge = () => {
    setIsCreateModalOpen(true);
  };

  const handleSubmitChallenge = async (formData) => {
    try {
      await challengeService?.create(formData);
      setIsCreateModalOpen(false);
      await loadChallenges();
    } catch (err) {
      setError(err?.message);
      console.error('Error creating challenge:', err);
    }
  };

  const enrichedChallenges = filteredChallenges?.map(challenge => ({
    ...challenge,
    participants: participantCounts?.[challenge?.id] || 0,
    votes: voteCounts?.[challenge?.id] || 0,
    daysRemaining: Math.ceil((new Date(challenge.deadline) - new Date()) / (1000 * 60 * 60 * 24))
  }));

  const enrichedFeatured = featuredChallenges?.map(challenge => ({
    ...challenge,
    participants: participantCounts?.[challenge?.id] || 0,
    votes: voteCounts?.[challenge?.id] || 0,
    daysRemaining: Math.ceil((new Date(challenge.deadline) - new Date()) / (1000 * 60 * 60 * 24))
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={profile}
        notifications={3}
        expProgress={profile?.user_exp || 0}
        currentTier={profile?.user_tier} />
      <main className="main-content pb-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Community Challenge Board</h1>
            <p className="text-muted-foreground">Discover and participate in design challenges from the community</p>
          </div>
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Open filters">
            <Icon name="SlidersHorizontal" size={20} />
          </button>
        </div>

        <VoteTrackingPanel stats={stats} />

        {enrichedFeatured?.length > 0 && <FeaturedCarousel challenges={enrichedFeatured} />}

        <div className="hidden lg:block">
          <FilterToolbar
            filters={filters}
            onFilterChange={handleFilterChange}
            resultCount={enrichedChallenges?.length}
            onCreateChallenge={handleCreateChallenge} />
        </div>

        <div className="lg:hidden mb-4">
          <Button
            variant="default"
            iconName="Plus"
            iconPosition="left"
            onClick={handleCreateChallenge}
            fullWidth>
            Create Challenge
          </Button>
        </div>

        {enrichedChallenges?.length === 0 ?
        <div className="bg-card rounded-lg border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Icon name="Search" size={32} color="var(--color-muted-foreground)" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No challenges found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters or create a new challenge</p>
            <Button variant="default" iconName="Plus" onClick={handleCreateChallenge}>
              Create Challenge
            </Button>
          </div> :
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedChallenges?.map((challenge) =>
          <ChallengeCard
            key={challenge?.id}
            challenge={challenge}
            onVote={handleVote}
            onApply={handleApply} />
          )}
          </div>
        }
      </main>
      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSubmitChallenge} />
      <MobileFilterPanel
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={() => {}} />
    </div>
  );
};

export default CommunityChallengeBoard;