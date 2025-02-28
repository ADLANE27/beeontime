
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
      
      // Clear local state first for immediate UI feedback
      setProfile(null);
      
      // Then perform the Supabase signout
      const { error } = await supabase.auth.signOut();
      
      setIsLoading(false);
      return { error };
    } catch (error) {
      console.error("Exception during sign out:", error);
      setProfile(null);
      setIsLoading(false);
      return { error: error as Error };
    }
  };

  return {
    signIn,
    signOut
  };
}
