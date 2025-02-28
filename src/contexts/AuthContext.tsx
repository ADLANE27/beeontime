
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  profile: { role?: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{ role?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const signOut = async () => {
    try {
      console.log("SignOut triggered from AuthContext");
      // First clear all local state
      setSession(null);
      setUser(null);
      setProfile(null);
      
      // Then call Supabase's signOut method
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error during Supabase signOut:", error);
        throw error;
      }
      
      toast.success("Déconnexion réussie");
      
      // Return successfully to inform caller
      return;
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Erreur lors de la déconnexion");
      
      // Re-throw to allow caller to handle
      throw error;
    }
  };

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        console.log("Checking initial session...");
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("Initial session check result:", initialSession ? "Has session" : "No session");
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          // Fetch additional profile data if needed
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', initialSession.user.id)
            .single();
          
          if (profileError) {
            console.error("Error fetching profile:", profileError);
          } else {
            console.log("User profile loaded:", profile);
            setProfile(profile);
          }
        }

        // Mark auth as checked regardless of result
        setAuthChecked(true);
      } catch (error) {
        console.error("Session check error:", error);
        // Still mark auth as checked even on error
        setAuthChecked(true);
      } finally {
        // Always complete loading after a reasonable timeout
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (event === 'SIGNED_IN' && currentSession?.user) {
        toast.success("Connexion réussie");
        
        // Fetch additional profile data if needed
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        } else {
          console.log("User profile loaded:", profile);
          setProfile(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out event received");
      }
      
      // Always update loading state after auth change
      setIsLoading(false);
      setAuthChecked(true);
    });

    // Force timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Auth loading timeout reached, forcing completion");
        setIsLoading(false);
        setAuthChecked(true);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut, profile }}>
      {authChecked || !isLoading ? children : (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Vérification de l'authentification...</p>
          </div>
        </div>
      )}
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
