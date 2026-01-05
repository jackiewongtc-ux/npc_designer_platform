import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const ProfileCompletion = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  
  const [formData, setFormData] = useState({
    full_name: '',
    ig_handle: '',
    bio: ''
  });

  // Sync form with existing profile data when the page loads
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
    setStatus({ type: '', msg: '' });

    try {
      // 1. Use UPSERT: This creates the row if it's missing, or updates if it exists
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id, // Primary key link to auth.users
          full_name: formData.full_name,
          ig_handle: formData.ig_handle,
          bio: formData.bio,
          updated_at: new Date()
        });

      if (upsertError) throw upsertError;

      // 2. Refresh the global Auth state so the Guard knows the handle exists
      const updatedProfile = await refreshProfile();

      setStatus({ type: 'success', msg: 'Profile saved successfully!' });
      
      // 3. Smart Redirect: Send user to their specific dashboard
      setTimeout(() => {
        const role = updatedProfile?.role || profile?.role || 'member';
        
        if (role === 'admin') {
          navigate('/admin-challenge-management');
        } else if (role === 'designer') {
          navigate('/designer-hub-dashboard');
        } else {
          navigate('/member-hub-dashboard');
        }
      }, 1500);

    } catch (err) {
      console.error("Save error:", err);
      setStatus({ type: 'error', msg: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Icon name="User" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {profile?.ig_handle ? 'Account Settings' : 'Complete Your Profile'}
              </h1>
              <p className="text-muted-foreground text-sm">
                {profile?.ig_handle 
                  ? 'Update your profile information and social links.' 
                  : 'Please complete your details to access the community.'}
              </p>
            </div>
          </div>

          {status.msg && (
            <div className={`p-4 rounded-lg mb-6 text-sm border animate-in fade-in slide-in-from-top-1 ${
              status.type === 'success' 
                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-foreground transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Instagram Handle</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-muted-foreground">@</span>
                <input
                  type="text"
                  value={formData.ig_handle}
                  onChange={(e) => setFormData({...formData, ig_handle: e.target.value})}
                  className="w-full p-3 pl-8 bg-background border border-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-foreground transition-all"
                  placeholder="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                className="w-full p-3 bg-background border border-border rounded-xl h-32 focus:ring-2 focus:ring-accent outline-none text-foreground resize-none transition-all"
                placeholder="Tell the community a bit about yourself..."
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Button type="submit" variant="primary" fullWidth disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Icon name="Loader2" size={18} className="animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
              
              {/* Back button only appears if they already finished onboarding */}
              {profile?.ig_handle && (
                <Button 
                  type="button" 
                  variant="outline" 
                  fullWidth 
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;