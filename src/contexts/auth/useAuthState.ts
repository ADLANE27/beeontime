
import { useState, useEffect } from "react";
import { Session, User, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";
import { fetchProfile } from "./profile-service";

export function useAuthState() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    console.log("Checking initial session...");
    
    // Create a variable to track if the component is still mounted
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
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        const profile = await fetchProfile(session.user.id);
        if (isMounted) {
          setProfile(profile);
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
      async (event: string, session) => {
        console.log("Auth state event:", event);
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          const profile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(profile);
          }
        } else {
          if (isMounted) {
            setProfile(null);
          }
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

  return {
    session,
    user,
    profile,
    isLoading,
    authInitialized,
    setProfile
  };
}
