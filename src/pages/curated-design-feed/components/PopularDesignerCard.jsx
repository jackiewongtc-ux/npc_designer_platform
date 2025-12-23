import React from 'react';
import { Users, Award, Briefcase } from 'lucide-react';

export default function PopularDesignerCard({ designer, onClick }) {
  const profilePic = designer?.profilePic || '/assets/images/no_image.png';
  const profileAlt = `${designer?.username} profile picture`;

  const getTierIcon = (tier) => {
    const tierIcons = {
      legend: '👑',
      top_designer: '⭐',
      established_designer: '💎',
      rising_star: '🌟',
      creator: '✨',
      newcomer: '🎨'
    };
    return tierIcons?.[tier] || '🎨';
  };

  const getTierColor = (tier) => {
    const tierColors = {
      legend: 'from-yellow-400 to-orange-500',
      top_designer: 'from-purple-400 to-pink-500',
      established_designer: 'from-blue-400 to-indigo-500',
      rising_star: 'from-green-400 to-emerald-500',
      creator: 'from-cyan-400 to-blue-500',
      newcomer: 'from-gray-400 to-gray-500'
    };
    return tierColors?.[tier] || 'from-gray-400 to-gray-500';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      {/* Header with Tier Badge */}
      <div className={`relative h-24 bg-gradient-to-r ${getTierColor(designer?.userTier)}`}>
        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
          <span className="text-white text-xs font-bold">
            {getTierIcon(designer?.userTier)}
          </span>
          <span className="text-white text-xs font-semibold capitalize">
            {designer?.userTier?.replace('_', ' ') || 'Designer'}
          </span>
        </div>
      </div>
      {/* Profile Section */}
      <div className="relative px-6 pb-6">
        {/* Profile Picture */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <img
              src={profilePic}
              alt={profileAlt}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <Award className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-14 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
            {designer?.username || 'Unknown Designer'}
          </h3>

          {designer?.bio && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {designer?.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mb-4">
            {/* Followers */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-bold text-gray-900">
                  {designer?.followersCount?.toLocaleString() || 0}
                </span>
              </div>
              <p className="text-xs text-gray-500">Followers</p>
            </div>

            {/* Designs */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="text-lg font-bold text-gray-900">
                  {designer?.designsCount || 0}
                </span>
              </div>
              <p className="text-xs text-gray-500">Designs</p>
            </div>
          </div>

          {/* Follow Button */}
          <button
            onClick={(e) => {
              e?.stopPropagation();
              onClick();
            }}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors transform group-hover:scale-105"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}