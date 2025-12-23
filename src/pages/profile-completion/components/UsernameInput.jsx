import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { profileService } from '../../../services/profileService';

export function UsernameInput({ value, onChange, error, setError }) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [checkTimeout, setCheckTimeout] = useState(null);

  useEffect(() => {
    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    // Don't check if empty or less than 3 characters
    if (!value || value?.length < 3) {
      setAvailable(null);
      setError('');
      return;
    }

    // Debounce username checking
    const timeout = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await profileService?.checkUsernameAvailability(value);
        setAvailable(result?.available);
        if (!result?.available) {
          setError(result?.message);
        } else {
          setError('');
        }
      } catch (err) {
        setError('Error checking username availability');
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500);

    setCheckTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [value]);

  const getStatusIcon = () => {
    if (checking) {
      return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
    if (available === true) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (available === false) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
        Username *
      </label>
      <div className="relative">
        <input
          type="text"
          id="username"
          value={value}
          onChange={(e) => onChange(e?.target?.value)}
          className={`block w-full px-4 py-3 border ${
            error ? 'border-red-300' : available ? 'border-green-300' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          placeholder="Choose a unique username"
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_-]+"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getStatusIcon()}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {available && !error && (
        <p className="text-sm text-green-600">Username is available!</p>
      )}
      <p className="text-xs text-gray-500">
        3-30 characters, letters, numbers, underscores, and hyphens only
      </p>
    </div>
  );
}