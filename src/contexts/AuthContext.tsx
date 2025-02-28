
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

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
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  async function fetchProfile(userId: string, forceRefresh = false) {
    try {
      console.log("Fetching profile for user:", userId, forceRefresh ? "(forced refresh)" : "");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Erreur lors du chargement du profil utilisateur");
        return null;
      }

      if (data) {
        console.log("Profile data retrieved:", data);
        return data as Profile;
      } else {
        console.log("No profile found for user:", userId);
        
        // Tentative de création d'un profil par défaut si aucun n'existe
        if (forceRefresh) {
          const userData = await supabase.auth.getUser();
          if (userData.data?.user) {
            const email = userData.data.user.email;
            const { error: insertError } = await supabase
              .from("profiles")
              .insert({
                id: userId,
                email: email,
                role: "employee" // Rôle par défaut
              });
              
            if (insertError) {
              console.error("Error creating default profile:", insertError);
              toast.error("Impossible de créer un profil utilisateur par défaut");
              return null;
            }
            
            // Récupérer le profil nouvellement créé
            const { data: newProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle();
              
            console.log("Created default profile:", newProfile);
            return newProfile as Profile;
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error("Exception in fetchProfile:", error);
      toast.error("Erreur lors de la récupération du profil");
      return null;
    }
  }

  async function refreshProfile() {
    if (!session?.user?.id) {
      console.log("No user session to refresh profile");
      return;
    }
    
    setIsLoading(true);
    console.log("Refreshing profile for user:", session.user.id);
    
    try {
      const refreshedProfile = await fetchProfile(session.user.id, true);
      setProfile(refreshedProfile);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    console.log("Checking initial session...");
    
    // Créer une variable pour suivre si le composant est toujours monté
    let isMounted = true;
    
    // Set up a timeout to prevent indefinite loading
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.log("Auth loading timeout reached, forcing completion");
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 5000);
    
    // Check for an existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      
      console.log("Initial session check result:", session ? "Session found" : "No session");
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        const profile = await fetchProfile(session.user.id);
        if (isMounted) {
          setProfile(profile);
          if (!profile) {
            console.warn("No profile found for authenticated user, attempting to create one");
            await refreshProfile();
          }
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }).catch(error => {
      if (isMounted) {
        console.error("Error checking initial session:", error);
        setIsLoading(false);
        setAuthInitialized(true);
      }
    });
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state event:", event);
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.id) {
          const profile = await fetchProfile(session.user.id);
          if (isMounted) {
            setProfile(profile);
            if (!profile && event === 'SIGNED_IN') {
              console.warn("No profile found for authenticated user after sign in, attempting to create one");
              await refreshProfile();
            }
          }
        } else {
          if (isMounted) {
            setProfile(null);
          }
        }
      }
    );
    
    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

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
        return { error };
      }

      if (data?.user) {
        console.log("Sign in successful:", data.user.id);
        const profile = await fetchProfile(data.user.id);
        if (!profile) {
          console.warn("No profile found after sign in, attempting to create one");
          await refreshProfile();
        } else {
          setProfile(profile);
        }
      }

      setIsLoading(false);
      return { error: null };
    } catch (error) {
      console.error("Exception during sign in:", error);
      setIsLoading(false);
      return { error: error as Error };
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
      setSession(null);
      setUser(null);
      setProfile(null);
      
      console.log("Sign out complete");
      setIsLoading(false);
    } catch (error) {
      console.error("Exception during sign out:", error);
      
      // Still clear local state on error
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false);
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
        refreshProfile,
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
