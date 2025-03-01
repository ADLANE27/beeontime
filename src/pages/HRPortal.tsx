
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
  const [manualSignInAttempted, setManualSignInAttempted] = useState(false);

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
    if (session?.user) {
      console.log("Session exists, checking for profile", session.user.email);
      
      if (profile) {
        console.log("Profile found with role:", profile.role);
        
        if (profile.role === "hr") {
          console.log("HR role detected, redirecting to HR dashboard");
          navigate('/hr', { replace: true });
        } else {
          console.log("Employee role detected, redirecting to employee dashboard");
          toast.error("Vous n'avez pas les droits pour accéder à cette page.");
          navigate('/employee', { replace: true });
        }
        return;
      } 
      
      // If we have a session but no profile, do a simple database check
      const checkProfile = async () => {
        try {
          console.log("Checking database for profile");
          
          const { data: profileData, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching profile:", error);
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
        }
      };
      
      checkProfile();
    }
  }, [session, profile, navigate]);

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

  const handleCheckNetwork = () => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  };

  if (manualSignInAttempted) {
    return (
      <LoadingState 
        message="Connexion en cours..."
        disableRefresh={true}
      />
    );
  }

  return (
    <LoginForm
      onSubmit={handleManualSignIn}
      loginError={loginError}
      authError={null}
      isLoading={manualSignInAttempted}
      networkStatus={networkStatus}
      onCheckNetwork={handleCheckNetwork}
    />
  );
};

export default HRPortal;
