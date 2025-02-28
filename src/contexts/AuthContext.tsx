
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

// Types pour le contexte
type Profile = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: "hr" | "employee";
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchProfile(userId: string) {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      if (data) {
        console.log("Profile data retrieved:", data);
        return data as Profile;
      } else {
        console.log("No profile found for user:", userId);
        return null;
      }
    } catch (error) {
      console.error("Exception in fetchProfile:", error);
      return null;
    }
  }

  useEffect(() => {
    console.log("Checking initial session...");
    
    // Set up a timeout to prevent indefinite loading
    const loadingTimeout = setTimeout(() => {
      console.log("Auth loading timeout reached, forcing completion");
      setIsLoading(false);
    }, 5000);
    
    // Check for an existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log("Initial session check result:", session ? "Session found" : "No session");
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        const profile = await fetchProfile(session.user.id);
        setProfile(profile);
      }
      
      setIsLoading(false);
    }).catch(error => {
      console.error("Error checking initial session:", error);
      setIsLoading(false);
    });
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state event:", event);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          const profile = await fetchProfile(session.user.id);
          setProfile(profile);
        } else {
          setProfile(null);
        }
      }
    );
    
    // Cleanup
    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error.message);
        return { error };
      }

      if (data?.user) {
        console.log("Sign in successful:", data.user.id);
        const profile = await fetchProfile(data.user.id);
        setProfile(profile);
      }

      return { error: null };
    } catch (error) {
      console.error("Exception during sign in:", error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out...");
      
      // First perform the Supabase signout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during Supabase signOut:", error);
        // Continue anyway to clean up local state
      }
      
      // Always clear local state regardless of Supabase response
      console.log("Clearing local auth state");
      setSession(null);
      setUser(null);
      setProfile(null);
      
      console.log("Sign out complete");
    } catch (error) {
      console.error("Exception during sign out:", error);
      
      // Still clear local state on error
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
