import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { preOrderService } from '../../../services/preOrderService';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY);

const PreOrderCheckoutModal = ({ 
  designId, 
  designTitle, 
  size, 
  quantity, 
  amount, 
  tier1Price,
  onSuccess, 
  onCancel 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('details'); // 'details' | 'processing' | 'success'
  
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  useEffect(() => {
    // Load user's default shipping address if available
    loadUserDetails();
  }, []);

  const loadUserDetails = async () => {
    try {
      const userDetails = await preOrderService?.getUserShippingDetails();
      if (userDetails) {
        setShippingDetails(prev => ({
          ...prev,
          ...userDetails
        }));
      }
    } catch (err) {
      console.error('Error loading user details:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setShippingDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateDetails = () => {
    const required = ['fullName', 'email', 'address', 'city', 'state', 'zipCode'];
    const missing = required?.filter(field => !shippingDetails?.[field]?.trim());
    
    if (missing?.length > 0) {
      setError(`Please fill in: ${missing?.join(', ')}`);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex?.test(shippingDetails?.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    setError('');
    
    if (!validateDetails()) return;

    try {
      setLoading(true);
      setStep('processing');

      // Create Stripe Checkout Session
      const { sessionUrl, sessionId, error: checkoutError } = await preOrderService?.createCheckoutSession({
        designId,
        designTitle,
        size,
        quantity,
        amount,
        tier1Price,
        shippingDetails
      });

      if (checkoutError) {
        throw new Error(checkoutError);
      }

      // Redirect to Stripe Checkout
      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error processing checkout:', err);
      setError(err?.message || 'Failed to process checkout. Please try again.');
      setStep('details');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Pre-Order Checkout</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {designTitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Icon name="Package" size={18} />
              Order Summary
            </h3>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium">{size}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-medium">{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span>Price per item (Tier 1):</span>
                <span className="font-medium">${tier1Price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-300 text-base font-bold">
                <span>Total:</span>
                <span>${amount?.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-blue-700 pt-2 border-t border-blue-200">
              <Icon name="Info" size={12} className="inline mr-1" />
              You'll be charged ${amount?.toFixed(2)} now. Price may drop as more people pre-order!
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Shipping Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={shippingDetails?.fullName}
                  onChange={(e) => handleInputChange('fullName', e?.target?.value)}
                  placeholder="John Doe"
                  disabled={loading}
                />
                <Input
                  label="Email *"
                  type="email"
                  value={shippingDetails?.email}
                  onChange={(e) => handleInputChange('email', e?.target?.value)}
                  placeholder="john@example.com"
                  disabled={loading}
                />
              </div>

              <Input
                label="Phone"
                type="tel"
                value={shippingDetails?.phone}
                onChange={(e) => handleInputChange('phone', e?.target?.value)}
                placeholder="+1 (555) 123-4567"
                disabled={loading}
              />

              <Input
                label="Address *"
                value={shippingDetails?.address}
                onChange={(e) => handleInputChange('address', e?.target?.value)}
                placeholder="123 Main Street, Apt 4B"
                disabled={loading}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City *"
                  value={shippingDetails?.city}
                  onChange={(e) => handleInputChange('city', e?.target?.value)}
                  placeholder="New York"
                  disabled={loading}
                />
                <Input
                  label="State *"
                  value={shippingDetails?.state}
                  onChange={(e) => handleInputChange('state', e?.target?.value)}
                  placeholder="NY"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ZIP Code *"
                  value={shippingDetails?.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e?.target?.value)}
                  placeholder="10001"
                  disabled={loading}
                />
                <Select
                  label="Country *"
                  value={shippingDetails?.country}
                  onChange={(e) => handleInputChange('country', e?.target?.value)}
                  disabled={loading}
                  options={[
                    { value: 'US', label: 'United States' },
                    { value: 'CA', label: 'Canada' },
                    { value: 'UK', label: 'United Kingdom' },
                    { value: 'AU', label: 'Australia' }
                  ]}
                />
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Redirecting to Stripe Checkout...
              </h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we prepare your secure checkout session.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'details' && (
          <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Icon name="Loader" size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Icon name="CreditCard" size={18} />
                  Continue to Payment
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreOrderCheckoutModal;