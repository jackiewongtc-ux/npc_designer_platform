import React from 'react';
import { Sparkles, TrendingUp, Users, Award } from 'lucide-react';



export function ProfileBenefitsPanel({ completionPercentage }) {
  const benefits = [
    {
      icon: Sparkles,
      title: 'Personalized Recommendations',
      description: 'Get design suggestions tailored to your style and measurements',
      unlocked: completionPercentage >= 25
    },
    {
      icon: TrendingUp,
      title: 'Size Advisor Accuracy',
      description: 'Improved fit recommendations based on your body measurements',
      unlocked: completionPercentage >= 50
    },
    {
      icon: Users,
      title: 'Community Discovery',
      description: 'Connect with members through Instagram and shared interests',
      unlocked: completionPercentage >= 75
    },
    {
      icon: Award,
      title: 'Full Platform Access',
      description: 'Unlock voting, challenges, and exclusive designer features',
      unlocked: completionPercentage >= 100
    }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Profile Benefits</h3>
          <span className="text-sm font-medium text-purple-600">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
      <div className="space-y-4">
        {benefits?.map((benefit, index) => {
          const BenefitIcon = benefit?.icon;
          return (
            <div 
              key={index}
              className={`flex gap-3 p-3 rounded-lg transition-all ${
                benefit?.unlocked 
                  ? 'bg-white border-2 border-purple-300' :'bg-gray-50 border border-gray-200 opacity-60'
              }`}
            >
              <div className={`flex-shrink-0 ${
                benefit?.unlocked ? 'text-purple-600' : 'text-gray-400'
              }`}>
                <BenefitIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">{benefit?.title}</h4>
                  {benefit?.unlocked && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Unlocked
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{benefit?.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 p-4 bg-white rounded-lg border border-purple-200">
        <p className="text-xs text-gray-600">
          <strong className="text-purple-600">Pro Tip:</strong> Complete your profile to maximize your NPC Designer experience. Members with complete profiles get 3x more engagement!
        </p>
      </div>
    </div>
  );
}