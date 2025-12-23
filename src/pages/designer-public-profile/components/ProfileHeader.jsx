import React from 'react';
import { User, Instagram } from 'lucide-react';
import Button from '../../../components/ui/Button';

export function ProfileHeader({ profile, stats, onFollowToggle, isFollowing }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {profile?.profilePic ? (
              <img
                src={profile?.profilePic}
                alt={`${profile?.username}'s profile`}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-16 h-16 text-gray-400" />
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile?.username || 'Designer'}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {profile?.userTier || 'newcomer'}
                </span>
                {profile?.igHandle && (
                  <a
                    href={`https://instagram.com/${profile?.igHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm hover:text-purple-600"
                  >
                    <Instagram className="w-4 h-4" />
                    @{profile?.igHandle}
                  </a>
                )}
              </div>
            </div>
            <Button
              onClick={onFollowToggle}
              variant={isFollowing ? 'outline' : 'primary'}
              className="mt-4 md:mt-0"
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>

          <p className="text-gray-700 mb-4">{profile?.bio || 'No bio available'}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats?.totalDesigns || 0}</p>
              <p className="text-sm text-gray-600">Designs</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats?.totalVotes || 0}</p>
              <p className="text-sm text-gray-600">Total Votes</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{profile?.followersCount || 0}</p>
              <p className="text-sm text-gray-600">Followers</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{stats?.completed || 0}</p>
              <p className="text-sm text-gray-600">Produced</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}