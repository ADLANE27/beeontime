
import { useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
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
    }, 3000); // Reduced from 5000ms to 3000ms for faster timeout
    
    // Check for an existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      
      console.log("Initial session check result:", session ? "Session found" : "No session");
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        try {
          if (session.user?.id) {
            const profile = await fetchProfile(session.user.id);
            if (isMounted) {
              setProfile(profile);
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
        setAuthInitialized(true);
        clearTimeout(loadingTimeout); // Clear timeout once loaded
      }
    }).catch(error => {
      if (isMounted) {
        console.error("Error checking initial session:", error);
        setIsLoading(false);
        setAuthInitialized(true);
        clearTimeout(loadingTimeout); // Clear timeout on error
      }
    });
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state event:", event);
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        try {
          if (session?.user?.id) {
            const profile = await fetchProfile(session.user.id);
            if (isMounted) {
              setProfile(profile);
            }
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching profile on auth change:", error);
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
