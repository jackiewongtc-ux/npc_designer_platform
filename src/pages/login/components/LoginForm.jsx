import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import profileService from '../../../services/profileService';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export function LoginForm() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Log the user in
      await signIn(email, password);
      
      // 2. Check their profile status immediately
      const profile = await profileService?.getCurrentProfile();

      // 3. DECISION: Where should they go?
      // If they are missing their Instagram handle, send them to the completion page.
      if (!profile?.igHandle) {
        navigate('/profile-completion');
      } else {
        // If they are fully finished, go to the dashboard.
        navigate('/member-hub-dashboard');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e?.target?.value)}
            required
            className="w-full"
          />
        </div>

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e?.target?.value)}
            required
            className="w-full"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      {/* Demo Credentials Display */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm font-semibold text-gray-700 mb-3">Demo Credentials:</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Admin:</span>
            <code className="bg-white px-2 py-1 rounded text-xs">admin@npc.com / admin123</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Designer:</span>
            <code className="bg-white px-2 py-1 rounded text-xs">designer@npc.com / designer123</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Member:</span>
            <code className="bg-white px-2 py-1 rounded text-xs">member@npc.com / member123</code>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}