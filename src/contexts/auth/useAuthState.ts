
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

  // Improved session persistence check
  const refreshSession = useCallback(async () => {
    try {
      console.log("Refreshing session...");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error retrieving session:", error);
        return null;
      }
      
      if (data?.session) {
        console.log("Session found for user:", data.session.user.id);
        safeUpdateState({
          session: data.session,
          user: data.session.user
        });
        return data.session;
      } else {
        console.log("No session found during refresh");
        return null;
      }
    } catch (err) {
      console.error("Exception refreshing session:", err);
      return null;
    } finally {
      sessionChecked.current = true;
    }
  }, [safeUpdateState]);

  // Define fetchUserProfile here to avoid hook errors
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
          // Save session to localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem('supabaseSession', JSON.stringify(newSession));
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
      
      // Clear backup session storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabaseSession');
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
  }, [safeUpdateState, fetchUserProfile]);

  // Initialize auth state on mount
  useEffect(() => {
    console.log("Auth state hook initializing...");
    
    const initialize = async () => {
      try {
        // First try to load from localStorage as a backup
        let savedSession = null;
        if (typeof window !== 'undefined') {
          try {
            const savedSessionStr = localStorage.getItem('supabaseSession');
            if (savedSessionStr) {
              savedSession = JSON.parse(savedSessionStr);
              console.log("Found saved session in localStorage:", savedSession?.user?.id);
            }
          } catch (e) {
            console.error("Error parsing saved session:", e);
          }
        }
        
        // Get initial session from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          // Try to use saved session if available
          if (savedSession) {
            console.log("Using saved session as fallback");
            safeUpdateState({
              session: savedSession,
              user: savedSession.user,
              authReady: true
            });
            
            // Attempt to fetch profile using saved session
            if (savedSession.user?.id) {
              await fetchUserProfile(savedSession.user.id);
            }
            return;
          }
          
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
          
          // Save to localStorage as backup
          if (typeof window !== 'undefined') {
            localStorage.setItem('supabaseSession', JSON.stringify(data.session));
          }
          
          safeUpdateState({
            session: data.session,
            user: data.session.user,
            authReady: true
          });
          
          if (data.session.user?.id) {
            await fetchUserProfile(data.session.user.id);
          }
        } else {
          console.log("No session found");
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
          authReady: true
        });
      }
    }, 3000);
    
    initialize();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // Clean up function
    return () => {
      console.log("Auth state hook cleaning up...");
      isMountedRef.current = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [safeUpdateState, fetchUserProfile, handleAuthStateChange, authState.isLoading]);

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
    refreshSession
  };
}
