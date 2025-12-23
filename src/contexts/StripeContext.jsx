import React, { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const StripeContext = createContext();

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY);

export const StripeProvider = ({ children }) => {
  const stripeOptions = {
    // Global Stripe appearance options
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

  return (
    <StripeContext.Provider value={{ stripePromise, stripeOptions }}>
      {children}
    </StripeContext.Provider>
  );
};

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
};