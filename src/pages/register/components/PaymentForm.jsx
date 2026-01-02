import React, { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';

/**
 * DEPRECATED: This component is no longer used in the registration flow.
 * 
 * The registration now uses Stripe Checkout Sessions (redirect-based) instead of 
 * Payment Intents (embedded form). This component was designed for Payment Intents
 * and required a clientSecret that is never provided in the new flow.
 * 
 * NEW FLOW:
 * 1. User fills registration form
 * 2. User proceeds to payment summary
 * 3. User clicks "Proceed to Payment"
 * 4. Redirects to Stripe Checkout (hosted page)
 * 5. After payment, Stripe redirects back to success page
 * 6. Success page completes account creation
 * 
 * This file is kept for reference but should not be imported or used.
 */

const PaymentForm = () => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const membershipPaymentService = {
    createMembershipCheckout: async (params) => {
      throw new Error('membershipPaymentService is not available - this component is deprecated');
    }
  };

  const handleStripeCheckout = async () => {
    try {
      setIsProcessing(true);
      setError('');

      console.log('💳 Creating Stripe checkout session with temporary data:', {
        priceId: import.meta.env?.VITE_STRIPE_MEMBERSHIP_PRICE_ID,
        email: formData?.email,
        username: formData?.username
      });

      // Create checkout session with registration data in metadata
      const { url } = await membershipPaymentService?.createMembershipCheckout({
        userId: null, // Guest checkout - no user account yet
        priceId: import.meta.env?.VITE_STRIPE_MEMBERSHIP_PRICE_ID,
        email: formData?.email,
        metadata: {
          username: formData?.username,
          password: formData?.password,
          fullName: formData?.fullName || '',
          phone: formData?.phone || '',
          registrationDate: new Date()?.toISOString()
        }
      });

      console.log('✅ Redirecting to Stripe Checkout:', url);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('❌ Checkout creation error:', error);
      
      setError(
        error?.message || 
        'Unable to process payment. Please check your internet connection and try again.'
      );
      
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <Icon name="AlertTriangle" className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm font-medium text-yellow-900 mb-1">
            Component Deprecated
          </p>
          <p className="text-sm text-yellow-800">
            This payment form component is no longer used. The registration flow now uses 
            Stripe Checkout Sessions (redirect-based) instead of embedded payment forms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;