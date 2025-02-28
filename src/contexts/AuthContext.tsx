import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Initializing");
    
    const initializeAuth = async () => {
      try {
        console.log("AuthProvider: Getting initial session");
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session initialization error:", sessionError);
          toast.error("Erreur d'initialisation de la session");
          return;
        }

        if (initialSession?.user) {
          console.log("Initial session found for user:", initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user);
        } else {
          console.log("No initial session found");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        toast.error("Erreur d'initialisation de l'authentification");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.email);
      
      if (event === 'SIGNED_IN') {
        console.log("User signed in:", currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        toast.success("Connexion réussie");
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
        setSession(null);
        setUser(null);
        toast.success("Déconnexion réussie");
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("Token refreshed for user:", currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } else if (event === 'USER_UPDATED') {
        console.log("User updated:", currentSession?.user?.email);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log("AuthProvider: Cleaning up");
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("Signing out user");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
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