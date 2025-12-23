import React from 'react';
import { Sparkles, Heart, TrendingUp } from 'lucide-react';

export default function RecommendationCard({ design, onClick }) {
  const imageUrl = design?.imageUrls?.[0] || '/assets/images/no_image.png';
  const imageAlt = design?.title ? `${design?.title} design preview` : 'Recommended design preview';

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group border-2 border-indigo-100"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Recommendation Badge */}
        <div className="absolute top-3 left-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>For You</span>
        </div>

        {/* Votes Badge */}
        {design?.votesCount > 0 && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-lg">
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span className="text-xs font-semibold text-gray-900">{design?.votesCount}</span>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-2 text-white text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">View Details</span>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {design?.title || 'Untitled Design'}
        </h3>

        {/* Recommendation Reason */}
        {design?.recommendationReason && (
          <div className="mb-3 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-700 font-medium">
              {design?.recommendationReason}
            </p>
          </div>
        )}

        {design?.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {design?.description}
          </p>
        )}

        {/* Designer Info */}
        {design?.designer && (
          <div className="flex items-center gap-2 pt-3 border-t border-indigo-100">
            <img
              src={design?.designer?.profilePic || '/assets/images/no_image.png'}
              alt={`${design?.designer?.username} profile`}
              className="w-7 h-7 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {design?.designer?.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {design?.designer?.userTier?.replace('_', ' ') || 'Designer'}
              </p>
            </div>
          </div>
        )}

        {/* Category Badge */}
        {design?.category && (
          <div className="mt-3">
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full capitalize">
              {design?.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}