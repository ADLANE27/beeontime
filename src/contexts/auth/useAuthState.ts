
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
    console.log("Auth state hook initializing...");
    
    const initialize = async () => {
      try {
        // Get initial session
        const { data } = await supabase.auth.getSession();
        
        if (!isMountedRef.current) return;
        
        if (data.session) {
          console.log("Initial session found:", data.session.user?.id);
          setSession(data.session);
          setUser(data.session.user);
          
          if (data.session.user?.id) {
            try {
              console.log("Fetching initial profile for user:", data.session.user.id);
              const profileData = await fetchProfile(data.session.user.id);
              if (isMountedRef.current) {
                console.log("Profile data retrieved:", profileData ? "success" : "not found");
                setProfile(profileData);
                setProfileFetchAttempted(true);
              }
            } catch (error) {
              console.error("Error fetching initial profile:", error);
              if (isMountedRef.current) {
                setProfileFetchAttempted(true);
              }
            }
          }
        } else {
          console.log("No initial session found");
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
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state event:", event);
        
        if (!isMountedRef.current) return;
        
        if (event === 'SIGNED_IN') {
          console.log("User signed in:", newSession?.user?.id);
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession?.user?.id) {
            try {
              console.log("Fetching profile after sign in for user:", newSession.user.id);
              const profileData = await fetchProfile(newSession.user.id);
              if (isMountedRef.current) {
                console.log("Profile data after sign in:", profileData ? "success" : "not found");
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
          
          setIsLoading(false);
          setAuthInitialized(true);
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
          setSession(null);
          setUser(null);
          setProfile(null);
          setProfileFetchAttempted(false);
          setIsLoading(false);
          setAuthInitialized(true);
        } else if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          console.log("User or token updated");
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
          }
        }
      }
    );
    
    return () => {
      console.log("Auth state hook cleaning up...");
      isMountedRef.current = false;
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
