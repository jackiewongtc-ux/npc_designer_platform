import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { Header } from '../../components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import ImageGallery from './components/ImageGallery';
import DesignerProfile from './components/DesignerProfile';
import DesignSpecifications from './components/DesignSpecifications';
import VotingInterface from './components/VotingInterface';
import VotingHistory from './components/VotingHistory';
import PreOrderSection from './components/PreOrderSection';
import DesignStatistics from './components/DesignStatistics';
import ProductionTimeline from './components/ProductionTimeline';
import CommunityModelApplication from './components/CommunityModelApplication';
import CommentSection from './components/CommentSection';
import RelatedDesigns from './components/RelatedDesigns';
import SocialSharing from './components/SocialSharing';
import TierProgressTracker from './components/TierProgressTracker';
import { designService } from '../../services/designService';

const DesignDetails = () => {
  const [searchParams] = useSearchParams();
  const { id: pathId } = useParams();
  const navigate = useNavigate();
  
  // FIX: Support both query params (?id=...) and path params (/:id)
  const designId = searchParams?.get('id') || pathId;

  const [user] = useState({
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    isAdmin: false,
    tier: "Gold",
    exp: 2450,
    nextTierExp: 3000
  });

  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Helper function to validate UUID format
  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex?.test(uuid);
  };

  // Load design data on mount and when designId changes
  useEffect(() => {
    // FIX: Validate UUID format before making database call
    if (designId && isValidUUID(designId)) {
      loadDesignData();
    } else if (designId) {
      setError('Invalid design ID format. Please check the URL.');
      setLoading(false);
    } else {
      setError('No design ID provided. Please select a design to view.');
      setLoading(false);
    }
  }, [designId]);

  // Subscribe to real-time design changes
  useEffect(() => {
    if (!designId || !isValidUUID(designId)) return;

    const channel = designService?.subscribeToDesignChanges(designId, () => {
      loadDesignData();
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [designId]);

  const loadDesignData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await designService?.getSubmission(designId);
      
      if (!data) {
        setError('Design not found. It may have been removed or the ID is incorrect.');
        return;
      }
      
      setDesign({
        id: data?.id,
        title: data?.title,
        description: data?.description,
        images: data?.imageUrls?.map((url, index) => ({
          url,
          alt: `Design image ${index + 1} for ${data?.title}`
        })) || [],
        designer: {
          id: data?.designerId,
          name: "Elena Rodriguez",
          avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_181351f08-1763301008733.png",
          avatarAlt: "Professional headshot of Hispanic female designer with long brown hair wearing black turtleneck in studio lighting",
          tier: "Platinum",
          totalDesigns: 47,
          followers: 3420,
          bio: "Sustainable fashion designer with 10+ years of experience. Passionate about creating eco-friendly apparel that doesn't compromise on style or quality.",
          isFollowing: false
        },
        specifications: {
          materials: data?.materials ? data?.materials?.split(',')?.map(m => m?.trim()) : [],
          category: data?.category,
          productionType: "Made to Order",
          availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
          colors: ["Charcoal Gray", "Forest Green", "Navy Blue", "Black"],
          careInstructions: [
            "Machine wash cold with like colors",
            "Tumble dry low or hang to dry",
            "Do not bleach",
            "Iron on low heat if needed",
            "Do not dry clean"
          ]
        },
        voting: {
          totalVotes: data?.votesCount || 0,
          userVote: null,
          votingEndDate: data?.votingStartedAt ? 
            new Date(new Date(data?.votingStartedAt).getTime() + 30 * 24 * 60 * 60 * 1000)?.toISOString() 
            : null
        },
        statistics: {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          preOrders: 0,
          ranking: 0,
          createdDate: data?.createdAt
        },
        status: data?.submissionStatus,
        category: data?.category,
        votingStartedAt: data?.votingStartedAt
      });
    } catch (err) {
      console.error('Error loading design:', err);
      setError(err?.message || 'Failed to load design details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [designId]);

  const handleSaveDesign = () => {
    setIsSaved(!isSaved);
  };

  const handleBackToDiscover = () => {
    navigate('/community-challenge-board');
  };

  const expProgress = Math.round(user?.exp / user?.nextTierExp * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={user}
          notifications={3}
          expProgress={expProgress}
          currentTier={user?.tier}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-muted-foreground">Loading design details...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={user}
          notifications={3}
          expProgress={expProgress}
          currentTier={user?.tier}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-destructive/10 text-destructive px-6 py-4 rounded-md">
            <div className="flex items-center gap-2">
              <Icon name="AlertCircle" size={20} />
              <span>{error}</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={user}
          notifications={3}
          expProgress={expProgress}
          currentTier={user?.tier}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            Design not found
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        notifications={3}
        expProgress={expProgress}
        currentTier={user?.tier} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {design?.title}
                  </h1>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Icon name="Tag" size={14} />
                      {design?.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Calendar" size={14} />
                      {new Date(design?.statistics?.createdDate)?.toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={isSaved ? "default" : "outline"}
                    size="default"
                    iconName={isSaved ? "BookmarkCheck" : "Bookmark"}
                    onClick={handleSaveDesign}>

                    {isSaved ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
            </div>

            <ImageGallery images={design?.images} />

            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Icon name="FileText" size={20} />
                About This Design
              </h2>
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {design?.description}
              </p>
            </div>

            <TierProgressTracker designId={designId} />

            <DesignerProfile designer={design?.designer} />

            <DesignSpecifications specifications={design?.specifications} />

            <ProductionTimeline />

            <CommunityModelApplication designId={design?.id} />

            <CommentSection designId={design?.id} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <VotingInterface 
              designId={designId} 
              votingEndDate={design?.votingStartedAt ? 
                new Date(new Date(design?.votingStartedAt).getTime() + 30 * 24 * 60 * 60 * 1000)?.toISOString() 
                : null
              }
            />
            
            <VotingHistory designId={designId} />
            
            <PreOrderSection 
              designId={designId}
              designTitle={design?.title}
            />
            
            <DesignStatistics statistics={design?.statistics} />

            <SocialSharing
              designTitle={design?.title}
              designUrl={window.location?.href} />


            <RelatedDesigns
              currentDesignId={design?.id}
              category={design?.category} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DesignDetails;