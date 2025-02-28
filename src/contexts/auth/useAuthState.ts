
import { useState, useEffect, useRef } from "react";
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
  const isMountedRef = useRef(true);

  useEffect(() => {
    console.log("Auth state hook initializing...");
    
    // Create a variable to track if the component is still mounted
    isMountedRef.current = true;
    
    // Set up a timeout to prevent indefinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        console.log("Auth loading timeout reached, forcing completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 1800); // Reduced timeout for faster auth initialization
    
    // Check for an existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMountedRef.current) return;
      
      console.log("Initial session check result:", session ? "Session found" : "No session");
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        try {
          if (session.user?.id) {
            const profile = await fetchProfile(session.user.id);
            if (isMountedRef.current) {
              setProfile(profile);
              console.log("Profile fetched successfully:", profile?.role);
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
      
      if (isMountedRef.current) {
        setIsLoading(false);
        setAuthInitialized(true);
        clearTimeout(loadingTimeout); // Clear timeout once loaded
      }
    }).catch(error => {
      if (isMountedRef.current) {
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
        
        if (!isMountedRef.current) return;
        
        // Update state based on the event
        setSession(session);
        setUser(session?.user ?? null);
        
        // Immediately set loading to false if signing out to prevent loading screen
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setIsLoading(false);
        }
        
        // Reload profile when auth state changes
        try {
          if (session?.user?.id) {
            const profile = await fetchProfile(session.user.id);
            if (isMountedRef.current) {
              setProfile(profile);
              console.log("Profile updated after auth change:", profile?.role);
            }
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching profile on auth change:", error);
        }
      }
    );
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
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
