import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 1. Clean Imports (No curly braces for default exports)
import Login from './pages/login/index'; 
import AdminChallengeManagement from './pages/admin-challenge-management/index';
import MemberDashboard from './pages/member-hub-dashboard/index';
import ProfileCompletion from './pages/profile-completion/index';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route 
        path="/admin-challenge-management" 
        element={AdminChallengeManagement ? <AdminChallengeManagement /> : <div>Admin Page Missing</div>} 
      />

      <Route 
        path="/member-hub-dashboard" 
        element={MemberDashboard ? <MemberDashboard /> : <div>Dashboard Missing</div>} 
      />
      
      <Route 
        path="/profile-completion" 
        element={ProfileCompletion ? <ProfileCompletion /> : <div>Profile Page Missing</div>} 
      />

      {/* Global Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}