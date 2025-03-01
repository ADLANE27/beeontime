
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { LoadingState } from "@/components/auth/LoadingState";
import { LoginForm } from "@/components/auth/LoginForm";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, profile } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [authInProgress, setAuthInProgress] = useState(false);

  useEffect(() => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    window.addEventListener('online', () => setNetworkStatus('online'));
    window.addEventListener('offline', () => setNetworkStatus('offline'));

    return () => {
      window.removeEventListener('online', () => setNetworkStatus('online'));
      window.removeEventListener('offline', () => setNetworkStatus('offline'));
    };
  }, []);

  useEffect(() => {
    // Skip if auth is in progress or no session exists
    if (authInProgress || !session?.user) return;

    console.log("Session exists, checking profile for role", session.user.email);
    
    // If we have profile from context, use it directly
    if (profile) {
      console.log("Profile found in context with role:", profile.role);
      
      if (profile.role === "hr") {
        console.log("HR role detected, redirecting to HR dashboard");
        navigate('/hr', { replace: true });
      } else {
        console.log("Non-HR role detected, redirecting to employee dashboard");
        toast.error("Vous n'avez pas les droits pour accéder à cette page.");
        navigate('/employee', { replace: true });
      }
    } else {
      // If no profile in context, check database directly
      const checkProfileInDB = async () => {
        try {
          console.log("Checking database for profile");
          
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching profile:", error);
            toast.error("Erreur lors de la récupération du profil.");
            return;
          }
          
          if (profileData) {
            console.log("Profile found in database:", profileData);
            if (profileData.role === "hr") {
              navigate('/hr', { replace: true });
            } else {
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
        } finally {
          setAuthInProgress(false);
        }
      };
      
      checkProfileInDB();
    }
  }, [session, profile, navigate, authInProgress]);

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
      // Don't reset authInProgress on success - let the profile check complete first
    } catch (err) {
      console.error("Exception during sign in:", err);
      setLoginError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
      setAuthInProgress(false);
    }
  };

  const handleCheckNetwork = () => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  };

  // Show loading state when auth is in progress
  if (authInProgress) {
    return (
      <LoadingState 
        message="Connexion en cours..."
        disableRefresh={true}
      />
    );
  }

  // Show loading state when auth context is loading
  if (isLoading) {
    return (
      <LoadingState 
        message="Vérification de l'authentification..."
        disableRefresh={true}
      />
    );
  }

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
};

export default HRPortal;
