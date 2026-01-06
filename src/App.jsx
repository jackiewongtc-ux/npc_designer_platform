import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StripeProvider } from './contexts/StripeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import AppRoutes from './Routes';

const App = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <StripeProvider>
            <ScrollToTop />
            <AppRoutes />
          </StripeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;