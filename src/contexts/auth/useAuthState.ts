
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
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false);
  
  const isMountedRef = useRef(true);
  const isProfileFetchingRef = useRef(false);
  const profileFetchTimeoutRef = useRef<number | null>(null);

  // Function to safely update profile with timeout protection
  const updateProfile = async (userId: string) => {
    // Prevent duplicate profile fetches or fetches after unmount
    if (isProfileFetchingRef.current || !isMountedRef.current) return;
    
    try {
      isProfileFetchingRef.current = true;
      console.log("Fetching profile for user:", userId);
      
      // Set a timeout to prevent infinite loading
      profileFetchTimeoutRef.current = window.setTimeout(() => {
        if (isMountedRef.current && isProfileFetchingRef.current) {
          console.log("Profile fetch timeout reached, marking as attempted anyway");
          isProfileFetchingRef.current = false;
          setProfileFetchAttempted(true);
        }
      }, 5000);
      
      const profileData = await fetchProfile(userId);
      
      // Clear the timeout since we got a response
      if (profileFetchTimeoutRef.current) {
        clearTimeout(profileFetchTimeoutRef.current);
        profileFetchTimeoutRef.current = null;
      }
      
      if (isMountedRef.current) {
        setProfile(profileData);
        setProfileFetchAttempted(true);
        console.log("Profile fetched successfully:", profileData?.role || "No role found");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (isMountedRef.current) {
        // Even on error, we've attempted to fetch profile
        setProfileFetchAttempted(true);
      }
    } finally {
      if (isMountedRef.current) {
        isProfileFetchingRef.current = false;
        // Clear timeout if it's still active
        if (profileFetchTimeoutRef.current) {
          clearTimeout(profileFetchTimeoutRef.current);
          profileFetchTimeoutRef.current = null;
        }
      }
    }
  };

  // Clear auth state
  const clearAuthState = () => {
    if (isMountedRef.current) {
      console.log("Clearing auth state");
      setSession(null);
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
    }
  };

  // Handle session state updates including profile fetching
  const handleSessionUpdate = async (newSession: Session | null) => {
    if (!isMountedRef.current) return;
    
    console.log("Handling session update:", newSession ? "Session exists" : "No session");
    
    if (newSession) {
      setSession(newSession);
      setUser(newSession.user);
      
      // Only fetch profile if we have a user and haven't already started fetching
      if (newSession.user?.id && !isProfileFetchingRef.current) {
        await updateProfile(newSession.user.id);
      }
    } else {
      clearAuthState();
    }
    
    // Mark auth as initialized and not loading anymore
    if (isMountedRef.current) {
      setIsLoading(false);
      setAuthInitialized(true);
    }
  };

  useEffect(() => {
    console.log("Auth state hook initializing...");
    
    // Create a variable to track if the component is still mounted
    isMountedRef.current = true;
    
    // Set up a timeout to prevent indefinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current && !authInitialized) {
        console.log("Auth loading timeout reached, forcing completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 5000); // 5 second timeout
    
    // Check for an existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMountedRef.current) return;
        
        console.log("Initial session check result:", session ? "Session found" : "No session");
        await handleSessionUpdate(session);
      } catch (error) {
        if (isMountedRef.current) {
          console.error("Error checking initial session:", error);
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state event:", event);
        
        if (!isMountedRef.current) return;
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            // Clear previous state to avoid conflicts
            if (profile) {
              setProfile(null);
              setProfileFetchAttempted(false);
            }
            await handleSessionUpdate(session);
            break;
            
          case 'SIGNED_OUT':
            clearAuthState();
            setIsLoading(false);
            setAuthInitialized(true);
            break;
            
          case 'USER_UPDATED':
          case 'TOKEN_REFRESHED':
            if (session) {
              setSession(session);
              setUser(session.user);
              
              // Re-fetch profile on user update if user exists and profile fetch not already in progress
              if (session.user?.id && !isProfileFetchingRef.current) {
                await updateProfile(session.user.id);
              }
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
      
      // Clear profile fetch timeout if it exists
      if (profileFetchTimeoutRef.current) {
        clearTimeout(profileFetchTimeoutRef.current);
        profileFetchTimeoutRef.current = null;
      }
      
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    profile,
    isLoading,
    authInitialized,
    profileFetchAttempted,
    setProfile
  };
}
