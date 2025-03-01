
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
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timeout in HRPortal");
        setLoadingTimeout(true);
        setAuthCheckComplete(true);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    if (authReady && !authCheckComplete) {
      console.log("Auth is ready, marking auth check complete");
      setAuthCheckComplete(true);
    }
  }, [authReady, authCheckComplete]);

  useEffect(() => {
    if (processingRedirect) return;
    
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
      
      if (authCheckComplete && !profile && !processingRedirect) {
        console.log("Session exists but no profile yet, checking database");
        setProcessingRedirect(true);
        
        // Fixed Promise handling
        const checkAndCreateProfile = async () => {
          try {
            const { data: profileData, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();
            
            if (error) {
              console.error("Error fetching profile:", error);
              setProcessingRedirect(false);
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
              console.log("No profile found, checking if admin email");
              if (session.user.email === "a.debassi@aftraduction.fr") {
                console.log("Admin email detected, creating HR profile");
                
                const { error: insertError } = await supabase
                  .from("profiles")
                  .insert({
                    id: session.user.id,
                    email: session.user.email,
                    role: "hr" as const,
                    first_name: "",
                    last_name: ""
                  });
                
                if (insertError) {
                  console.error("Error during profile creation:", insertError);
                  setProcessingRedirect(false);
                  return;
                }
                
                navigate('/hr', { replace: true });
              } else {
                console.log("No profile and not admin email, redirecting to employee dashboard");
                navigate('/employee', { replace: true });
              }
            }
          } catch (err) {
            console.error("Exception during profile check:", err);
            setProcessingRedirect(false);
          }
        };
        
        // Execute the async function
        checkAndCreateProfile();
      }
    }
  }, [session, profile, navigate, authCheckComplete, processingRedirect]);

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

  if (manualSignInAttempted || processingRedirect) {
    return (
      <LoadingState 
        message={processingRedirect ? "Vérification de votre profil..." : "Connexion en cours..."}
        disableRefresh={true}
      />
    );
  }

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
