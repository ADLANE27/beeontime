
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

  // Simplified profile update without timeout complexity
  const updateProfile = async (userId: string) => {
    if (isProfileFetchingRef.current || !isMountedRef.current) return;
    
    try {
      isProfileFetchingRef.current = true;
      console.log("Fetching profile for user:", userId);
      
      const profileData = await fetchProfile(userId);
      
      if (isMountedRef.current) {
        setProfile(profileData);
        setProfileFetchAttempted(true);
        console.log("Profile fetched successfully:", profileData?.role || "No role found");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (isMountedRef.current) {
        setProfileFetchAttempted(true);
      }
    } finally {
      if (isMountedRef.current) {
        isProfileFetchingRef.current = false;
      }
    }
  };

  // Clear auth state - simplified
  const clearAuthState = () => {
    if (isMountedRef.current) {
      console.log("Clearing auth state");
      setSession(null);
      setUser(null);
      setProfile(null);
      setProfileFetchAttempted(false);
    }
  };

  // Handle session update - simplified
  const handleSessionUpdate = async (newSession: Session | null) => {
    if (!isMountedRef.current) return;
    
    console.log("Handling session update:", newSession ? "Session exists" : "No session");
    
    if (newSession) {
      setSession(newSession);
      setUser(newSession.user);
      
      if (newSession.user?.id && !isProfileFetchingRef.current) {
        await updateProfile(newSession.user.id);
      }
    } else {
      clearAuthState();
    }
    
    if (isMountedRef.current) {
      setIsLoading(false);
      setAuthInitialized(true);
    }
  };

  useEffect(() => {
    console.log("Auth state hook initializing...");
    isMountedRef.current = true;
    
    // Simplified timeout mechanism
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current && !authInitialized) {
        console.log("Auth loading timeout reached, forcing completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 3000); // Reduced timeout from 5s to 3s
    
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
        
        // Handle different auth events with simplified logic
        switch (event) {
          case 'SIGNED_IN':
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
            if (session?.user?.id && !isProfileFetchingRef.current) {
              setSession(session);
              setUser(session.user);
              await updateProfile(session.user.id);
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
    profileFetchAttempted,
    setProfile
  };
}
