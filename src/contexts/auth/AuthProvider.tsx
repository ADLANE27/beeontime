
import React, { useState, useEffect } from "react";
import { AuthContext, Profile } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Fetch user profile data from the profiles table
  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      console.log("Fetching profile for user ID:", user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        console.log("Profile fetched successfully:", data);
        setProfile(data as Profile);
      } else {
        console.log("No profile found for user ID:", user.id);
        setProfile(null);
      }
    } catch (error) {
      console.error("Exception during profile fetch:", error);
    }
  };

  useEffect(() => {
    // Check for existing session on load
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      } catch (error) {
        console.error("Error checking session:", error);
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
        setIsLoading(false);
        setAuthReady(true);
      }
    );

    checkSession();

    // Cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch profile whenever user changes
  useEffect(() => {
    if (user && authReady) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user, authReady]);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      console.log("Signing in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message);
        setAuthError(error);
        toast.error("Erreur de connexion: " + error.message);
        return { error, data: { user: null, session: null } };
      }

      console.log("Sign in successful:", data.user?.email);
      // Profile will be fetched by the useEffect hook when user changes
      return { error: null, data };
    } catch (error: any) {
      console.error("Exception during login:", error);
      setAuthError(error);
      toast.error("Erreur système lors de la connexion");
      return { 
        error, 
        data: { user: null, session: null }
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      toast.success("Déconnexion réussie");
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error);
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setIsLoading(false);
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
        fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
