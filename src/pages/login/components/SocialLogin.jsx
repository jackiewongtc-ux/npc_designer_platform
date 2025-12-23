import React, { useState } from 'react';

import Icon from '../../../components/AppIcon';

const SocialLogin = () => {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: 'Chrome',
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'Facebook',
      bgColor: 'bg-[#1877F2] hover:bg-[#1877F2]/90',
      textColor: 'text-white',
      borderColor: 'border-[#1877F2]'
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: 'Apple',
      bgColor: 'bg-black hover:bg-gray-900',
      textColor: 'text-white',
      borderColor: 'border-black'
    }
  ];

  const handleSocialLogin = (providerId) => {
    setLoadingProvider(providerId);
    
    setTimeout(() => {
      console.log(`Authenticating with ${providerId}...`);
      setLoadingProvider(null);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-card text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {socialProviders?.map((provider) => (
          <button
            key={provider?.id}
            type="button"
            onClick={() => handleSocialLogin(provider?.id)}
            disabled={loadingProvider !== null}
            className={`
              flex items-center justify-center gap-3 px-4 py-3 rounded-lg
              border ${provider?.borderColor} ${provider?.bgColor} ${provider?.textColor}
              font-medium text-sm transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
            `}
          >
            {loadingProvider === provider?.id ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Icon name={provider?.icon} size={20} />
                <span>Continue with {provider?.name}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SocialLogin;