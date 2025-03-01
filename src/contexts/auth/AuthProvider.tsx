
import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    // One-time check for existing session on load, no redirects
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    };

    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error);
        return { error, data: { user: null, session: null } };
      }

      return { error: null, data };
    } catch (error: any) {
      setAuthError(error);
      return { 
        error, 
        data: { user: null, session: null }
      };
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading: false, // Always false to prevent loading states
        profile: null, // Always null, no profile fetching
        authReady: true, // Always ready
        authError,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
