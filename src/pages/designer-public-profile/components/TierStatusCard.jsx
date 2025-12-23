import React from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';

export function TierStatusCard({ profile }) {
  const tierInfo = {
    newcomer: { color: 'gray', label: 'Newcomer', expNeeded: 1000 },
    creator: { color: 'blue', label: 'Creator', expNeeded: 2500 },
    rising_star: { color: 'indigo', label: 'Rising Star', expNeeded: 5000 },
    established_designer: { color: 'purple', label: 'Established Designer', expNeeded: 10000 },
    top_designer: { color: 'pink', label: 'Top Designer', expNeeded: 25000 }
  };

  const currentTier = tierInfo?.[profile?.userTier] || tierInfo?.newcomer;
  const expProgress = ((profile?.userExp || 0) / currentTier?.expNeeded) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-900">Tier Status</h2>
      </div>
      {/* Tier Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-3 px-4 py-3 bg-${currentTier?.color}-100 rounded-lg flex-1`}>
          <Star className={`w-8 h-8 text-${currentTier?.color}-600`} />
          <div>
            <p className={`text-lg font-bold text-${currentTier?.color}-900`}>
              {currentTier?.label}
            </p>
            <p className="text-sm text-gray-600">Current Tier</p>
          </div>
        </div>
      </div>
      {/* EXP Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Experience Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {profile?.userExp || 0} / {currentTier?.expNeeded} EXP
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`bg-${currentTier?.color}-600 h-3 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(expProgress, 100)}%` }}
          />
        </div>
      </div>
      {/* Next Level Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <TrendingUp className="w-4 h-4" />
        <span>
          {profile?.userExp >= currentTier?.expNeeded
            ? 'Max level reached!'
            : `${currentTier?.expNeeded - (profile?.userExp || 0)} EXP to next tier`}
        </span>
      </div>
    </div>
  );
}