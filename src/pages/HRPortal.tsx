
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { LoadingState } from "@/components/auth/LoadingState";
import { LoginForm } from "@/components/auth/LoginForm";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, profile, profileFetchAttempted, authError, authReady } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [manualSignInAttempted, setManualSignInAttempted] = useState(false);
  const [processingRedirect, setProcessingRedirect] = useState(false);

  // Check network status
  useEffect(() => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    
    window.addEventListener('online', () => setNetworkStatus('online'));
    window.addEventListener('offline', () => setNetworkStatus('offline'));

    return () => {
      window.removeEventListener('online', () => setNetworkStatus('online'));
      window.removeEventListener('offline', () => setNetworkStatus('offline'));
    };
  }, []);

  // Set a reasonable timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timeout in HRPortal");
        setLoadingTimeout(true);
        setAuthCheckComplete(true);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Mark auth check complete when authReady
  useEffect(() => {
    if (authReady && !authCheckComplete) {
      console.log("Auth is ready, marking auth check complete");
      setAuthCheckComplete(true);
    }
  }, [authReady, authCheckComplete]);

  // Handle redirect to HR dashboard for authenticated users
  useEffect(() => {
    if (processingRedirect) return;
    
    // Si nous avons une session utilisateur
    if (session?.user) {
      console.log("Session exists, checking for profile", session.user.email);
      
      // Si nous avons un profil
      if (profile) {
        console.log("Profile found with role:", profile.role);
        
        // Vérifier le rôle et rediriger en conséquence
        if (profile.role === "hr") {
          console.log("HR role detected, redirecting to HR dashboard");
          navigate('/hr', { replace: true });
        } else {
          // Si ce n'est pas un admin HR, afficher un message d'erreur et rediriger
          console.log("Employee role detected, redirecting to employee dashboard");
          toast.error("Vous n'avez pas les droits pour accéder à cette page.");
          navigate('/employee', { replace: true });
        }
        return;
      } 
      
      // Si nous avons une session mais pas de profil, vérifier dans la base de données
      if (authCheckComplete && !profile && !processingRedirect) {
        console.log("Session exists but no profile yet, checking database");
        setProcessingRedirect(true);
        
        // Vérifier directement dans la base de données
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data: profileData, error }) => {
            if (error) {
              console.error("Error fetching profile:", error);
              setProcessingRedirect(false);
              return;
            }
            
            if (profileData) {
              console.log("Profile found in database:", profileData);
              // Si le profil existe et a le rôle HR, rediriger vers le dashboard HR
              if (profileData.role === "hr") {
                navigate('/hr', { replace: true });
              } else {
                // Sinon, afficher un message d'erreur et rediriger vers le dashboard employé
                toast.error("Vous n'avez pas les droits pour accéder à cette page.");
                navigate('/employee', { replace: true });
              }
            } else {
              console.log("No profile found, checking if admin email");
              // Si pas de profil mais email d'administrateur connu, créer un profil HR
              if (session.user.email === "a.debassi@aftraduction.fr") {
                console.log("Admin email detected, creating HR profile");
                
                // Create a properly typed Promise that supports .catch
                const insertPromise = supabase
                  .from("profiles")
                  .insert({
                    id: session.user.id,
                    email: session.user.email,
                    role: "hr" as const,  // Ensure correct type
                    first_name: "",
                    last_name: ""
                  });
                
                // Properly handle the Promise chain
                Promise.resolve(insertPromise)
                  .then(() => {
                    navigate('/hr', { replace: true });
                  })
                  .catch((err) => {
                    console.error("Exception during profile creation:", err);
                    setProcessingRedirect(false);
                  });
              } else {
                // Pour tout autre utilisateur sans profil, rediriger vers le dashboard employé
                console.log("No profile and not admin email, redirecting to employee dashboard");
                navigate('/employee', { replace: true });
              }
            }
          })
          .catch(error => {
            console.error("Error during profile check:", error);
            setProcessingRedirect(false);
          });
      }
    }
  }, [session, profile, navigate, authCheckComplete, processingRedirect]);

  // Manual sign-in handler 
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
      // La redirection est gérée par l'effet ci-dessus
    } catch (err) {
      console.error("Exception during sign in:", err);
      setLoginError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
      setManualSignInAttempted(false);
    }
  };

  // Handle network status check
  const handleCheckNetwork = () => {
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');
  };

  // Show loading if manual sign-in attempted or admin profile processing
  if (manualSignInAttempted || processingRedirect) {
    return (
      <LoadingState 
        message={processingRedirect ? "Vérification de votre profil..." : "Connexion en cours..."}
        disableRefresh={true}
      />
    );
  }

  // Show login form
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
