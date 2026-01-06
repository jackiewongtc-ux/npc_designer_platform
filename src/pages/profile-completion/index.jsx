import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';

const ProfileCompletion = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Local state mapped to your exact Supabase columns
  const [formData, setFormData] = useState({
    username: '', 
    ig_handle: '',
    bio: ''
  });

  // Prefill the form if data already exists in user_profiles
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        ig_handle: profile.ig_handle || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      // 1. UPDATE DATABASE
      // We include email to satisfy the 'not-null' constraint in your schema
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email, 
          username: formData.username,
          ig_handle: formData.ig_handle,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (upsertError) throw upsertError;

      // 2. TRIGGER STATE REFRESH
      // We fire this but don't 'await' it to prevent the UI from hanging
      // if the network response is slower than the navigation.
      if (refreshProfile) {
        refreshProfile().catch(err => console.error("Profile refresh failed:", err));
      }

      // 3. FORCE REDIRECT
      // A small delay ensures the database write is finished before the 
      // AuthenticationGuard checks the user's data again on the next page.
      setTimeout(() => {
        setLoading(false);
        navigate('/member-hub-dashboard');
      }, 600);

    } catch (err) {
      console.error("Save Error:", err);
      setError(err.message || "An unexpected error occurred while saving.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Complete Your Profile</h1>
        <p className="text-muted-foreground text-sm text-center mb-8">
          Please provide these details to access your dashboard.
        </p>
        
        {error && (
          <div className="p-3 rounded-lg mb-6 bg-red-500/10 text-red-500 border border-red-500/20 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* USERNAME FIELD */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Display Name / Username</label>
            <input
              type="text"
              className="w-full p-3 bg-background border border-border rounded-xl text-white outline-none focus:ring-2 focus:ring-accent transition-all"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              placeholder="How should we call you?"
            />
          </div>

          {/* INSTAGRAM FIELD */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Instagram Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-muted-foreground">@</span>
              <input
                type="text"
                className="w-full p-3 pl-8 bg-background border border-border rounded-xl text-white outline-none focus:ring-2 focus:ring-accent transition-all"
                value={formData.ig_handle}
                onChange={(e) => setFormData({...formData, ig_handle: e.target.value})}
                required
                placeholder="username"
              />
            </div>
          </div>

          {/* BIO FIELD */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Bio (Optional)</label>
            <textarea
              className="w-full p-3 bg-background border border-border rounded-xl text-white h-24 resize-none outline-none focus:ring-2 focus:ring-accent transition-all"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth 
              disabled={loading}
              className="py-3"
            >
              {loading ? 'Saving Changes...' : 'Save and Enter Dashboard'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              fullWidth 
              onClick={() => navigate('/member-hub-dashboard')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletion;