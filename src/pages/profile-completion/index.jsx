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
  
  const [formData, setFormData] = useState({
    username: '', 
    ig_handle: '',
    bio: ''
  });

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

      if (refreshProfile) {
        refreshProfile().catch(err => console.error("Profile refresh failed:", err));
      }

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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111111] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Complete Your Profile</h1>
        <p className="text-gray-400 text-sm text-center mb-8">
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
            <label className="block text-sm font-medium mb-1.5 text-gray-300">Display Name / Username</label>
            <input
              type="text"
              className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-600"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              placeholder="How should we call you?"
            />
          </div>

          {/* INSTAGRAM FIELD */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-300">Instagram Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">@</span>
              <input
                type="text"
                className="w-full p-3 pl-8 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                value={formData.ig_handle}
                onChange={(e) => setFormData({...formData, ig_handle: e.target.value})}
                required
                placeholder="username"
              />
            </div>
          </div>

          {/* BIO FIELD */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-300">Bio (Optional)</label>
            <textarea
              className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white h-24 resize-none outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-gray-600"
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
              className="py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              {loading ? 'Saving Changes...' : 'Save and Enter Dashboard'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              fullWidth 
              onClick={() => navigate('/member-hub-dashboard')}
              className="border-white/10 text-gray-400 hover:bg-white/5"
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