
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { LoadingState } from "@/components/auth/LoadingState";
import { TimeoutError } from "@/components/auth/TimeoutError";
import { ProfileError } from "@/components/auth/ProfileError";
import { LoginForm } from "@/components/auth/LoginForm";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, profile, profileFetchAttempted, authError, authReady } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [manualSignInAttempted, setManualSignInAttempted] = useState(false);

  // Check network status
  useEffect(() => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    // Add event listeners for online/offline status
    window.addEventListener('online', () => setNetworkStatus('online'));
    window.addEventListener('offline', () => setNetworkStatus('offline'));

    return () => {
      window.removeEventListener('online', () => setNetworkStatus('online'));
      window.removeEventListener('offline', () => setNetworkStatus('offline'));
    };
  }, []);

  // Add a very short timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timeout detected in HRPortal - shortening timeout");
        setLoadingTimeout(true);
        setAuthCheckComplete(true); // Force completion after timeout
      }
    }, 2000); // Reduced to 2 seconds timeout

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Force auth check complete immediately after authReady
  useEffect(() => {
    if (authReady && !authCheckComplete) {
      console.log("Auth is ready, marking auth check complete");
      setAuthCheckComplete(true);
    }
  }, [authReady, authCheckComplete]);

  // Handle authentication redirects - more aggressive
  useEffect(() => {
    // Check if we can determine authentication state
    const canDetermineAuthState = authCheckComplete || authError || loadingTimeout || authReady;
    
    console.log("Auth state check:", {
      canDetermineAuthState,
      authCheckComplete,
      authReady,
      hasSession: !!session,
      hasProfile: !!profile,
      profileFetchAttempted,
      loadingTimeout
    });
    
    if (canDetermineAuthState) {
      // User is authenticated and has a profile
      if (session && profile) {
        console.log("HR Portal: Session and profile found, checking role", profile.role);
        // Immediate redirect without setTimeout
        if (profile.role === "hr") {
          navigate('/hr', { replace: true });
        } else {
          toast.error("Vous n'avez pas les droits pour accéder à cette page.");
          navigate('/employee', { replace: true });
        }
      } 
      // Bypass profile check if we have session but no profile
      else if (session) {
        console.log("HR Portal: Session exists but no profile found - redirecting to employee view");
        navigate('/employee', { replace: true });
      }
      // User is not authenticated
      else if (!session && canDetermineAuthState) {
        console.log("HR Portal: No session found, user should log in");
        setAuthCheckComplete(true);
      }
    }
  }, [session, profile, navigate, authCheckComplete, profileFetchAttempted, authError, loadingTimeout, authReady]);

  // Manual sign-in handler with faster processing
  const handleManualSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!email || !password) {
      setLoginError("Veuillez remplir tous les champs.");
      return;
    }
    
    try {
      setManualSignInAttempted(true);
      setLoginError(null);
      
      console.log("Attempting manual sign in for:", email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Sign in error:", error.message);
        if (error.message.includes("Invalid login credentials")) {
          setLoginError("Email ou mot de passe incorrect.");
        } else {
          setLoginError(`Erreur de connexion: ${error.message}`);
        }
        setManualSignInAttempted(false);
      }
    } catch (err) {
      console.error("Exception during sign in:", err);
      setLoginError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
      setManualSignInAttempted(false);
    }
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    window.location.reload();
  };

  // Handle manual sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erreur lors de la déconnexion. Veuillez rafraîchir la page.");
    }
  };

  // Handle network status check
  const handleCheckNetwork = () => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  };

  // Show minimal loading state only during actual sign-in attempts
  if (manualSignInAttempted) {
    return (
      <LoadingState 
        message="Connexion en cours..."
        disableRefresh={true}
      />
    );
  }

  // Skip most loading conditions and go straight to login form
  return (
    <LoginForm
      onSubmit={handleManualSignIn}
      loginError={loginError}
      authError={authError}
      isLoading={manualSignInAttempted}
      networkStatus={networkStatus}
      onCheckNetwork={handleCheckNetwork}
    />
  );
};

export default HRPortal;
