
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

/**
 * Translates common Supabase auth error messages to French
 */
function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    "Invalid login credentials": "Identifiants de connexion invalides",
    "Email not confirmed": "Adresse email non confirmée",
    "User not found": "Utilisateur non trouvé",
    "Invalid email or password": "Email ou mot de passe invalide",
    "Too many requests": "Trop de tentatives. Veuillez réessayer plus tard",
    "User already registered": "Cet utilisateur est déjà inscrit",
    "Password should be at least 6 characters": "Le mot de passe doit contenir au moins 6 caractères",
    "Network error": "Erreur réseau. Vérifiez votre connexion internet",
  };
  return translations[message] || message;
}

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
        return { error: translateAuthError(error.message) };
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

      if (event === 'TOKEN_REFRESHED') {
        setIsSessionExpired(false);
      } else if (event === 'SIGNED_OUT') {
        setIsSessionExpired(false);
      } else if (currentSession?.expires_at) {
        const expiryTime = new Date(currentSession.expires_at * 1000);
        setIsSessionExpired(expiryTime < new Date());
      } else {
        setIsSessionExpired(false);
      }
    });

    let expiryToastShown = false;
    const checkSessionInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;
      if (currentSession.expires_at) {
        const expiryTime = new Date(currentSession.expires_at * 1000);
        if (expiryTime < new Date() && !expiryToastShown) {
          expiryToastShown = true;
          setIsSessionExpired(true);
          toast.warning("Votre session a expiré. Veuillez vous reconnecter.");
        }
      }
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(checkSessionInterval);
    };
  }, []);

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
