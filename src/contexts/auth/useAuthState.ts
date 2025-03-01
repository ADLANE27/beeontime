
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
  const MAX_PROFILE_RETRIES = 0; // Reduced to 0 - no retries, faster processing
  const profileFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionChecked = useRef(false);

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

  // Improved session persistence check
  const checkPersistedSession = useCallback(async () => {
    if (sessionChecked.current) return;
    
    try {
      console.log("Checking for persisted session...");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error retrieving persisted session:", error);
        return null;
      }
      
      if (data?.session) {
        console.log("Found persisted session for user:", data.session.user.id);
        return data.session;
      } else {
        console.log("No persisted session found");
        return null;
      }
    } catch (err) {
      console.error("Exception checking persisted session:", err);
      return null;
    } finally {
      sessionChecked.current = true;
    }
  }, []);

  // Define fetchUserProfile here BEFORE it's used in handleAuthStateChange to avoid the hook error
  const fetchUserProfile = useCallback(async (userId: string) => {
    if (!userId || !isMountedRef.current) return;
    
    try {
      console.log("Fetching profile for user:", userId);
      const profileData = await fetchProfile(userId);
      
      if (isMountedRef.current) {
        // Always complete auth process whether we get a profile or not
        safeUpdateState({ 
          profile: profileData,
          profileFetchAttempted: true,
          isLoading: false,
          authError: null,
          authReady: true
        });
        
        console.log("Profile fetched successfully:", profileData?.role);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      
      if (isMountedRef.current) {
        // Complete auth process even if there's an error
        safeUpdateState({ 
          profileFetchAttempted: true,
          isLoading: false,
          authReady: true,
          authError: error instanceof Error ? error : new Error("Erreur lors de la récupération du profil")
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
        authReady: true
      });
      
      if (newSession?.user?.id) {
        try {
          // Store session in localStorage for persistence backup
          if (typeof window !== 'undefined') {
            localStorage.setItem('supabase.auth.token', JSON.stringify({
              currentSession: newSession
            }));
          }
          
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
      
      // Clear any backup session storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
      }
      
      safeUpdateState({
        session: null,
        user: null,
        profile: null,
        profileFetchAttempted: false,
        isLoading: false,
        authReady: true,
        authError: null
      });
      
      sessionChecked.current = false;
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
      console.log("Initial session event:", newSession?.user?.id || "No user");
      
      if (newSession?.user) {
        console.log("Initial session has user:", newSession.user.id);
        safeUpdateState({
          session: newSession,
          user: newSession.user,
          authReady: true
        });
        
        await fetchUserProfile(newSession.user.id);
      } else {
        console.log("No user in initial session");
        safeUpdateState({ 
          authReady: true,
          isLoading: false
        });
      }
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
          console.log("No initial session found, checking for persisted session...");
          
          // Check for persisted session in localStorage as a backup
          const persistedSession = await checkPersistedSession();
          
          if (persistedSession) {
            console.log("Using persisted session for user:", persistedSession.user.id);
            safeUpdateState({
              session: persistedSession,
              user: persistedSession.user,
              authReady: true
            });
            
            if (persistedSession.user?.id) {
              await fetchUserProfile(persistedSession.user.id);
            }
          } else {
            console.log("No persisted session found either");
            safeUpdateState({ 
              isLoading: false,
              authReady: true
            });
          }
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

    // Add a timeout to prevent indefinite loading - REDUCED SIGNIFICANTLY
    const loadingTimeout = setTimeout(() => {
      if (isMountedRef.current && authState.isLoading) {
        console.warn("Auth initialization timeout - forcing loading state to complete");
        safeUpdateState({
          isLoading: false,
          authReady: true,
          authError: null // Removed error to allow flow to continue
        });
      }
    }, 3000); // Increased to 3 seconds to allow more time for session retrieval
    
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
  }, [safeUpdateState, fetchUserProfile, handleAuthStateChange, clearPendingTimeouts, authState.isLoading, checkPersistedSession]);

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
    setProfile,
    refreshSession: checkPersistedSession // Expose the session refresh function
  };
}
