import React from 'react';
import { TrendingUp, Heart, Eye } from 'lucide-react';

export default function TrendingDesignCard({ design, isMember, onClick }) {
  const imageUrl = design?.imageUrls?.[0] || '/assets/images/no_image.png';
  const imageAlt = design?.title ? `${design?.title} design preview` : 'Design preview';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Trending Badge */}
        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Trending</span>
        </div>

        {/* Member Exclusive Badge */}
        {!isMember && design?.votesCount > 50 && (
          <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            ⭐ Member Preview
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">{design?.votesCount || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span className="text-sm">View</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {design?.title || 'Untitled Design'}
        </h3>
        
        {design?.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {design?.description}
          </p>
        )}

        {/* Designer Info */}
        {design?.designer && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <img
              src={design?.designer?.profilePic || '/assets/images/no_image.png'}
              alt={`${design?.designer?.username} profile`}
              className="w-8 h-8 rounded-full object-cover"
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
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full capitalize">
              {design?.category}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}