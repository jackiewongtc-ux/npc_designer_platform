import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const PreOrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams?.get('session_id');

  const [user] = useState({
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    isAdmin: false,
    tier: "Gold",
    exp: 2450,
    nextTierExp: 3000
  });

  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (sessionId) {
      // Simulate loading order details
      setTimeout(() => {
        setOrderDetails({
          orderNumber: `PRE-${new Date()?.getFullYear()}-${Math.random()?.toString(36)?.substr(2, 9)?.toUpperCase()}`,
          amount: 59.98,
          status: 'confirmed'
        });
        setLoading(false);
      }, 1500);
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const expProgress = Math.round(user?.exp / user?.nextTierExp * 100);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={user}
          notifications={3}
          expProgress={expProgress}
          currentTier={user?.tier}
        />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Icon name="AlertCircle" size={48} className="text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Session</h1>
            <p className="text-muted-foreground mb-8">
              No checkout session found. Please try again.
            </p>
            <Button onClick={() => navigate('/discover')}>
              Back to Discover
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={user}
          notifications={3}
          expProgress={expProgress}
          currentTier={user?.tier}
        />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-foreground">
              Confirming your pre-order...
            </h2>
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
        currentTier={user?.tier}
      />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          {/* Success Icon with Animation */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Icon name="Check" size={48} className="text-white" />
              </div>
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-green-300 rounded-full animate-ping opacity-30"></div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Pre-Order Confirmed! 🎉
          </h1>
          <p className="text-lg text-green-600 font-medium mb-8">
            Thank you for your pre-order!
          </p>

          {/* Order Details */}
          {orderDetails && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Icon name="Package" size={20} />
                Order Details
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Order Number:</span>
                  <span className="font-medium">{orderDetails?.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-medium">${orderDetails?.amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium capitalize">{orderDetails?.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Important Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              <Icon name="Info" size={20} />
              What Happens Next?
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li className="flex items-start gap-2">
                <Icon name="Check" size={16} className="mt-0.5 text-yellow-700" />
                <span>You've been charged the Tier 1 price for this pre-order</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="TrendingDown" size={16} className="mt-0.5 text-yellow-700" />
                <span>As more people pre-order, the price may drop to lower tiers</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="DollarSign" size={16} className="mt-0.5 text-yellow-700" />
                <span>If the price drops, you'll receive a refund for the difference</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Mail" size={16} className="mt-0.5 text-yellow-700" />
                <span>We'll email you updates about your pre-order status</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="Package" size={16} className="mt-0.5 text-yellow-700" />
                <span>Production begins when minimum pre-orders are reached</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/member-hub-dashboard')}
              iconName="User"
            >
              View My Dashboard
            </Button>
            <Button
              onClick={() => navigate('/discover')}
              iconName="Search"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PreOrderSuccess;