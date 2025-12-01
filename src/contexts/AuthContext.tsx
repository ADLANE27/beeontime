
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  isSessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Authentication error:", error.message);
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Unexpected authentication error:", error);
      return { error: "Une erreur inattendue s'est produite. Veuillez réessayer." };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
      
      // Check if session is expired
      if (initialSession?.expires_at) {
        const expiryTime = new Date(initialSession.expires_at * 1000);
        setIsSessionExpired(expiryTime < new Date());
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
      
      // Check session expiry on auth state change
      if (currentSession?.expires_at) {
        const expiryTime = new Date(currentSession.expires_at * 1000);
        setIsSessionExpired(expiryTime < new Date());
      } else {
        setIsSessionExpired(false);
      }
      
      // Handle session expiry
      if (event === 'TOKEN_REFRESHED') {
        setIsSessionExpired(false);
      }
    });

    // Set a timer to check session expiry periodically
    const checkSessionInterval = setInterval(() => {
      if (session?.expires_at) {
        const expiryTime = new Date(session.expires_at * 1000);
        if (expiryTime < new Date()) {
          setIsSessionExpired(true);
          toast.warning("Votre session a expiré. Veuillez vous reconnecter.");
        }
      }
    }, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(checkSessionInterval);
    };
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut, signIn, isSessionExpired }}>
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
