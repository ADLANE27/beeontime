
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
    const checkNetwork = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    // Initial check
    checkNetwork();

    // Add event listeners for online/offline status
    window.addEventListener('online', checkNetwork);
    window.addEventListener('offline', checkNetwork);

    return () => {
      window.removeEventListener('online', checkNetwork);
      window.removeEventListener('offline', checkNetwork);
    };
  }, []);

  // Add timeout to prevent infinite loading - REDUCED TIMEOUT
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timeout detected in HRPortal - shortening timeout to 8 seconds");
        setLoadingTimeout(true);
      }
    }, 8000); // Reduced to 8 seconds timeout (from 12)

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Force auth check complete after authReady is true
  useEffect(() => {
    if (authReady && !authCheckComplete) {
      console.log("Auth is ready, marking auth check complete");
      setAuthCheckComplete(true);
    }
  }, [authReady, authCheckComplete]);

  // Handle authentication redirects
  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout | null = null;

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
        redirectTimeout = setTimeout(() => {
          if (profile.role === "hr") {
            navigate('/hr', { replace: true });
          } else {
            toast.error("Vous n'avez pas les droits pour accéder à cette page.");
            navigate('/employee', { replace: true });
          }
        }, 300); // Short delay to avoid immediate redirect
      } 
      // User is authenticated but no profile found
      else if (session && !profile && profileFetchAttempted) {
        console.log("HR Portal: Session exists but no profile found after fetch attempt");
        setLoginError("Profil utilisateur introuvable. Veuillez contacter l'administrateur.");
        setAuthCheckComplete(true);
      } 
      // User is not authenticated
      else if (!session && canDetermineAuthState) {
        console.log("HR Portal: No session found, user should log in");
        setAuthCheckComplete(true);
      }
    }

    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [session, profile, navigate, authCheckComplete, profileFetchAttempted, authError, loadingTimeout, authReady]);

  // Check for error parameters in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('error')) {
      const errorDescription = url.searchParams.get('error_description');
      
      if (errorDescription?.includes("Invalid login credentials")) {
        setLoginError("Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.");
      } else if (errorDescription?.includes("Email not confirmed")) {
        setLoginError("Votre email n'a pas été confirmé. Veuillez vérifier votre boîte mail.");
      } else {
        setLoginError(`Erreur de connexion: ${errorDescription || "Connexion invalide"}`);
      }
      
      // Remove error params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Display auth errors from auth state
  useEffect(() => {
    if (authError && !loginError) {
      setLoginError(`Problème d'authentification: ${authError.message}`);
    }
  }, [authError, loginError]);

  // Manual sign-in handler to provide better error feedback
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

  // Show clear loading state during authentication check
  if ((!authCheckComplete && isLoading && !loadingTimeout) || manualSignInAttempted) {
    return (
      <LoadingState 
        message="Vérification de votre session..."
        subMessage={session ? "Récupération du profil..." : "Chargement de l'authentification..."}
        onRefresh={handleManualRefresh}
        disableRefresh={manualSignInAttempted}
      />
    );
  }

  // Loading timeout detected
  if (loadingTimeout && !authCheckComplete) {
    return (
      <TimeoutError 
        onRefresh={handleManualRefresh}
        onSignOut={handleSignOut}
        hasSession={!!session}
      />
    );
  }

  // If we have a session but profile fetch failed
  if (session && !profile && profileFetchAttempted) {
    return (
      <ProfileError 
        onRefresh={handleManualRefresh}
        onSignOut={handleSignOut}
      />
    );
  }

  // Main login form
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
