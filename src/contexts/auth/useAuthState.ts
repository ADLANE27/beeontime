
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

  // Handle session update
  const handleSessionUpdate = async (newSession: Session | null) => {
    if (!isMountedRef.current) return;
    
    if (newSession) {
      setSession(newSession);
      setUser(newSession.user);
      
      if (newSession.user?.id) {
        try {
          const profileData = await fetchProfile(newSession.user.id);
          if (isMountedRef.current) {
            setProfile(profileData);
            setProfileFetchAttempted(true);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
          if (isMountedRef.current) {
            setProfileFetchAttempted(true);
          }
        }
      }
    } else {
      if (isMountedRef.current) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setProfileFetchAttempted(false);
      }
    }
    
    if (isMountedRef.current) {
      setIsLoading(false);
      setAuthInitialized(true);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Set a reasonable timeout for auth initialization
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current && !authInitialized) {
        console.log("Auth loading timeout reached, forcing completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 2000);
    
    // Check for an existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleSessionUpdate(session);
      } catch (error) {
        console.error("Error checking initial session:", error);
        if (isMountedRef.current) {
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
        
        if (event === 'SIGNED_IN') {
          await handleSessionUpdate(session);
        } else if (event === 'SIGNED_OUT') {
          if (isMountedRef.current) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setProfileFetchAttempted(false);
            setIsLoading(false);
            setAuthInitialized(true);
          }
        } else if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          if (session) {
            setSession(session);
            setUser(session.user);
            // Only refetch profile if needed
            if (session.user && (!profile || profile.id !== session.user.id)) {
              await handleSessionUpdate(session);
            }
          }
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
    profileFetchAttempted,
    setProfile
  };
}
