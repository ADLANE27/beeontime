
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
  authReady: boolean;
  profileFetchAttempted: boolean;
  authError: Error | null;
};

export function useAuthState() {
  // Use a single state object instead of multiple state variables
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    authReady: false,
    profileFetchAttempted: false,
    authError: null
  });
  
  const isMountedRef = useRef(true);
  const profileRetryCount = useRef(0);
  const MAX_PROFILE_RETRIES = 1; // Reduced from 2 to 1
  const profileFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Clear any pending timeouts
  const clearPendingTimeouts = useCallback(() => {
    if (profileFetchTimeoutRef.current) {
      clearTimeout(profileFetchTimeoutRef.current);
      profileFetchTimeoutRef.current = null;
    }
  }, []);

  // Define fetchUserProfile here BEFORE it's used in handleAuthStateChange to avoid the hook error
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!userId || !isMountedRef.current) return;
    
    try {
      console.log("Fetching profile for user:", userId, "Attempt:", profileRetryCount.current + 1);
      const profileData = await fetchProfile(userId);
      
      if (isMountedRef.current) {
        if (profileData) {
          console.log("Profile data retrieved successfully:", profileData.role);
          safeUpdateState({ 
            profile: profileData,
            profileFetchAttempted: true,
            isLoading: false,
            authError: null,
            authReady: true
          });
          // Reset retry counter on success
          profileRetryCount.current = 0;
        } else {
          console.log("Profile not found for user:", userId);
          // Increment retry counter and try again if under max retries
          if (profileRetryCount.current < MAX_PROFILE_RETRIES) {
            profileRetryCount.current++;
            
            // Use a ref to store the timeout so we can clear it if needed
            clearPendingTimeouts();
            profileFetchTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                fetchUserProfile(userId);
              }
            }, 800); // Retry faster - reduced from 1000ms
            return;
          }
          
          safeUpdateState({ 
            profileFetchAttempted: true,
            isLoading: false,
            authReady: true,
            // Set a more specific error message
            authError: new Error("Profil introuvable après plusieurs tentatives")
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      
      // Increment retry counter and try again if under max retries
      if (profileRetryCount.current < MAX_PROFILE_RETRIES) {
        profileRetryCount.current++;
        
        // Use a ref to store the timeout so we can clear it if needed
        clearPendingTimeouts();
        profileFetchTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchUserProfile(userId);
          }
        }, 800); // Retry faster - reduced from 1000ms
        return;
      }
      
      if (isMountedRef.current) {
        // Add a way to escape from infinite loading
        safeUpdateState({ 
          profileFetchAttempted: true,
          isLoading: false,
          authReady: true,
          authError: error instanceof Error ? error : new Error("Erreur lors de la récupération du profil")
        });
      }
    }
  }, [safeUpdateState, clearPendingTimeouts]);

  // Handle session state changes - Keep this outside of any conditional blocks
  const handleAuthStateChange = useCallback(async (event: string, newSession: Session | null) => {
    console.log("Auth state event:", event);
    
    if (!isMountedRef.current) return;
    
    if (event === 'SIGNED_IN') {
      console.log("User signed in:", newSession?.user?.id);
      safeUpdateState({
        session: newSession,
        user: newSession?.user || null,
        authReady: true
      });
      
      if (newSession?.user?.id) {
        // Reset retry counter when attempting a new login
        profileRetryCount.current = 0;
        // Clear any existing timeouts
        clearPendingTimeouts();
        try {
          await fetchUserProfile(newSession.user.id);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          safeUpdateState({ 
            isLoading: false,
            authReady: true,
            authError: error instanceof Error ? error : new Error("Erreur lors de la récupération du profil")
          });
        }
      } else {
        safeUpdateState({ isLoading: false, authReady: true });
      }
    } else if (event === 'SIGNED_OUT') {
      console.log("User signed out");
      // Clear any pending timeouts
      clearPendingTimeouts();
      safeUpdateState({
        session: null,
        user: null,
        profile: null,
        profileFetchAttempted: false,
        isLoading: false,
        authReady: true,
        authError: null
      });
    } else if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
      console.log("User or token updated");
      if (newSession) {
        safeUpdateState({
          session: newSession,
          user: newSession.user,
          authReady: true
        });
      }
    } else if (event === 'INITIAL_SESSION') {
      console.log("Initial session event");
      safeUpdateState({ authReady: true });
    } else {
      // Handle any other events by ensuring we're not stuck in loading
      console.log("Other auth event:", event);
      safeUpdateState({ isLoading: false, authReady: true });
    }
  }, [safeUpdateState, fetchUserProfile, clearPendingTimeouts]);

  // Initialize auth state on mount
  useEffect(() => {
    console.log("Auth state hook initializing...");
    
    const initialize = async () => {
      try {
        // Get initial session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          safeUpdateState({
            isLoading: false,
            authReady: true,
            authError: error
          });
          return;
        }
        
        if (!isMountedRef.current) return;
        
        if (data.session) {
          console.log("Initial session found:", data.session.user?.id);
          safeUpdateState({
            session: data.session,
            user: data.session.user,
            authReady: true
          });
          
          if (data.session.user?.id) {
            await fetchUserProfile(data.session.user.id);
          }
        } else {
          console.log("No initial session found");
          safeUpdateState({ 
            isLoading: false,
            authReady: true
          });
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        safeUpdateState({ 
          isLoading: false,
          authReady: true,
          authError: error instanceof Error ? error : new Error("Erreur d'initialisation de l'authentification")
        });
      }
    };

    // Add a timeout to prevent indefinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current && authState.isLoading) {
        console.warn("Auth initialization timeout - forcing loading state to complete");
        safeUpdateState({
          isLoading: false,
          authReady: true,
          authError: new Error("Délai d'authentification dépassé")
        });
      }
    }, 6000); // Reduced to 6 seconds timeout (from 8)
    
    initialize();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // Clean up function
    return () => {
      console.log("Auth state hook cleaning up...");
      isMountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
      clearPendingTimeouts();
    };
  }, [safeUpdateState, fetchUserProfile, handleAuthStateChange, clearPendingTimeouts, authState.isLoading]);

  // Destructure the state for API consistency
  const { session, user, profile, isLoading, authReady, profileFetchAttempted, authError } = authState;

  return {
    session,
    user,
    profile,
    isLoading,
    authReady,
    profileFetchAttempted,
    authError,
    setProfile
  };
}
