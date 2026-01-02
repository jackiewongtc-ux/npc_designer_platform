import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/ui/Button';
import MembershipSignupModal from './components/MembershipSignupModal';
import Header from '../../components/Header';

const Home = () => {
  const navigate = useNavigate();
  const [showSignupModal, setShowSignupModal] = useState(false);

  useEffect(() => {
    // Show the signup modal after a short delay when user first visits
    const hasSeenModal = sessionStorage.getItem('hasSeenSignupModal');
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setShowSignupModal(true);
        sessionStorage.setItem('hasSeenSignupModal', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full Screen Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/assets/images/Gemini_Generated_Image_naazh4naazh4naaz-1766461754132.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>

        {/* Overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      </div>
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation Bar */}
        <Header />

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Create. Vote. Produce.
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join the community-driven platform where designers create custom NPC miniatures and community votes decide what gets produced.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="primary"
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl w-full sm:w-auto"
                onClick={() => setShowSignupModal(true)}
                iconName="Gift"
                iconPosition="left">

                Get Your Welcome Bonus
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-white border-white/30 hover:bg-white/10 backdrop-blur-md w-full sm:w-auto"
                onClick={() => navigate('/community-challenge-board')}
                iconName="TrendingUp"
                iconPosition="left">

                Browse Designs
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="text-3xl font-bold text-white mb-2">15K+</div>
                <div className="text-sm text-white/80">Active Designers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="text-3xl font-bold text-white mb-2">8.5K</div>
                <div className="text-sm text-white/80">Designs Created</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
                <div className="text-3xl font-bold text-white mb-2">98%</div>
                <div className="text-sm text-white/80">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 px-6 text-center">
          <p className="text-white/70 text-sm">
            © {new Date()?.getFullYear()} NPC Designer Platform. All rights reserved.
          </p>
        </div>
      </div>
      {/* Membership Signup Modal */}
      <MembershipSignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)} />

    </div>);

};

export default Home;