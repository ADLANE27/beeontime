
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
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  // Initialize auth with retry mechanism
  const initializeAuth = useCallback(async (retry = 0) => {
    try {
      console.log(`AuthProvider: Initializing (attempt ${retry + 1})`);
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session initialization error:", sessionError);
        
        if (retry < MAX_RETRIES) {
          console.log(`Retrying initialization in ${RETRY_DELAY}ms...`);
          setTimeout(() => initializeAuth(retry + 1), RETRY_DELAY);
          return;
        }
        
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
      if (retry < MAX_RETRIES) {
        setTimeout(() => initializeAuth(retry + 1), RETRY_DELAY);
        return;
      }
      toast.error("Erreur d'initialisation de l'authentification");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
