import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Header from './components/Header';

// 1. Import Public Pages
import Home from './pages/home/index';
import Login from './pages/login/index';
import Register from './pages/register/index';
import PreorderSuccess from './pages/preorder-success/index';
import ProfileCompletion from './pages/profile-completion/index';
import Blog from './pages/blog/index';

// 2. Import Member/Designer Pages
import MemberDashboard from './pages/member-hub-dashboard/index';
import DesignerDashboard from './pages/designer-hub-dashboard/index';
import DesignUploadStudio from './pages/design-upload-studio/index';
import DesignDetails from './pages/design-details/index';
import CuratedDesignFeed from './pages/curated-design-feed/index';
import DesignerPublicProfile from './pages/designer-public-profile/index';
import DesignerSearchDiscovery from './pages/designer-search-discovery/index';
import CommunityChallengeBoard from './pages/community-challenge-board/index';
import Challenges from './pages/challenges/index';
import Discover from './pages/discover/index';

// 3. Import Admin Pages
import AdminChallengeManagement from './pages/admin-challenge-management/index';
import AdminChallengeModeration from './pages/admin-challenge-moderation-center/index';
import AdminPricingConfig from './pages/admin-design-pricing-configuration/index';

// Layout wrapper to include the Header
const AppLayout = () => (
  <div className="min-h-screen bg-slate-900 text-white">
    <Header />
    <main>
      <Outlet />
    </main>
  </div>
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES (No Header) --- */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/preorder-success" element={<PreorderSuccess />} />
      <Route path="/profile-completion" element={<ProfileCompletion />} />

      {/* --- PROTECTED/APP ROUTES (With Header) --- */}
      <Route element={<AppLayout />}>
        {/* General */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/challenges" element={<Challenges />} />
        
        {/* Dashboards */}
        <Route path="/member-hub-dashboard" element={<MemberDashboard />} />
        <Route path="/designer-hub-dashboard" element={<DesignerDashboard />} />
        
        {/* Design Tools */}
        <Route path="/design-upload-studio" element={<DesignUploadStudio />} />
        <Route path="/design-details/:id" element={<DesignDetails />} />
        <Route path="/curated-design-feed" element={<CuratedDesignFeed />} />
        <Route path="/community-challenge-board" element={<CommunityChallengeBoard />} />
        
        {/* Search & Profiles */}
        <Route path="/designer-public-profile/:id" element={<DesignerPublicProfile />} />
        <Route path="/designer-search-discovery" element={<DesignerSearchDiscovery />} />

        {/* Admin Sections */}
        <Route path="/admin-challenge-management" element={<AdminChallengeManagement />} />
        <Route path="/admin-challenge-moderation" element={<AdminChallengeModeration />} />
        <Route path="/admin-design-pricing-configuration" element={<AdminPricingConfig />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}