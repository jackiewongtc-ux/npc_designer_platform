import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const StripeContext = createContext({
  stripePromise: null,
  stripeOptions: {},
  isLoading: false,
  error: null,
  isStripeConfigured: false
});

export const StripeProvider = ({ children }) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initializeStripe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if environment variable exists
        const publishableKey = import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY;
        
        if (!publishableKey) {
          console.warn('⚠️ Stripe publishable key is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in your .env file to enable Stripe functionality.');
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // Validate the key format
        if (!publishableKey?.startsWith('pk_')) {
          console.error('❌ Invalid Stripe publishable key format. Key should start with "pk_"');
          if (isMounted) {
            setError('Invalid Stripe configuration');
            setIsLoading(false);
          }
          return;
        }

        // Load Stripe
        const stripe = await loadStripe(publishableKey);
        
        if (isMounted) {
          if (stripe) {
            setStripePromise(stripe);
            console.log('✅ Stripe initialized successfully');
          } else {
            console.error('❌ Failed to initialize Stripe - loadStripe returned null');
            setError('Failed to load Stripe');
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('❌ Error initializing Stripe:', err);
        if (isMounted) {
          setError(err?.message || 'Failed to initialize Stripe');
          setIsLoading(false);
        }
      }
    };

    initializeStripe();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const stripeOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0F172A',
        colorBackground: '#ffffff',
        colorText: '#1e293b',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      }
    }
  };

  const contextValue = {
    stripePromise,
    stripeOptions,
    isLoading,
    error,
    isStripeConfigured: !!stripePromise
  };

  return (
    <StripeContext.Provider value={contextValue}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  
  return context;
};

// Safe hook that doesn't throw if used outside provider (useful for optional Stripe features)
export const useStripeContextSafe = () => {
  const context = useContext(StripeContext);
  return context || {
    stripePromise: null,
    stripeOptions: {},
    isLoading: false,
    error: null,
    isStripeConfigured: false
  };
};