import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import Home from './pages/home';
import MemberHubDashboard from './pages/member-hub-dashboard';
import Login from './pages/login';
import CommunityChallengeBoard from './pages/community-challenge-board';
import DesignDetails from './pages/design-details';
import AdminChallengeManagement from './pages/admin-challenge-management';
import Register from './pages/register';
import ProfileCompletion from './pages/profile-completion';
import DesignUploadStudio from 'pages/design-upload-studio';
import DesignerPublicProfile from "./pages/designer-public-profile";
import DesignerSearchDiscovery from "pages/designer-search-discovery";
import CuratedDesignFeed from "./pages/curated-design-feed";
import AdminChallengeModerationCenter from "./pages/admin-challenge-moderation-center";
import Discover from "./pages/discover";
import Challenges from "./pages/challenges";
import Blog from "./pages/blog";
import PreOrderSuccess from 'pages/preorder-success';
import { Header } from "./components/Header";
import AdminDesignPricingConfiguration from './pages/admin-design-pricing-configuration';
import DesignerHubDashboard from "./pages/designer-hub-dashboard";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Header />
        <div className="pt-20">
          <RouterRoutes>
            <Route path="/" element={<Home />} />
            <Route path="/member-hub-dashboard" element={<MemberHubDashboard />} />
            <Route path="/profile-completion" element={<ProfileCompletion />} />
            <Route path="/login" element={<Login />} />
            <Route path="/curated-design-feed" element={<CuratedDesignFeed />} />
            <Route path="/designer-hub-dashboard" element={<DesignerHubDashboard />} />
            <Route path="/community-challenge-board" element={<CommunityChallengeBoard />} />
            <Route path="/design-details/:id" element={<DesignDetails />} />
            <Route path="/design-details" element={<DesignDetails />} />
            <Route path="/admin-challenge-management" element={<AdminChallengeManagement />} />
            <Route path="/admin-challenge-moderation-center" element={<AdminChallengeModerationCenter />} />
            <Route path="/design-upload-studio" element={<DesignUploadStudio />} />
            <Route path="/register" element={<Register />} />
            <Route path="/designer-public-profile/:id" element={<DesignerPublicProfile />} />
            <Route path="/designer-search-discovery" element={<DesignerSearchDiscovery />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/preorder-success" element={<PreOrderSuccess />} />
            <Route path="/admin/designs/:id/pricing" element={<AdminDesignPricingConfiguration />} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}