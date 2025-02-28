
import { User, Session } from "@supabase/supabase-js";
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
        const profile = await fetchProfile(data.user.id);
        setProfile(profile);
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

  const signOut = async () => {
    try {
      console.log("Signing out...");
      setIsLoading(true);
      
      // First perform the Supabase signout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during Supabase signOut:", error);
        // Continue anyway to clean up local state
      }
      
      // Always clear local state regardless of Supabase response
      console.log("Clearing local auth state");
      setProfile(null);
      
      console.log("Sign out complete");
      setIsLoading(false);
    } catch (error) {
      console.error("Exception during sign out:", error);
      
      // Still clear local state on error
      setProfile(null);
      setIsLoading(false);
    }
  };

  return {
    signIn,
    signOut
  };
}
