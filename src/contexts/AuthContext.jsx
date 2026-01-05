import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; 

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase?.from('user_profiles')?.select('*')?.eq('id', userId)?.single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (e) {
      console.error("Error fetching profile:", e?.message);
      setProfile(null);
      return null;
    }
  };

  // This is the key function to prevent getting "stuck"
  const refreshProfile = async () => {
    if (user) {
      return await fetchProfile(user?.id);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase?.auth?.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) await fetchProfile(currentUser?.id);
      } catch (e) {
        console.error("Auth init failed", e);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser?.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase?.auth?.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = { 
    user, 
    profile, 
    loading, 
    signOut,
    refreshProfile // Exporting this so the profile page can use it
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);