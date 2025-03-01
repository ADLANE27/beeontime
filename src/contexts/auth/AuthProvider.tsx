
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

  useEffect(() => {
    // Initialize auth state from supabase session
    const initializeAuth = async () => {
      try {
        // Get session from supabase
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch user profile if we have a session
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();
              
            if (error) {
              console.error('Error fetching profile:', error);
              setAuthError(new Error('Failed to fetch user profile'));
            } else if (profileData) {
              setProfile(profileData);
            }
          } catch (profileError: any) {
            console.error('Exception fetching profile:', profileError);
            setAuthError(profileError);
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
          // Fetch user profile on auth state change
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (error) {
              console.error('Error fetching profile on auth change:', error);
              setAuthError(new Error('Failed to fetch user profile'));
            } else if (profileData) {
              setProfile(profileData);
            }
          } catch (profileError: any) {
            console.error('Exception fetching profile on auth change:', profileError);
            setAuthError(profileError);
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
      } else if (data.user) {
        // Fetch profile after successful sign in
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching profile after login:', profileError);
            setAuthError(new Error('Failed to fetch user profile after login'));
          } else if (profileData) {
            setProfile(profileData);
          }
        } catch (profileError: any) {
          console.error('Exception fetching profile after login:', profileError);
          setAuthError(profileError);
        }
      }

      return { error, data };
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
