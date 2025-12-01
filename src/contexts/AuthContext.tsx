
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: "hr" | "employee" | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  isSessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"hr" | "employee" | null>(null);
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
      setUserRole(null);
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }
      
      return data?.role as "hr" | "employee" | null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      // Fetch user role if session exists
      if (initialSession?.user) {
        const role = await fetchUserRole(initialSession.user.id);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      
      setIsLoading(false);
      
      // Check if session is expired
      if (initialSession?.expires_at) {
        const expiryTime = new Date(initialSession.expires_at * 1000);
        setIsSessionExpired(expiryTime < new Date());
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Fetch user role on auth change
      if (currentSession?.user) {
        const role = await fetchUserRole(currentSession.user.id);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      
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
    <AuthContext.Provider value={{ session, user, userRole, isLoading, signOut, signIn, isSessionExpired }}>
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
