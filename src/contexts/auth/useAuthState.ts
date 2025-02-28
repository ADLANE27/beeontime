
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

  useEffect(() => {
    isMountedRef.current = true;
    let authTimeout: NodeJS.Timeout;
    
    const initialize = async () => {
      try {
        // Get initial session
        const { data } = await supabase.auth.getSession();
        
        if (!isMountedRef.current) return;
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          try {
            // Fetch profile if we have a user
            if (data.session.user?.id) {
              const profileData = await fetchProfile(data.session.user.id);
              if (isMountedRef.current) {
                setProfile(profileData);
              }
            }
          } catch (error) {
            console.error("Error fetching initial profile:", error);
          } finally {
            if (isMountedRef.current) {
              setProfileFetchAttempted(true);
            }
          }
        }
        
        if (isMountedRef.current) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        if (isMountedRef.current) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
    initialize();
    
    // Set a reasonable timeout for auth initialization
    authTimeout = setTimeout(() => {
      if (isMountedRef.current && !authInitialized) {
        console.log("Auth loading timeout reached, forcing completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 2000);
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state event:", event);
        
        if (event === 'SIGNED_IN') {
          if (!isMountedRef.current) return;
          
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession?.user?.id) {
            try {
              const profileData = await fetchProfile(newSession.user.id);
              if (isMountedRef.current) {
                setProfile(profileData);
                setProfileFetchAttempted(true);
              }
            } catch (error) {
              console.error("Error fetching profile on sign in:", error);
              if (isMountedRef.current) {
                setProfileFetchAttempted(true);
              }
            }
          }
          
          if (isMountedRef.current) {
            setIsLoading(false);
            setAuthInitialized(true);
          }
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
          if (newSession && isMountedRef.current) {
            setSession(newSession);
            setUser(newSession.user);
          }
        }
      }
    );
    
    return () => {
      console.log("Auth state hook cleaning up...");
      isMountedRef.current = false;
      clearTimeout(authTimeout);
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
