import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!handle) return alert("Please enter your Instagram handle");
    
    setLoading(true);

    try {
      // 1. Update the database
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ig_handle: handle,
          onboarding_completed: true
        })
        .eq('id', user?.id);

      if (error) throw error;

      // 2. Refresh the profile in your global Auth state
      if (refreshProfile) {
        await refreshProfile();
      }

      // 3. Success! Redirect to dashboard
      navigate('/member-hub-dashboard');

    } catch (err) {
      console.error("Save error:", err.message);
      alert("Save failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: '#f4f4f4',
      color: '#333'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ fontSize: '22px', marginBottom: '10px' }}>Final Step</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>Enter your Instagram handle to finish setting up your account.</p>
        
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Instagram Handle</label>
        <input 
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #ddd',
            marginBottom: '20px',
            boxSizing: 'border-box'
          }}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@username"
        />

        <button 
          onClick={handleSave}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: '#000', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "Saving..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );
}