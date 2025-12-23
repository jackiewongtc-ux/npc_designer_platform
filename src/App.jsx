import React from "react";
import Routes from "./Routes";
import { AuthProvider } from './contexts/AuthContext';
import { StripeProvider } from './contexts/StripeContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StripeProvider>
          <Routes />
        </StripeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;