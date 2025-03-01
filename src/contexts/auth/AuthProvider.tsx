
import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  const [authReady, setAuthReady] = useState(false);

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

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message);
        setAuthError(error);
        return { error, data: { user: null, session: null } };
      }

      return { error: null, data };
    } catch (error: any) {
      console.error("Exception during login:", error);
      setAuthError(error);
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
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error);
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
        profile: null, // We're not using profiles yet
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
