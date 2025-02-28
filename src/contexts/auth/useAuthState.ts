
import { useState, useEffect, useRef, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";
import { fetchProfile } from "./profile-service";

// Define a single state type to consolidate related states
type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  authInitialized: boolean;
  profileFetchAttempted: boolean;
};

export function useAuthState() {
  // Use a single state object instead of multiple state variables
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    authInitialized: false,
    profileFetchAttempted: false
  });
  
  const isMountedRef = useRef(true);

  // Create a safe state update function to prevent race conditions
  const safeUpdateState = useCallback((updates: Partial<AuthState>) => {
    if (isMountedRef.current) {
      setAuthState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Profile setter exposed to other components
  const setProfile = useCallback((profile: Profile | null) => {
    safeUpdateState({ profile });
  }, [safeUpdateState]);

  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!userId || !isMountedRef.current) return;
    
    try {
      console.log("Fetching profile for user:", userId);
      const profileData = await fetchProfile(userId);
      
      if (isMountedRef.current) {
        console.log("Profile data retrieved:", profileData ? "success" : "not found");
        safeUpdateState({ 
          profile: profileData,
          profileFetchAttempted: true,
          isLoading: false
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (isMountedRef.current) {
        safeUpdateState({ 
          profileFetchAttempted: true,
          isLoading: false
        });
      }
    }
  }, [safeUpdateState]);

  // Handle session state changes
  const handleAuthStateChange = useCallback(async (event: string, newSession: Session | null) => {
    console.log("Auth state event:", event);
    
    if (!isMountedRef.current) return;
    
    if (event === 'SIGNED_IN') {
      console.log("User signed in:", newSession?.user?.id);
      safeUpdateState({
        session: newSession,
        user: newSession?.user || null,
        authInitialized: true
      });
      
      if (newSession?.user?.id) {
        await fetchUserProfile(newSession.user.id);
      } else {
        safeUpdateState({ isLoading: false });
      }
    } else if (event === 'SIGNED_OUT') {
      console.log("User signed out");
      safeUpdateState({
        session: null,
        user: null,
        profile: null,
        profileFetchAttempted: false,
        isLoading: false,
        authInitialized: true
      });
    } else if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
      console.log("User or token updated");
      if (newSession) {
        safeUpdateState({
          session: newSession,
          user: newSession.user
        });
      }
    }
  }, [safeUpdateState, fetchUserProfile]);

  // Initialize auth state on mount
  useEffect(() => {
    console.log("Auth state hook initializing...");
    
    const initialize = async () => {
      try {
        // Get initial session
        const { data } = await supabase.auth.getSession();
        
        if (!isMountedRef.current) return;
        
        if (data.session) {
          console.log("Initial session found:", data.session.user?.id);
          safeUpdateState({
            session: data.session,
            user: data.session.user
          });
          
          if (data.session.user?.id) {
            await fetchUserProfile(data.session.user.id);
          }
        } else {
          console.log("No initial session found");
          safeUpdateState({ 
            isLoading: false,
            authInitialized: true
          });
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        safeUpdateState({ 
          isLoading: false,
          authInitialized: true
        });
      }
    };
    
    initialize();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // Clean up function
    return () => {
      console.log("Auth state hook cleaning up...");
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [safeUpdateState, fetchUserProfile, handleAuthStateChange]);

  // Destructure the state for API consistency
  const { session, user, profile, isLoading, authInitialized, profileFetchAttempted } = authState;

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
