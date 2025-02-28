
import React, { useEffect, useState } from "react";
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthContext } from "./AuthContext";
import { Profile } from "./types";
import { fetchProfile } from "./profile-service";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  async function refreshProfile() {
    if (!session?.user?.id) {
      console.log("No user session to refresh profile");
      return;
    }
    
    setIsLoading(true);
    console.log("Refreshing profile for user:", session.user.id);
    
    try {
      const refreshedProfile = await fetchProfile(session.user.id, true);
      setProfile(refreshedProfile);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    console.log("Setting up auth state listeners");
    
    // Créer une variable pour suivre si le composant est toujours monté
    let isMounted = true;
    
    // Set up a timeout to prevent indefinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.log("Auth loading timeout reached, forcing completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 5000);
    
    // Check for an existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      
      console.log("Initial session check result:", session ? "Session found" : "No session");
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        if (session.user.id) {
          const profile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(profile);
            if (!profile) {
              console.warn("No profile found for authenticated user, attempting to create one");
              await refreshProfile();
            }
          }
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }).catch(error => {
      if (isMounted) {
        console.error("Error checking initial session:", error);
        setIsLoading(false);
        setAuthInitialized(true);
      }
    });
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state event:", event, newSession ? "With session" : "No session");
        
        if (!isMounted) return;

        // Using string literal comparison to ensure type safety
        if (event === 'SIGNED_OUT') {
          console.log("Signed out, clearing all auth state");
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }
        
        // Pour PASSWORD_RECOVERY, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          if (newSession.user.id) {
            const profile = await fetchProfile(newSession.user.id);
            if (isMounted) {
              setProfile(profile);
              if (!profile && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
                console.warn("No profile found after auth event, attempting to create one");
                await refreshProfile();
              }
            }
          }
        } else if (event !== 'SIGNED_OUT') {
          // Si pas de session mais ce n'est pas SIGNED_OUT, c'est probablement une erreur
          console.warn(`Auth event ${event} occurred but no session was provided`);
        }
      }
    );
    
    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for:", email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error.message);
        setIsLoading(false);
        return { error };
      }

      if (data?.user) {
        console.log("Sign in successful:", data.user.id);
        const profile = await fetchProfile(data.user.id);
        if (!profile) {
          console.warn("No profile found after sign in, attempting to create one");
          await refreshProfile();
        } else {
          setProfile(profile);
        }
      }

      setIsLoading(false);
      return { error: null };
    } catch (error) {
      console.error("Exception during sign in:", error);
      setIsLoading(false);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out...");
      setIsLoading(true);
      
      // First perform the Supabase signout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during Supabase signOut:", error);
        // Continue anyway to clean up local state
      }
      
      // Always clear local state regardless of Supabase response
      console.log("Clearing local auth state");
      setSession(null);
      setUser(null);
      setProfile(null);
      
      console.log("Sign out complete");
      setIsLoading(false);
    } catch (error) {
      console.error("Exception during sign out:", error);
      
      // Still clear local state on error
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
