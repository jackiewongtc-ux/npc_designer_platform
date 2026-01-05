import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/ui/Button';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase?.auth?.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase?.from('user_profiles')?.select('role')?.eq('id', data?.user?.id)?.single();

      if (profileError) throw profileError;

      if (profile?.role === 'admin') {
        navigate('/admin-challenge-management');
      } else if (profile?.role === 'designer') {
        navigate('/designer-hub-dashboard');
      } else {
        navigate('/member-hub-dashboard');
      }

    } catch (err) {
      console.error("Login attempt failed:", err);
      setError(err?.message || "Invalid login credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e?.target?.value)}
          className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          placeholder="email@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e?.target?.value)}
          className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          placeholder="••••••••"
          required
        />
      </div>
      <Button
        type="submit"
        fullWidth
        disabled={isSubmitting}
        variant="primary"
      >
        {isSubmitting ? 'Authenticating...' : 'Sign In'}
      </Button>
    </form>
  );
};