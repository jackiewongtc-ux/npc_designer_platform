import React from 'react';
import { Trophy, Clock, DollarSign, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FeaturedChallengeCard({ challenge, onClick }) {
  const imageUrl = challenge?.imageUrl || '/assets/images/no_image.png';
  const imageAlt = challenge?.imageAlt || `${challenge?.title} challenge banner`;

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepting_submissions':
        return 'bg-green-100 text-green-800';
      case 'voting':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'accepting_submissions':
        return 'Open for Submissions';
      case 'voting':
        return 'Voting Active';
      case 'completed':
        return 'Completed';
      default:
        return status?.replace('_', ' ') || 'Unknown';
    }
  };

  const getTimeRemaining = () => {
    if (!challenge?.deadline) return null;
    
    try {
      const deadline = new Date(challenge.deadline);
      const now = new Date();
      
      if (deadline < now) return 'Ended';
      
      return `${formatDistanceToNow(deadline, { addSuffix: false })} left`;
    } catch {
      return null;
    }
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      {/* Banner Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-yellow-400 to-orange-500">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Featured Badge */}
        <div className="absolute top-3 left-3 bg-yellow-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-lg">
          <Trophy className="w-3.5 h-3.5" />
          <span>FEATURED</span>
        </div>

        {/* Status Badge */}
        <div className={`absolute top-3 right-3 ${getStatusColor(challenge?.status)} px-3 py-1 rounded-full text-xs font-semibold shadow-lg`}>
          {getStatusText(challenge?.status)}
        </div>
      </div>
      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {challenge?.title || 'Untitled Challenge'}
        </h3>

        {challenge?.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {challenge?.description}
          </p>
        )}

        {/* Challenge Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Reward */}
          {challenge?.rewardAmount && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Reward</p>
                <p className="font-semibold text-gray-900">${challenge?.rewardAmount}</p>
              </div>
            </div>
          )}

          {/* Time Remaining */}
          {timeRemaining && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Ends In</p>
                <p className="font-semibold text-gray-900">{timeRemaining}</p>
              </div>
            </div>
          )}

          {/* Max Participants */}
          {challenge?.maxParticipants && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Max Spots</p>
                <p className="font-semibold text-gray-900">{challenge?.maxParticipants}</p>
              </div>
            </div>
          )}
        </div>

        {/* Creator Info */}
        {challenge?.creator && (
          <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
            <img
              src={challenge?.creator?.profilePic || '/assets/images/no_image.png'}
              alt={`${challenge?.creator?.username} profile`}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">Created by</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {challenge?.creator?.username}
              </p>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <button
          className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform group-hover:scale-105"
          onClick={(e) => {
            e?.stopPropagation();
            onClick();
          }}
        >
          {challenge?.status === 'accepting_submissions' ? 'Submit Design' : 'View Challenge'}
        </button>
      </div>
    </div>
  );
}