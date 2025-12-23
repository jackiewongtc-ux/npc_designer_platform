import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { preOrderService } from '../../../services/preOrderService';
import PreOrderCheckoutModal from './PreOrderCheckoutModal';

const PreOrderSection = ({ designId, designTitle = 'Design' }) => {
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [preOrderStats, setPreOrderStats] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [tierPricing, setTierPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    if (designId) {
      loadPreOrderStats();
      loadTierPricing();
    }
  }, [designId]);

  const loadTierPricing = async () => {
    try {
      setLoadingPricing(true);
      const pricing = await preOrderService?.getDesignTierPricing(designId);
      setTierPricing(pricing);
    } catch (err) {
      console.error('Error loading tier pricing:', err);
    } finally {
      setLoadingPricing(false);
    }
  };

  const loadPreOrderStats = async () => {
    try {
      const stats = await preOrderService?.getPreOrderStats(designId);
      setPreOrderStats(stats);
    } catch (err) {
      console.error('Error loading pre-order stats:', err);
    }
  };

  const getTier1Price = () => {
    if (!tierPricing?.tiers || tierPricing?.tiers?.length === 0) {
      return 29.99; // Default fallback
    }
    const tier1 = tierPricing?.tiers?.find(t => t?.tier === 1);
    return tier1?.price || 29.99;
  };

  const calculateTotal = () => {
    const basePrice = getTier1Price();
    return (basePrice * quantity)?.toFixed(2);
  };

  const handlePreOrderClick = () => {
    if (!selectedSize) {
      setError('Please select a size');
      return;
    }
    setError('');
    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = async () => {
    setShowCheckoutModal(false);
    setSuccess(true);
    setSelectedSize('');
    setQuantity(1);
    await loadPreOrderStats();

    setTimeout(() => {
      setSuccess(false);
    }, 5000);
  };

  const handleCheckoutCancel = () => {
    setShowCheckoutModal(false);
  };

  return (
    <>
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icon name="ShoppingBag" size={20} />
              Pre-Order Now
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Reserve your spot in production
            </p>
          </div>
          <div className="text-right">
            {loadingPricing ? (
              <div className="text-sm text-muted-foreground">Loading price...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">${getTier1Price()?.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Tier 1 price</div>
              </>
            )}
          </div>
        </div>

        {tierPricing?.currentTier && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <Icon name="Info" size={14} className="inline mr-1" />
              Current tier: <strong>Tier {tierPricing?.currentTier}</strong> at ${tierPricing?.currentPrice?.toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              You'll be charged ${getTier1Price()?.toFixed(2)} now. Price may drop!
            </p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm flex items-center gap-2">
            <Icon name="AlertCircle" size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-md text-sm flex items-center gap-2">
            <Icon name="CheckCircle" size={16} />
            Pre-order placed successfully!
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Size *
            </label>
            <div className="grid grid-cols-6 gap-2">
              {sizes?.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`
                    py-2 px-3 text-sm font-medium rounded-md border transition-colors
                    ${selectedSize === size
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-muted'
                    }
                  `}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-md border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="Minus" size={16} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e?.target?.value) || 1))}
                className="w-20 text-center py-2 px-3 rounded-md border border-border bg-background text-foreground"
                min="1"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-md border border-border flex items-center justify-center hover:bg-muted"
              >
                <Icon name="Plus" size={16} />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">${calculateTotal()}</span>
            </div>
            <Button
              onClick={handlePreOrderClick}
              disabled={loadingPricing || !selectedSize}
              className="w-full"
              size="lg"
            >
              <Icon name="ShoppingCart" size={18} />
              Pre-Order Now
            </Button>
          </div>
        </div>
        {preOrderStats && preOrderStats?.totalOrders > 0 && (
          <div className="pt-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pre-orders so far</span>
              <span className="font-medium text-foreground">{preOrderStats?.totalQuantity} items</span>
            </div>
            {preOrderStats?.sizeBreakdown && Object.keys(preOrderStats?.sizeBreakdown)?.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span>Popular sizes: </span>
                {Object.entries(preOrderStats?.sizeBreakdown)?.sort((a, b) => b?.[1] - a?.[1])?.slice(0, 3)?.map(([size, count], idx) => (
                    <span key={size}>
                      {idx > 0 && ', '}
                      {size} ({count})
                    </span>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCheckoutModal && (
        <PreOrderCheckoutModal
          designId={designId}
          designTitle={designTitle}
          size={selectedSize}
          quantity={quantity}
          amount={parseFloat(calculateTotal())}
          tier1Price={getTier1Price()}
          onSuccess={handleCheckoutSuccess}
          onCancel={handleCheckoutCancel}
        />
      )}
    </>
  );
};

export default PreOrderSection;