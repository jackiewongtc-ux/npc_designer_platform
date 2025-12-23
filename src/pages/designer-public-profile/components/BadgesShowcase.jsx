import React from 'react';
import { Award, Lock } from 'lucide-react';

export function BadgesShowcase({ badges, achievements }) {
  const allBadges = [
    { id: 'first_design', name: 'First Steps', description: 'Submitted first design', icon: '🎨' },
    { id: 'popular_vote', name: 'Crowd Favorite', description: 'Design reached 100 votes', icon: '❤️' },
    { id: 'production_winner', name: 'Producer', description: 'Design went to production', icon: '🏭' },
    { id: 'streak_master', name: 'Consistent Creator', description: '10 designs in a row', icon: '🔥' },
    { id: 'community_champion', name: 'Community Champion', description: '1000 total votes', icon: '🏆' },
    { id: 'trendsetter', name: 'Trendsetter', description: 'Multiple trending designs', icon: '⭐' }
  ];

  const earnedBadgeIds = badges || [];
  const earnedAchievements = achievements || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-900">Earned Badges</h2>
      </div>
      {earnedBadgeIds?.length === 0 && earnedAchievements?.length === 0 ? (
        <div className="text-center py-8">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No badges earned yet</p>
          <p className="text-sm text-gray-500 mt-1">Keep designing to unlock achievements!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {allBadges?.map(badge => {
            const isEarned = earnedBadgeIds?.includes(badge?.id) || earnedAchievements?.includes(badge?.id);
            
            return (
              <div
                key={badge?.id}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  isEarned
                    ? 'border-yellow-400 bg-yellow-50' :'border-gray-200 bg-gray-50 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{badge?.icon}</div>
                <h3 className={`font-bold text-sm mb-1 ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}>
                  {badge?.name}
                </h3>
                <p className={`text-xs ${isEarned ? 'text-gray-600' : 'text-gray-400'}`}>
                  {badge?.description}
                </p>
                {!isEarned && (
                  <Lock className="w-4 h-4 text-gray-400 mx-auto mt-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}