import React, { useState, useEffect } from 'react';
import { 
  useStripe, 
  useElements, 
  PaymentElement,
  Elements 
} from '@stripe/react-stripe-js';
import { useStripeContext } from '../../../contexts/StripeContext';
import { membershipPaymentService } from '../../../services/membershipPayment';
import Button from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';

// Inner form component that uses Stripe hooks
const PaymentFormInner = ({
  clientSecret,
  amount,
  currency = 'SGD',
  membershipData,
  userInfo,
  onSuccess,
  onError,
  className = ''
}) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentReady, setPaymentReady] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Reset error when clientSecret changes
  useEffect(() => {
    setErrorMessage('');
    setPaymentReady(false);
  }, [clientSecret]);

  // Check if payment element is ready
  useEffect(() => {
    if (elements) {
      const paymentElement = elements?.getElement(PaymentElement);
      if (paymentElement) {
        paymentElement?.on('ready', () => {
          setPaymentReady(true);
        });
      }
    }
  }, [elements]);

  const handleSubmit = async (event) => {
    event?.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setErrorMessage('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe?.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location?.origin}/register-success`,
        },
        redirect: 'if_required'
      });

      if (stripeError) {
        setErrorMessage(stripeError?.message || 'Payment failed. Please try again.');
        onError?.(stripeError);
      } else if (paymentIntent && paymentIntent?.status === 'succeeded') {
        // Payment succeeded - confirm on backend
        const { data, error } = await membershipPaymentService?.confirmMembershipPayment(
          paymentIntent?.id
        );
        
        const successResult = {
          paymentIntent,
          membershipData: data,
          warning: error ? 'Payment processed but confirmation may be pending.' : undefined
        };

        // Show success animation
        setShowSuccessAnimation(true);

        // After animation, call onSuccess
        setTimeout(() => {
          setShowSuccessAnimation(false);
          onSuccess?.(successResult);
        }, 2500);
      } else if (paymentIntent?.status === 'requires_action') {
        setErrorMessage('Additional authentication required. Please complete the verification.');
      } else {
        setErrorMessage('Payment processing incomplete. Please try again.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setErrorMessage(error?.message || 'An unexpected error occurred. Please try again.');
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (!stripe || !elements || !clientSecret) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Loading payment system...
        </p>
      </div>
    );
  }

  return (
    <div className={`relative bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Element */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Payment Details
            </label>
            <PaymentElement 
              options={{
                fields: {
                  billingDetails: 'auto'
                },
                layout: 'tabs'
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon name="AlertCircle" className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!paymentReady || isProcessing || !stripe || !elements}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center space-x-2">
              <Icon name="Loader2" className="animate-spin" size={20} />
              <span>Processing Payment...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <Icon name="CreditCard" size={20} />
              <span>Complete Payment - {membershipPaymentService?.formatAmount(amount, currency)}</span>
            </span>
          )}
        </Button>

        {/* Security Notice */}
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
          <Icon name="Shield" size={14} />
          <span>Secured by Stripe • Your payment information is encrypted</span>
        </div>
      </form>
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
          <div className="text-center space-y-6 p-8">
            {/* Animated Success Icon */}
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <Icon name="Check" size={32} className="text-white" />
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-green-600">
                Payment Successful! 🎉
              </h3>
              <p className="text-green-700 font-medium">
                Welcome to NPC Community
              </p>
            </div>

            {/* Loading Dots */}
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component that provides Elements context
const PaymentForm = (props) => {
  const { stripePromise, stripeOptions } = useStripeContext();

  if (!props?.clientSecret) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-center text-gray-500">
          Preparing payment system...
        </p>
      </div>
    );
  }

  // Elements options with client secret
  const elementsOptions = {
    clientSecret: props?.clientSecret,
    ...stripeOptions,
    defaultValues: props?.userInfo ? {
      billingDetails: {
        name: props?.userInfo?.username || '',
        email: props?.userInfo?.email || '',
      }
    } : undefined
  };

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PaymentFormInner {...props} />
    </Elements>
  );
};

export default PaymentForm;