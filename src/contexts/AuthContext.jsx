import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; 

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
  refreshProfile: async () => {} // Added this to prevent crashes if pages call it
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (e) {
        console.error("Supabase connection failed", e);
      } finally {
        setLoading(false);
      }
    };
    checkUser();

    // Listen for auth changes to keep user state synced
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = { 
    user, 
    loading, 
    signIn: () => {}, 
    signOut: () => {},
    refreshProfile: async () => { console.log("Profile refresh called"); }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};