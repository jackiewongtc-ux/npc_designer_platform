import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';

/**
 * TierProgressTracker Component
 * Displays tiered pricing progress with real-time updates via Supabase subscription
 * Shows progress toward Tier 2 and Tier 3 with animated transitions
 * 
 * @param {Object} props
 * @param {string} props.designId - Design submission ID
 */
const TierProgressTracker = ({ designId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preorderCount, setPreorderCount] = useState(0);
  const [tierData, setTierData] = useState([]);
  const [currentTier, setCurrentTier] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [nextTierInfo, setNextTierInfo] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [animateTier, setAnimateTier] = useState(false);

  // Load initial data and set up real-time subscription
  useEffect(() => {
    if (!designId) return;

    loadTierProgress();

    // Subscribe to preorder changes for real-time updates
    const channel = supabase
      ?.channel(`tier_progress_${designId}`)
      ?.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pre_orders',
          filter: `design_id=eq.${designId}`
        },
        () => {
          loadTierProgress();
        }
      )
      ?.subscribe();

    return () => {
      channel?.unsubscribe();
    };
  }, [designId]);

  /**
   * Load tier progress data from database
   * Fetches preorder count and tiered pricing data
   */
  const loadTierProgress = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch design with tiered pricing data and current tier
      const { data: designData, error: designError } = await supabase
        ?.from('design_submissions')
        ?.select('tiered_pricing_data, current_active_tier')
        ?.eq('id', designId)
        ?.single();

      if (designError) throw designError;

      // Count preorders with 'charged' status
      const { count, error: countError } = await supabase
        ?.from('pre_orders')
        ?.select('*', { count: 'exact', head: true })
        ?.eq('design_id', designId)
        ?.eq('status', 'charged');

      if (countError) throw countError;

      const preorders = count || 0;
      setPreorderCount(preorders);

      if (designData?.tiered_pricing_data && Array.isArray(designData?.tiered_pricing_data)) {
        const tiers = designData?.tiered_pricing_data;
        setTierData(tiers);

        // Find current tier
        const current = tiers?.find(t => 
          preorders >= t?.range_low && preorders <= t?.range_high
        ) || tiers?.[0];

        // Trigger animation if tier changed
        if (current?.tier !== currentTier) {
          setAnimateTier(true);
          setTimeout(() => setAnimateTier(false), 1000);
        }

        setCurrentTier(current?.tier || 1);
        setCurrentPrice(current?.price || 0);

        // Calculate next tier info
        const nextTier = tiers?.find(t => t?.tier === (current?.tier || 1) + 1);
        if (nextTier) {
          const needed = nextTier?.range_low - preorders;
          setNextTierInfo({
            tier: nextTier?.tier,
            price: nextTier?.price,
            needed: needed > 0 ? needed : 0
          });
        } else {
          setNextTierInfo(null);
        }
      }
    } catch (err) {
      console.error('Error loading tier progress:', err);
      setError(err?.message || 'Failed to load tier progress');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate progress percentage for visual progress bar
   */
  const calculateProgress = () => {
    if (tierData?.length === 0 || !nextTierInfo) return 100;
    
    const currentTierData = tierData?.find(t => t?.tier === currentTier);
    if (!currentTierData) return 0;

    const tierRange = nextTierInfo?.needed + (preorderCount - currentTierData?.range_low);
    const progress = ((preorderCount - currentTierData?.range_low) / tierRange) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  };

  /**
   * Generate referral link for sharing
   */
  const generateReferralLink = () => {
    const baseUrl = window?.location?.origin;
    const path = `/design-details?id=${designId}`;
    return `${baseUrl}${path}&ref=share`;
  };

  /**
   * Handle copy referral link to clipboard
   */
  const handleCopyLink = async () => {
    try {
      const link = generateReferralLink();
      await navigator?.clipboard?.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  /**
   * Handle share to social media
   */
  const handleShare = (platform) => {
    const link = generateReferralLink();
    const text = `Check out this design! Help unlock lower prices by pre-ordering.`;
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
    };

    if (urls?.[platform]) {
      window?.open(urls?.[platform], '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Loading tier progress...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
          <Icon name="AlertCircle" size={16} />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (tierData?.length === 0) {
    return null; // Don't show if no tier data available
  }

  const progress = calculateProgress();

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icon name="TrendingDown" size={20} />
            Tier Pricing Progress
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            More preorders = Lower prices for everyone!
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          iconName="Share2"
          onClick={() => setShowShareModal(true)}
        >
          Share
        </Button>
      </div>

      {/* Current Tier Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 transition-all duration-500 ${animateTier ? 'scale-110 shadow-lg' : ''}`}>
        <Icon name="Award" size={18} className="text-primary" />
        <span className="font-semibold text-foreground">
          Current Tier {currentTier}
        </span>
        <span className="text-muted-foreground">•</span>
        <span className="font-bold text-primary">${currentPrice?.toFixed(2)}</span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="relative h-8 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 transition-all duration-700 ease-out flex items-center justify-end pr-3"
            style={{ width: `${progress}%` }}
          >
            {progress > 15 && (
              <span className="text-xs font-medium text-primary-foreground">
                {preorderCount} orders
              </span>
            )}
          </div>
          
          {/* Tier Markers */}
          {tierData?.map((tier, index) => {
            if (index === 0) return null; // Skip first tier
            const position = ((tier?.range_low / tierData?.[tierData?.length - 1]?.range_high) * 100);
            return (
              <div
                key={tier?.tier}
                className="absolute inset-y-0 flex items-center"
                style={{ left: `${position}%` }}
              >
                <div className="w-0.5 h-full bg-border" />
              </div>
            );
          })}
        </div>

        {/* Tier Labels */}
        <div className="flex justify-between items-center text-xs">
          {tierData?.map((tier) => (
            <div key={tier?.tier} className="flex flex-col items-center">
              <span className={`font-medium ${currentTier === tier?.tier ? 'text-primary' : 'text-muted-foreground'}`}>
                Tier {tier?.tier}
              </span>
              <span className="text-muted-foreground">${tier?.price?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Tier Info */}
      {nextTierInfo && nextTierInfo?.needed > 0 && (
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
          <div className="flex items-center gap-2 text-sm">
            <Icon name="Target" size={16} className="text-primary" />
            <span className="font-medium text-foreground">
              <span className="text-primary font-bold">{nextTierInfo?.needed}</span> more preorders needed to reach{' '}
              <span className="font-bold">Tier {nextTierInfo?.tier}</span> at{' '}
              <span className="text-primary font-bold">${nextTierInfo?.price?.toFixed(2)}</span>
            </span>
          </div>
        </div>
      )}

      {nextTierInfo && nextTierInfo?.needed === 0 && (
        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Icon name="CheckCircle" size={16} />
            <span className="font-medium">
              Congratulations! You've unlocked Tier {nextTierInfo?.tier} pricing!
            </span>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{preorderCount}</div>
          <div className="text-xs text-muted-foreground">Total Preorders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            ${(tierData?.[0]?.price - currentPrice)?.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">Savings Per Item</div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-foreground">Share This Design</h4>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={20} />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Help unlock lower prices by sharing with friends!
            </p>

            {/* Copy Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Referral Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generateReferralLink()}
                  readOnly
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground"
                />
                <Button
                  variant={copySuccess ? "default" : "outline"}
                  size="sm"
                  iconName={copySuccess ? "Check" : "Copy"}
                  onClick={handleCopyLink}
                >
                  {copySuccess ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Share on Social Media</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Twitter"
                  onClick={() => handleShare('twitter')}
                  className="flex-1"
                >
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Facebook"
                  onClick={() => handleShare('facebook')}
                  className="flex-1"
                >
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Linkedin"
                  onClick={() => handleShare('linkedin')}
                  className="flex-1"
                >
                  LinkedIn
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TierProgressTracker;