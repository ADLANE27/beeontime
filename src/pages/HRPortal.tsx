
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { LoadingState } from "@/components/auth/LoadingState";
import { LoginForm } from "@/components/auth/LoginForm";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, profile, authReady } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [authInProgress, setAuthInProgress] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("HRPortal state:", { 
      hasSession: !!session, 
      isLoading, 
      hasProfile: !!profile, 
      authReady,
      profileRole: profile?.role 
    });
  }, [session, isLoading, profile, authReady]);

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };
    
    updateNetworkStatus(); // Initial check
    
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Handle redirection based on auth state
  useEffect(() => {
    // Skip if still loading initial auth state
    if (!authReady) {
      console.log("Auth not ready yet, waiting...");
      return;
    }
    
    // If no session, show login form
    if (!session) {
      console.log("No active session, showing login form");
      setAuthInProgress(false);
      return;
    }

    console.log("Session exists, checking profile for HR role");
    
    // If we already have a profile in context, use it for redirection
    if (profile) {
      console.log("Profile found in context with role:", profile.role);
      if (profile.role === "hr") {
        navigate('/hr', { replace: true });
      } else {
        toast.error("Vous n'avez pas les droits pour accéder à cette page.");
        navigate('/employee', { replace: true });
      }
      return;
    }
    
    // If no profile yet, fetch it from the database
    const checkAndRedirect = async () => {
      try {
        setAuthInProgress(true);
        
        console.log("Fetching profile from database for user:", session.user.id);
        
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Erreur lors de la récupération du profil.");
          setAuthInProgress(false);
          return;
        }
        
        if (profileData) {
          console.log("Profile found in database:", profileData);
          
          if (profileData.role === "hr") {
            console.log("User has HR role, redirecting to HR dashboard");
            navigate('/hr', { replace: true });
          } else {
            console.log("User does not have HR role, redirecting to employee dashboard");
            toast.error("Vous n'avez pas les droits pour accéder à cette page.");
            navigate('/employee', { replace: true });
          }
        } else {
          console.log("No profile found, redirecting to employee dashboard");
          toast.error("Profil non trouvé. Contactez l'administrateur.");
          navigate('/employee', { replace: true });
        }
      } catch (err) {
        console.error("Exception during profile check:", err);
        toast.error("Une erreur est survenue lors de la vérification du profil.");
        setAuthInProgress(false);
      }
    };
    
    checkAndRedirect();
  }, [session, profile, navigate, authReady]);

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
      setAuthInProgress(true);
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
        setAuthInProgress(false);
      }
      // Redirection will happen via the useEffect
    } catch (err) {
      console.error("Exception during sign in:", err);
      setLoginError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
      setAuthInProgress(false);
    }
  };

  const handleCheckNetwork = () => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  };

  // Show login form if not authenticated and not loading
  if (!session && !isLoading && !authInProgress && authReady) {
    return (
      <LoginForm
        onSubmit={handleManualSignIn}
        loginError={loginError}
        authError={null}
        isLoading={authInProgress}
        networkStatus={networkStatus}
        onCheckNetwork={handleCheckNetwork}
      />
    );
  }

  // Show loading state for any pending operation
  return (
    <LoadingState 
      message={
        authInProgress 
          ? "Connexion en cours..." 
          : (session ? "Redirection vers votre espace..." : "Vérification de l'authentification...")
      }
      disableRefresh={true}
    />
  );
};

export default HRPortal;
