import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './Routes';

function App() {
  return (
    // 1. Router MUST be the outermost wrapper
    <Router>
      {/* 2. AuthProvider MUST be inside the Router */}
      <AuthProvider>
        {/* 3. AppRoutes MUST be inside both */}
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;