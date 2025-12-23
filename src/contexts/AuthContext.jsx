import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase?.auth?.getSession()?.then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session?.user?.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (MUST be synchronous)
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session?.user?.id); // fire-and-forget
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase?.auth?.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, username, bio = '') => {
    const { data, error } = await supabase?.auth?.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          role: 'consumer',
          bio: bio
        }
      }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase?.auth?.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in');
    
    const { data, error } = await supabase?.from('user_profiles')?.update(updates)?.eq('id', user?.id)?.select()?.single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};