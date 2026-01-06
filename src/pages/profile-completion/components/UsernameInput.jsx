import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import profileService from '../../../services/profileService';

export function UsernameInput({ value, onChange, error, setError }) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);

  useEffect(() => {
    // Don't check if empty or less than 3 characters
    if (!value || value?.length < 3) {
      setAvailable(null);
      setError('');
      return;
    }

    const timeout = setTimeout(async () => {
      setChecking(true);
      try {
        const result = await profileService?.checkUsernameAvailability(value);
        setAvailable(result?.available);
        if (result && !result?.available) {
          setError(result?.message || 'Username is already taken');
        } else {
          setError('');
        }
      } catch (err) {
        console.error('Availability check failed:', err);
        // We don't set a hard error here to prevent blocking the user if the API is just slow
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [value, setError]);

  const getStatusIcon = () => {
    if (checking) return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    if (available === true) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (available === false) return <XCircle className="w-5 h-5 text-red-500" />;
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
          value={value || ''}
          onChange={(e) => onChange(e?.target?.value)}
          className={`block w-full px-4 py-3 border ${
            error ? 'border-red-300' : available ? 'border-green-300' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          placeholder="Choose a unique username"
          minLength={3}
          maxLength={30}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getStatusIcon()}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {available && !error && (
        <p className="text-sm text-green-600">Username is available!</p>
      )}
    </div>
  );
}