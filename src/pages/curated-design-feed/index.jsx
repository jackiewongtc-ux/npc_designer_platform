import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedService } from '../../services/feedService';
import { useAuth } from '../../contexts/AuthContext';
import TrendingDesignCard from './components/TrendingDesignCard';
import FeaturedChallengeCard from './components/FeaturedChallengeCard';
import PopularDesignerCard from './components/PopularDesignerCard';
import RecommendationCard from './components/RecommendationCard';
import FilterControls from './components/FilterControls';
import { Sparkles, TrendingUp, Trophy, Users, Loader2 } from 'lucide-react';

export default function CuratedDesignFeed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for feed data
  const [trendingDesigns, setTrendingDesigns] = useState([]);
  const [featuredChallenges, setFeaturedChallenges] = useState([]);
  const [popularDesigners, setPopularDesigners] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isMember, setIsMember] = useState(false);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [activeTab, setActiveTab] = useState('all');

  // Load all feed data
  useEffect(() => {
    loadFeedData();
  }, [user, selectedCategory, selectedTimeframe]);

  const loadFeedData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load data in parallel
      const [trending, challenges, designers, recommended, memberStatus] = await Promise.all([
        feedService?.getTrendingDesigns(12, selectedCategory, selectedTimeframe),
        feedService?.getFeaturedChallenges(6),
        feedService?.getPopularDesigners(8),
        user ? feedService?.getPersonalizedRecommendations(user?.id, 8) : feedService?.getTrendingDesigns(8),
        user ? feedService?.checkMemberStatus(user?.id) : Promise.resolve(false)
      ]);

      setTrendingDesigns(trending);
      setFeaturedChallenges(challenges);
      setPopularDesigners(designers);
      setRecommendations(recommended);
      setIsMember(memberStatus);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError(err?.message || 'Failed to load feed data');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleDesignClick = (designId) => {
    navigate(`/design-details/${designId}`);
  };

  const handleChallengeClick = (challengeId) => {
    navigate(`/community-challenge-board?challenge=${challengeId}`);
  };

  const handleDesignerClick = (designerId) => {
    navigate(`/designer-public-profile/${designerId}`);
  };

  // Filter content based on active tab
  const getFilteredContent = () => {
    switch (activeTab) {
      case 'designs':
        return { designs: trendingDesigns, challenges: [], designers: [] };
      case 'challenges':
        return { designs: [], challenges: featuredChallenges, designers: [] };
      case 'designers':
        return { designs: [], challenges: [], designers: popularDesigners };
      default:
        return { designs: trendingDesigns, challenges: featuredChallenges, designers: popularDesigners };
    }
  };

  const filteredContent = getFilteredContent();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading curated feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Feed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadFeedData}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Curated Design Feed</h1>
          </div>
          <p className="text-xl text-indigo-100">
            Discover trending designs, featured challenges, and popular designers
          </p>
          {user && isMember && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-sm font-medium">✨ Member Exclusive Content</span>
            </div>
          )}
        </div>
      </div>
      {/* Filter Controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <FilterControls
            selectedCategory={selectedCategory}
            selectedTimeframe={selectedTimeframe}
            activeTab={activeTab}
            onCategoryChange={handleCategoryChange}
            onTimeframeChange={handleTimeframeChange}
            onTabChange={handleTabChange}
            filters={{}}
            onFilterChange={() => {}}
            onSearch={() => {}}
            onExport={() => {}}
            onReset={() => {}}
            resultCount={0}
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Personalized Recommendations - Only for authenticated users */}
        {user && recommendations?.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations?.map(design => (
                <RecommendationCard
                  key={design?.id}
                  design={design}
                  onClick={() => handleDesignClick(design?.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured Challenges */}
        {(activeTab === 'all' || activeTab === 'challenges') && filteredContent?.challenges?.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Challenges</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent?.challenges?.map(challenge => (
                <FeaturedChallengeCard
                  key={challenge?.id}
                  challenge={challenge}
                  onClick={() => handleChallengeClick(challenge?.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Trending Designs */}
        {(activeTab === 'all' || activeTab === 'designs') && filteredContent?.designs?.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Trending Designs</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContent?.designs?.map(design => (
                <TrendingDesignCard
                  key={design?.id}
                  design={design}
                  isMember={isMember}
                  onClick={() => handleDesignClick(design?.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Popular Designers */}
        {(activeTab === 'all' || activeTab === 'designers') && filteredContent?.designers?.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Popular Designers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredContent?.designers?.map(designer => (
                <PopularDesignerCard
                  key={designer?.id}
                  designer={designer}
                  onClick={() => handleDesignerClick(designer?.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredContent?.designs?.length === 0 && 
         filteredContent?.challenges?.length === 0 && 
         filteredContent?.designers?.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Content Found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or check back later for new content
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveTab('all');
              }}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}