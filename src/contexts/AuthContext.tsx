
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const LOCAL_STORAGE_KEYS = {
  LAST_ACTIVE: 'auth_last_active',
  SESSION_ID: 'auth_session_id',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionCheckInterval = useRef<NodeJS.Timeout>();
  const refreshRetryCount = useRef(0);
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const MAX_REFRESH_RETRIES = 3;
  const REFRESH_RETRY_DELAY = 1000; // Start with 1 second
  const SESSION_CHECK_INTERVAL = 60 * 1000; // Check session every minute

  // Get a unique ID for this tab
  const tabId = useRef<string>(crypto.randomUUID());

  const getLastActiveTimestamp = useCallback((): number => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_ACTIVE);
    return stored ? parseInt(stored, 10) : Date.now();
  }, []);

  const updateLastActiveTimestamp = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_ACTIVE, now.toString());
    localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION_ID, tabId.current);
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      updateLastActiveTimestamp();
    } else {
      const lastActive = getLastActiveTimestamp();
      const timeAway = Date.now() - lastActive;
      
      if (timeAway >= SESSION_TIMEOUT && session) {
        console.log("Session expired after inactivity:", timeAway / 1000, "seconds");
        toast.error("Session expirée, veuillez vous reconnecter");
        signOut();
      } else {
        // Reset timestamp only if we're still within session timeout
        updateLastActiveTimestamp();
      }
    }
  }, [session, getLastActiveTimestamp, updateLastActiveTimestamp]);

  const refreshSession = useCallback(async (retryCount = 0): Promise<boolean> => {
    try {
      console.log("Attempting to refresh session, attempt:", retryCount + 1);
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Session refresh error:", error);
        
        if (retryCount < MAX_REFRESH_RETRIES) {
          const delay = REFRESH_RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Retrying refresh in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return refreshSession(retryCount + 1);
        }
        
        toast.error("Erreur de rafraîchissement de la session");
        return false;
      }

      if (refreshedSession) {
        console.log("Session refreshed successfully");
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        updateLastActiveTimestamp();
        refreshRetryCount.current = 0;
        return true;
      }

      return false;
    } catch (error) {
      console.error("Session refresh error:", error);
      toast.error("Erreur de rafraîchissement de la session");
      return false;
    }
  }, [updateLastActiveTimestamp]);

  const validateSession = useCallback(async () => {
    if (!session) return;

    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error || !currentSession) {
        console.log("Session validation failed:", error);
        signOut();
        return;
      }

      const expiresAt = new Date((currentSession.expires_at ?? 0) * 1000);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      if (timeUntilExpiry < 600000) { // Less than 10 minutes until expiry
        await refreshSession();
      }
    } catch (error) {
      console.error("Session validation error:", error);
    }
  }, [session, refreshSession]);

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
        updateLastActiveTimestamp();
        
        // Validate the session immediately
        await validateSession();
      } else {
        console.log("No initial session found");
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      toast.error("Erreur d'initialisation de l'authentification");
    } finally {
      setIsLoading(false);
    }
  }, [validateSession, updateLastActiveTimestamp]);

  // Handle visibility changes
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // Setup periodic session validation
  useEffect(() => {
    if (session) {
      sessionCheckInterval.current = setInterval(validateSession, SESSION_CHECK_INTERVAL);
    }

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [session, validateSession]);

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

  // Handle storage changes for cross-tab communication
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEYS.SESSION_ID && e.newValue !== tabId.current) {
        // Another tab has become active
        console.log("Session managed by another tab");
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
          updateLastActiveTimestamp();
          toast.success("Connexion réussie");
          break;
          
        case 'SIGNED_OUT':
          console.log("User signed out");
          setSession(null);
          setUser(null);
          localStorage.removeItem(LOCAL_STORAGE_KEYS.LAST_ACTIVE);
          localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION_ID);
          toast.success("Déconnexion réussie");
          break;
          
        case 'TOKEN_REFRESHED':
          console.log("Token refreshed for user:", currentSession?.user?.email);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          updateLastActiveTimestamp();
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
            updateLastActiveTimestamp();
          }
          break;
      }
      
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("AuthProvider: Cleaning up auth state listener");
      subscription.unsubscribe();
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [initializeAuth, updateLastActiveTimestamp]);

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
