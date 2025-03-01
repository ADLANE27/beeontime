
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { LoadingState } from "@/components/auth/LoadingState";
import { LoginForm } from "@/components/auth/LoginForm";

// Simplified admin profile check to avoid infinite loops
async function checkAdminProfile(userId: string, email: string) {
  console.log("Quick check for admin profile:", email);
  
  // Check if profile exists
  const { data: existingProfile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
    
  if (error) {
    console.error("Error checking admin profile:", error);
    return false;
  }
  
  // If admin email, ensure HR role and redirect
  if (email === "a.debassi@aftraduction.fr") {
    if (!existingProfile) {
      // Create profile if it doesn't exist
      console.log("Creating HR profile for admin email");
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: email,
          role: "hr",
          first_name: "",
          last_name: ""
        });
      
      if (insertError) {
        console.error("Failed to create HR profile:", insertError);
        return false;
      }
    } else if (existingProfile.role !== "hr") {
      // Update to HR role if needed
      console.log("Updating profile to HR role");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: "hr" })
        .eq("id", userId);
        
      if (updateError) {
        console.error("Failed to update profile to HR:", updateError);
        return false;
      }
    }
    
    return true;
  }
  
  return existingProfile?.role === "hr";
}

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
    
    if (session?.user) {
      console.log("Session exists, checking admin access", session.user.email);
      
      if (session.user.email === "a.debassi@aftraduction.fr") {
        // Special direct handling for known admin
        console.log("Admin user detected, redirecting immediately");
        setProcessingRedirect(true);
        
        // Fast path for known admin
        checkAdminProfile(session.user.id, session.user.email)
          .then(() => {
            navigate('/hr', { replace: true });
          })
          .catch(err => {
            console.error("Error during redirect:", err);
            setProcessingRedirect(false);
          });
          
        return;
      }
      
      // Normal flow for other users with profiles
      if (profile) {
        console.log("Profile found with role:", profile.role);
        if (profile.role === "hr") {
          navigate('/hr', { replace: true });
        } else {
          toast.error("Vous n'avez pas les droits pour accéder à cette page.");
          navigate('/employee', { replace: true });
        }
        return;
      }
      
      // If we have a session but no profile, check admin status one last time
      if (authCheckComplete && !profile && !processingRedirect) {
        console.log("Session exists but no profile, attempting admin check");
        
        // Quick check for admin profile
        checkAdminProfile(session.user.id, session.user.email || "")
          .then(isAdmin => {
            if (isAdmin) {
              navigate('/hr', { replace: true });
            } else {
              navigate('/employee', { replace: true });
            }
          })
          .catch(error => {
            console.error("Admin check failed:", error);
            navigate('/employee', { replace: true });
          });
      }
    }
  }, [session, profile, navigate, authCheckComplete, processingRedirect]);

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
      } else {
        // Special case for admin - immediately redirect
        if (email === "a.debassi@aftraduction.fr") {
          console.log("Admin login successful, redirecting to HR dashboard");
          window.location.href = '/hr';
        }
      }
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
        message={processingRedirect ? "Redirection vers le portail RH..." : "Connexion en cours..."}
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
