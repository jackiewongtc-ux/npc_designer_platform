import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; 

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Core function to fetch data from the user_profiles table
  const fetchProfile = async (userId) => {
    try {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // We log a warning instead of throwing an error 
        // because new users won't have a profile yet.
        console.warn("Profile fetch note:", error.message);
        setProfile(null);
        return null;
      }

      setProfile(data);
      return data;
    } catch (e) {
      console.error("Critical Profile Error:", e.message);
      setProfile(null);
      return null;
    }
  };

  // Force a re-fetch of the profile (used after Profile Completion)
  const refreshProfile = async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
      } catch (e) {
        console.error("Auth initialization failed:", e);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for Auth changes (Sign In / Sign Out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, username, igHandle = '') => {
    try {
      console.log('🔐 Creating user account with Supabase Auth...');
      
      // Create auth user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            ig_handle: igHandle
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        throw authError;
      }

      if (!authData?.user) {
        throw new Error('Failed to create user account');
      }

      console.log('✅ User account created:', authData.user.id);
      
      // Update local state
      setUser(authData.user);
      
      // Wait a bit for the database trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the newly created profile
      await fetchProfile(authData.user.id);
      
      return authData;
    } catch (e) {
      console.error("Sign up error:", e);
      throw e;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  const value = { 
    user, 
    profile, 
    loading, 
    signUp,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);