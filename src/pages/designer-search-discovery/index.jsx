import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, TrendingUp, Users, Star, Briefcase, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';





const DesignerSearchDiscovery = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [designers, setDesigners] = useState([]);
  const [filteredDesigners, setFilteredDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  
  // Filter states
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [minFollowers, setMinFollowers] = useState(0);
  const [minRating, setMinRating] = useState(0);

  // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const tierOptions = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const categoryOptions = ['Streetwear', 'Formal', 'Casual', 'Athletic', 'Accessories', 'Sustainable'];
  const availabilityOptions = [
    { value: 'all', label: 'All Designers' },
    { value: 'available', label: 'Available Now' },
    { value: 'busy', label: 'Busy' }
  ];

  useEffect(() => {
    fetchDesigners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedTiers, selectedCategories, selectedAvailability, minFollowers, minRating, sortBy, designers]);

  useEffect(() => {
    if (searchQuery?.length > 0) {
      generateSuggestions();
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, designers]);

  const fetchDesigners = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user_profiles with role='designer' and their design counts
      const { data: profilesData, error: profilesError } = await supabase
        ?.from('user_profiles')
        ?.select(`
          id,
          username,
          bio,
          profile_pic,
          user_tier,
          followers_count,
          role,
          ig_handle,
          badges
        `)
        ?.eq('role', 'designer')
        ?.order('followers_count', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch design counts and featured designs for each designer
      const designersWithStats = await Promise.all(
        profilesData?.map(async (profile) => {
          const { data: designs, error: designsError } = await supabase
            ?.from('design_submissions')
            ?.select('id, title, image_urls, votes_count, submission_status')
            ?.eq('designer_id', profile?.id)
            ?.neq('submission_status', 'draft')
            ?.order('votes_count', { ascending: false })
            ?.limit(3);

          // Extract first image from image_urls array for each design
          const featured_designs = designs?.map(d => ({
            ...d,
            image_url: d?.image_urls?.[0] || '/assets/images/no_image.png'
          })) || [];

          return {
            ...profile,
            design_count: designs?.length || 0,
            featured_designs,
            total_votes: designs?.reduce((sum, d) => sum + (d?.votes_count || 0), 0) || 0,
            // Map user_tier to tier_level for compatibility
            tier_level: profile?.user_tier,
            // Add default values for missing fields
            specialties: [],
            rating: 0,
            location: ''
          };
        })
      );

      setDesigners(designersWithStats);
      setFilteredDesigners(designersWithStats);
    } catch (err) {
      console.error('Error fetching designers:', err);
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = () => {
    const query = searchQuery?.toLowerCase();
    const matches = designers?.filter(d => 
        d?.username?.toLowerCase()?.includes(query) ||
        d?.bio?.toLowerCase()?.includes(query) ||
        d?.specialties?.some(s => s?.toLowerCase()?.includes(query))
      )?.slice(0, 5)?.map(d => ({
        id: d?.id,
        text: d?.username || d?.full_name,
        type: 'designer'
      }));

    const categoryMatches = categoryOptions?.filter(c => c?.toLowerCase()?.includes(query))?.slice(0, 3)?.map(c => ({
        text: c,
        type: 'category'
      }));

    setSuggestions([...matches, ...categoryMatches]);
    setShowSuggestions(true);
  };

  const applyFilters = () => {
    let filtered = [...designers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery?.toLowerCase();
      filtered = filtered?.filter(d =>
        d?.username?.toLowerCase()?.includes(query) ||
        d?.bio?.toLowerCase()?.includes(query) ||
        d?.specialties?.some(s => s?.toLowerCase()?.includes(query))
      );
    }

    // Tier filter
    if (selectedTiers?.length > 0) {
      filtered = filtered?.filter(d => selectedTiers?.includes(d?.tier_level));
    }

    // Category filter
    if (selectedCategories?.length > 0) {
      filtered = filtered?.filter(d =>
        d?.specialties?.some(s => selectedCategories?.includes(s))
      );
    }

    // Availability filter
    if (selectedAvailability !== 'all') {
      filtered = filtered?.filter(d => d?.availability_status === selectedAvailability);
    }

    // Follower count filter
    if (minFollowers > 0) {
      filtered = filtered?.filter(d => (d?.followers_count || 0) >= minFollowers);
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered?.filter(d => (d?.rating || 0) >= minRating);
    }

    // Sorting
    filtered?.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return (b?.followers_count || 0) - (a?.followers_count || 0);
        case 'tier':
          const tierOrder = { Platinum: 4, Gold: 3, Silver: 2, Bronze: 1 };
          return (tierOrder?.[b?.tier_level] || 0) - (tierOrder?.[a?.tier_level] || 0);
        case 'activity':
          return (b?.total_votes || 0) - (a?.total_votes || 0);
        case 'rating':
          return (b?.rating || 0) - (a?.rating || 0);
        default: // relevance
          if (searchQuery) {
            const aScore = calculateRelevanceScore(a);
            const bScore = calculateRelevanceScore(b);
            return bScore - aScore;
          }
          return (b?.followers_count || 0) - (a?.followers_count || 0);
      }
    });

    setFilteredDesigners(filtered);
  };

  const calculateRelevanceScore = (designer) => {
    const query = searchQuery?.toLowerCase();
    let score = 0;

    if (designer?.username?.toLowerCase()?.includes(query)) score += 10;
    if (designer?.bio?.toLowerCase()?.includes(query)) score += 8;
    if (designer?.specialties?.some(s => s?.toLowerCase()?.includes(query))) score += 5;
    
    score += (designer?.followers_count || 0) * 0.01;
    score += (designer?.design_count || 0) * 0.5;
    
    return score;
  };

  const handleFollowToggle = async (designerId) => {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Update local state optimistically
      setFilteredDesigners(prev =>
        prev?.map(d =>
          d?.id === designerId
            ? { ...d, followers_count: (d?.followers_count || 0) + 1 }
            : d
        )
      );

      // In a real app, you'd call a follow/unfollow service here
      console.log('Follow toggled for designer:', designerId);
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const clearFilters = () => {
    setSelectedTiers([]);
    setSelectedCategories([]);
    setSelectedAvailability('all');
    setMinFollowers(0);
    setMinRating(0);
    setSearchQuery('');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTiers?.length > 0) count++;
    if (selectedCategories?.length > 0) count++;
    if (selectedAvailability !== 'all') count++;
    if (minFollowers > 0) count++;
    if (minRating > 0) count++;
    return count;
  }, [selectedTiers, selectedCategories, selectedAvailability, minFollowers, minRating]);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Platinum': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Gold': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Silver': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Bronze': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading designers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Discover Designers</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredDesigners?.length} designers found
                </p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-white text-indigo-600 rounded-full px-2 py-0.5 text-xs font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, category, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  onFocus={() => suggestions?.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions?.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  {suggestions?.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (suggestion?.type === 'designer') {
                          navigate(`/designer-public-profile/${suggestion?.id}`);
                        } else {
                          setSearchQuery(suggestion?.text);
                          if (!selectedCategories?.includes(suggestion?.text)) {
                            setSelectedCategories([...selectedCategories, suggestion?.text]);
                          }
                        }
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      {suggestion?.type === 'designer' ? (
                        <Users className="h-4 w-4 text-gray-400" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700">{suggestion?.text}</span>
                      <span className="ml-auto text-xs text-gray-500 capitalize">
                        {suggestion?.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
              {[
                { value: 'relevance', label: 'Relevance', icon: TrendingUp },
                { value: 'popularity', label: 'Popularity', icon: Users },
                { value: 'tier', label: 'Tier Level', icon: Award },
                { value: 'activity', label: 'Recent Activity', icon: TrendingUp },
                { value: 'rating', label: 'Rating', icon: Star }
              ]?.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSortBy(value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    sortBy === value
                      ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } lg:block w-full lg:w-80 flex-shrink-0`}
          >
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Tier Level Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tier Level</h3>
                <div className="space-y-2">
                  {tierOptions?.map((tier) => (
                    <label key={tier} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTiers?.includes(tier)}
                        onChange={(e) => {
                          if (e?.target?.checked) {
                            setSelectedTiers([...selectedTiers, tier]);
                          } else {
                            setSelectedTiers(selectedTiers?.filter(t => t !== tier));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className={`px-2 py-1 rounded text-sm font-medium border ${getTierColor(tier)}`}>
                        {tier}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Design Specialties</h3>
                <div className="space-y-2">
                  {categoryOptions?.map((category) => (
                    <label key={category} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories?.includes(category)}
                        onChange={(e) => {
                          if (e?.target?.checked) {
                            setSelectedCategories([...selectedCategories, category]);
                          } else {
                            setSelectedCategories(selectedCategories?.filter(c => c !== category));
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Availability</h3>
                <div className="space-y-2">
                  {availabilityOptions?.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="availability"
                        checked={selectedAvailability === value}
                        onChange={() => setSelectedAvailability(value)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Follower Count Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Minimum Followers</h3>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(Number(e?.target?.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0</span>
                  <span className="font-medium text-indigo-600">{minFollowers?.toLocaleString()}</span>
                  <span>10k+</span>
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Minimum Rating</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5]?.map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                      className={`p-1 ${rating <= minRating ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Designer Grid */}
          <main className="flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {filteredDesigners?.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No designers found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search or filters to find more designers
                </p>
                <Button onClick={clearFilters} variant="primary">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredDesigners?.map((designer) => (
                  <div
                    key={designer?.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Designer Card Header */}
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={designer?.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(designer?.username || 'User')}&background=6366f1&color=fff`}
                          alt={`${designer?.username}'s avatar`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {designer?.username}
                          </h3>
                          {designer?.full_name && designer?.username && (
                            <p className="text-sm text-gray-600 truncate">{designer?.full_name}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getTierColor(designer?.tier_level)}`}>
                              {designer?.tier_level}
                            </span>
                            {designer?.badges && designer?.badges?.length > 0 && (
                              <Award className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {designer?.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                          {designer?.bio}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{(designer?.followers_count || 0)?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{designer?.design_count} designs</span>
                        </div>
                        {designer?.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{designer?.rating?.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Specialties */}
                      {designer?.specialties && designer?.specialties?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {designer?.specialties?.slice(0, 3)?.map((specialty, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                            >
                              {specialty}
                            </span>
                          ))}
                          {designer?.specialties?.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{designer?.specialties?.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Featured Designs Preview */}
                      {designer?.featured_designs && designer?.featured_designs?.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {designer?.featured_designs?.map((design) => (
                            <div
                              key={design?.id}
                              className="aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
                              onClick={() => navigate(`/design-details/${design?.id}`)}
                            >
                              <img
                                src={design?.image_url || '/assets/images/no_image.png'}
                                alt={design?.title || 'Design preview'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => navigate(`/designer-public-profile/${designer?.id}`)}
                          variant="primary"
                          className="flex-1"
                        >
                          View Profile
                        </Button>
                        <Button
                          onClick={() => handleFollowToggle(designer?.id)}
                          variant="secondary"
                          className="px-4"
                        >
                          Follow
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DesignerSearchDiscovery;