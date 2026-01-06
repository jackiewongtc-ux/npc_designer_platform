import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';

const ProfileCompletion = () => {
  // We pull refreshProfile to ensure the Member's new data is recognized immediately
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    ig_handle: '',
    bio: ''
  });

  // Load existing data into form fields
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
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
      // 1. Update ONLY the specific profile fields
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: formData.full_name,
        ig_handle: formData.ig_handle,
        bio: formData.bio,
        updated_at: new Date().toISOString()
      });

      if (upsertError) throw upsertError;

      // 2. CRITICAL: Update the local Auth state
      // This tells the Guard that the IG handle now exists, breaking the loop.
      if (refreshProfile) {
        await refreshProfile();
      }

      // 3. Move the Member to their dashboard
      navigate('/member-hub-dashboard');

    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-foreground mb-6">Complete Member Profile</h1>
        
        {error && (
          <div className="p-3 rounded-lg mb-6 bg-red-500/10 text-red-500 border border-red-500/20 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input
              type="text"
              className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-accent text-foreground"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Instagram Handle</label>
            <input
              type="text"
              className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-accent text-foreground"
              placeholder="username (without @)"
              value={formData.ig_handle}
              onChange={(e) => setFormData({...formData, ig_handle: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Bio (Optional)</label>
            <textarea
              className="w-full p-3 bg-background border border-border rounded-xl h-24 resize-none outline-none focus:ring-2 focus:ring-accent text-foreground"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Saving...' : 'Save and Enter Dashboard'}
            </Button>
            
            {/* CANCEL BUTTON: Explicitly sends Members to their dashboard */}
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