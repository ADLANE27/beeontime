
import { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  const [lastActiveTimestamp, setLastActiveTimestamp] = useState<number>(Date.now());
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // User is leaving the tab
      setLastActiveTimestamp(Date.now());
    } else {
      // User is returning to the tab
      const timeAway = Date.now() - lastActiveTimestamp;
      
      if (timeAway >= SESSION_TIMEOUT && session) {
        console.log("Session expired after inactivity:", timeAway / 1000, "seconds");
        toast.error("Session expirée, veuillez vous reconnecter");
        signOut();
      }
    }
  }, [lastActiveTimestamp, session]);

  // Initialize auth
  const initializeAuth = useCallback(async () => {
    try {
      console.log("AuthProvider: Initializing");
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session initialization error:", sessionError);
        toast.error("Erreur de connexion au service d'authentification");
        return;
      }

      if (initialSession?.user) {
        console.log("Initial session found for user:", initialSession.user.email);
        setSession(initialSession);
        setUser(initialSession.user);
        
        // Check token expiration
        const expiresAt = new Date((initialSession.expires_at ?? 0) * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        if (timeUntilExpiry < 600000) { // Less than 10 minutes until expiry
          console.log("Token expiring soon, refreshing...");
          const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
          if (!error && refreshedSession) {
            setSession(refreshedSession);
            setUser(refreshedSession.user);
          }
        }
      } else {
        console.log("No initial session found");
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      toast.error("Erreur d'initialisation de l'authentification");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle visibility changes
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Handle network status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log("Network is online, reinitializing auth...");
      initializeAuth();
    };

    const handleOffline = () => {
      console.log("Network is offline");
      toast.error("Connexion internet perdue");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initializeAuth]);

  // Initialize auth and set up auth state change listener
  useEffect(() => {
    console.log("AuthProvider: Setting up auth state listener");
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event, currentSession?.user?.email);
      
      switch (event) {
        case 'SIGNED_IN':
          console.log("User signed in:", currentSession?.user?.email);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLastActiveTimestamp(Date.now());
          toast.success("Connexion réussie");
          break;
          
        case 'SIGNED_OUT':
          console.log("User signed out");
          setSession(null);
          setUser(null);
          toast.success("Déconnexion réussie");
          break;
          
        case 'TOKEN_REFRESHED':
          console.log("Token refreshed for user:", currentSession?.user?.email);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLastActiveTimestamp(Date.now());
          break;
          
        case 'USER_UPDATED':
          console.log("User updated:", currentSession?.user?.email);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          break;
          
        case 'INITIAL_SESSION':
          console.log("Initial session received");
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            setLastActiveTimestamp(Date.now());
          }
          break;
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("AuthProvider: Cleaning up auth state listener");
      subscription.unsubscribe();
    };
  }, [initializeAuth]);

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
