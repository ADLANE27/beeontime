
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
  
  // Track if profile fetching is in progress to prevent duplicate requests
  const isProfileFetchingRef = useRef(false);

  // Function to safely update profile
  const updateProfile = async (userId: string) => {
    // Prevent duplicate profile fetches
    if (isProfileFetchingRef.current) return;
    
    try {
      isProfileFetchingRef.current = true;
      console.log("Fetching profile for user:", userId);
      const profileData = await fetchProfile(userId);
      
      if (isMountedRef.current) {
        setProfile(profileData);
        console.log("Profile fetched successfully:", profileData?.role);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      isProfileFetchingRef.current = false;
    }
  };

  // Clear auth state
  const clearAuthState = () => {
    if (isMountedRef.current) {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    console.log("Auth state hook initializing...");
    
    // Create a variable to track if the component is still mounted
    isMountedRef.current = true;
    
    // Track initial auth check completion
    let initialCheckComplete = false;
    
    // Set up a timeout to prevent indefinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current && !initialCheckComplete) {
        console.log("Auth loading timeout reached, forcing completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 3000); // Slightly longer timeout to ensure we give auth a chance to initialize
    
    // Check for an existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMountedRef.current) return;
      initialCheckComplete = true;
      
      console.log("Initial session check result:", session ? "Session found" : "No session");
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        if (session.user?.id) {
          await updateProfile(session.user.id);
        }
      }
      
      if (isMountedRef.current) {
        setIsLoading(false);
        setAuthInitialized(true);
        clearTimeout(loadingTimeout); // Clear timeout once loaded
      }
    }).catch(error => {
      initialCheckComplete = true;
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
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              setSession(session);
              setUser(session.user);
              
              if (session.user?.id) {
                await updateProfile(session.user.id);
              }
            }
            break;
            
          case 'SIGNED_OUT':
            clearAuthState();
            setIsLoading(false);
            break;
            
          case 'USER_UPDATED':
            if (session) {
              setSession(session);
              setUser(session.user);
              
              if (session.user?.id) {
                await updateProfile(session.user.id);
              }
            }
            break;
            
          case 'TOKEN_REFRESHED':
            if (session) {
              setSession(session);
              setUser(session.user);
            }
            break;
        }
      }
    );
    
    // Cleanup function
    return () => {
      console.log("Auth state hook cleaning up...");
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
