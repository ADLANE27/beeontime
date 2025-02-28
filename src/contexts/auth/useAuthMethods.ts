
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile } from "./profile-service";
import { Profile } from "./types";

export function useAuthMethods(
  setProfile: (profile: Profile | null) => void, 
  setIsLoading: (isLoading: boolean) => void
) {
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for:", email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error.message);
        setIsLoading(false);
        return { 
          error,
          data: {
            user: null,
            session: null
          }
        };
      }

      if (data?.user) {
        console.log("Sign in successful:", data.user.id);
        try {
          const profile = await fetchProfile(data.user.id);
          setProfile(profile);
        } catch (profileError) {
          console.error("Error fetching profile after sign in:", profileError);
          // Continue even if profile fetch fails - auth is still successful
        }
      }

      setIsLoading(false);
      return { 
        error: null,
        data: {
          user: data.user,
          session: data.session
        }
      };
    } catch (error) {
      console.error("Exception during sign in:", error);
      setIsLoading(false);
      return { 
        error: error as Error,
        data: {
          user: null,
          session: null
        }
      };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log("Signing out...");
      setIsLoading(true);
      
      // Clear local state first for immediate UI feedback
      setProfile(null);
      
      // Then perform the Supabase signout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during sign out:", error);
        // No longer throwing the error, instead returning a resolved promise
      }
      
      // Always resolve the promise
      return Promise.resolve();
    } catch (error) {
      console.error("Exception during sign out:", error);
      // Ensure we reset the profile even if there's an error
      setProfile(null);
      // Always resolve the promise instead of re-throwing
      return Promise.resolve();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    signOut
  };
}
