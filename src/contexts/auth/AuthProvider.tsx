
import React, { useState, useEffect } from "react";
import { AuthContext, Profile } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        // Even if we can't fetch the profile, we can still proceed with basic role
        // This prevents blocking the app if the profiles table doesn't exist yet
        return { id: userId, role: 'employee' };
      } 
      
      return profileData;
    } catch (error) {
      console.error('Exception fetching profile:', error);
      // Fallback to basic profile to prevent UI from freezing
      return { id: userId, role: 'employee' };
    }
  };

  useEffect(() => {
    // Initialize auth state from supabase session
    const initializeAuth = async () => {
      try {
        // Get session from supabase
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch minimal profile data just for role-based navigation
          const profileData = await fetchProfile(data.session.user.id);
          if (profileData) {
            setProfile({ 
              id: profileData.id, 
              role: profileData.role 
            });
          }
        }
      } catch (error: any) {
        console.error("Error initializing auth:", error);
        setAuthError(error);
      } finally {
        setIsLoading(false);
        setAuthReady(true);
      }
    };

    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          // Fetch minimal profile data just for role-based navigation
          const profileData = await fetchProfile(session.user.id);
          if (profileData) {
            setProfile({ 
              id: profileData.id, 
              role: profileData.role 
            });
          }
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
        setAuthReady(true);
      }
    );

    initializeAuth();

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error);
        return { error, data: { user: null, session: null } };
      }
      
      // Only fetch minimal profile data for role-based routing
      if (data.user) {
        const profileData = await fetchProfile(data.user.id);
        if (profileData) {
          setProfile({ 
            id: profileData.id, 
            role: profileData.role 
          });
        }
      }

      return { error: null, data };
    } catch (error: any) {
      setAuthError(error);
      return { 
        error, 
        data: { user: null, session: null }
      };
    } finally {
      setIsLoading(false);
      setAuthReady(true);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error);
    } finally {
      setIsLoading(false);
      setAuthReady(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        profile,
        authReady,
        authError,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
