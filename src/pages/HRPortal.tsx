
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Building2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, profile, profileFetchAttempted, authReady, signOut } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const [timeoutExceeded, setTimeoutExceeded] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("HRPortal: Auth state:", {
      isLoading,
      authReady,
      hasSession: !!session,
      profileRole: profile?.role,
      profileFetchAttempted,
      redirectInProgress,
      timeoutExceeded
    });
  }, [isLoading, session, profile, profileFetchAttempted, authReady, redirectInProgress, timeoutExceeded]);

  // Manual timeout for handling potential deadlocks
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if ((isLoading || localLoading) && !timeoutExceeded) {
      timeoutId = window.setTimeout(() => {
        console.log("Loading timeout reached, forcing state reset");
        setTimeoutExceeded(true);
        setLocalLoading(false);
      }, 7000);
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isLoading, localLoading, timeoutExceeded]);

  // Main auth redirect logic
  useEffect(() => {
    // Only proceed if we're not already processing a redirect
    if (redirectInProgress) {
      return;
    }

    // Clear timeout flag if auth state changes
    if (!isLoading && timeoutExceeded) {
      setTimeoutExceeded(false);
    }

    // Case 1: User is authenticated and has HR profile
    if (!isLoading && session?.user && profile?.role === "hr") {
      console.log("User is HR, redirecting to HR dashboard");
      setRedirectInProgress(true);
      navigate('/hr', { replace: true });
      return;
    }
    
    // Case 2: User is authenticated but doesn't have HR role
    if (!isLoading && session?.user && profile && profile.role !== "hr") {
      console.log("User is not HR, redirecting to employee dashboard");
      setRedirectInProgress(true);
      toast.error("Vous n'avez pas les droits pour accéder à cette page.");
      navigate('/employee', { replace: true });
      return;
    }
    
    // Case 3: Profile fetch was attempted but no profile found
    if (!isLoading && session?.user && !profile && profileFetchAttempted && !loginError) {
      setLoginError("Impossible de récupérer votre profil. Veuillez contacter un administrateur.");
    }

    // Case 4: Auth is ready but still getting loading issues (potential deadlock)
    if (timeoutExceeded && session) {
      console.log("Timeout exceeded with session, attempting force reset");
      // Force sign out to reset state completely
      setLoginError("Problème de chargement du profil. Merci de vous reconnecter.");
      signOut().catch(console.error);
      setRedirectInProgress(false);
      setLocalLoading(false);
      setTimeoutExceeded(false);
    }
  }, [
    session, 
    profile, 
    navigate, 
    redirectInProgress, 
    profileFetchAttempted, 
    loginError, 
    isLoading, 
    authReady, 
    timeoutExceeded,
    signOut
  ]);

  // Clean URL from error parameters and set error message
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('error') || url.searchParams.has('error_description')) {
      const errorParam = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');
      
      if (errorDescription?.includes("Invalid login credentials")) {
        setLoginError("Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.");
      } else if (errorDescription?.includes("Email not confirmed")) {
        setLoginError("Votre email n'a pas été confirmé. Veuillez vérifier votre boîte mail.");
      } else if (errorParam) {
        setLoginError(`Erreur de connexion: ${errorDescription || errorParam}`);
      }
      
      // Remove error params from URL to avoid showing error again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Listen for auth events
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state event in HRPortal:", event);
      console.log("HRPortal: session state:", session ? "Logged in" : "Not logged in");
      
      if (event === 'USER_UPDATED' || event === 'SIGNED_IN') {
        if (session) {
          setLocalLoading(true);
          // Navigation will be handled by the first useEffect when profile is loaded
        }
      } else if (event === 'SIGNED_OUT') {
        setLoginError("Vous avez été déconnecté. Veuillez vous reconnecter.");
        setRedirectInProgress(false);
        setLocalLoading(false);
        setTimeoutExceeded(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleManualReset = () => {
    console.log("Manual reset triggered");
    setLocalLoading(false);
    setRedirectInProgress(false);
    setTimeoutExceeded(false);
    // Force reload the page to reset all state
    window.location.reload();
  };

  if (isLoading || localLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
          <Button 
            onClick={handleManualReset} 
            variant="link"
            className="text-sm text-primary hover:underline mt-2"
          >
            Cliquez ici si le chargement persiste
          </Button>
          
          {timeoutExceeded && (
            <div className="mt-4">
              <Alert variant="destructive" className="max-w-md mx-auto">
                <AlertDescription>
                  Le chargement prend plus de temps que prévu. Vous pouvez essayer de vous reconnecter.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => signOut().catch(console.error)} 
                variant="destructive"
                size="sm"
                className="mt-4"
              >
                Se déconnecter et réessayer
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-3 rounded-full shadow-sm">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <img 
            src="/lovable-uploads/ebd70f88-aacb-40cd-b225-d94a0c0f1903.png" 
            alt="AFTraduction Logo" 
            className="h-16 w-auto"
          />
          <h1 className="text-2xl font-bold text-gray-900">Portail RH</h1>
          <p className="text-sm text-gray-600 text-center">
            Connectez-vous pour accéder à l'espace RH
          </p>
        </div>

        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 rounded-lg">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Connexion sécurisée</span>
          </div>

          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#0F172A',
                    brandAccent: '#1E293B',
                    inputBackground: 'white',
                    inputText: '#0F172A',
                    inputBorder: '#E2E8F0',
                    inputBorderHover: '#CBD5E1',
                    inputBorderFocus: '#0F172A',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    buttonBorderRadius: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                }
              },
              className: {
                container: 'space-y-4',
                button: 'bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg w-full transition-colors',
                input: 'bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg w-full',
                label: 'text-sm font-medium text-gray-700',
                message: 'text-sm text-red-600'
              }
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Adresse email',
                  password_label: 'Mot de passe',
                  button_label: 'Se connecter',
                  loading_button_label: 'Vérification...',
                  email_input_placeholder: 'Votre adresse email',
                  password_input_placeholder: 'Votre mot de passe'
                }
              }
            }}
            theme="light"
            providers={[]}
            redirectTo={window.location.origin}
            showLinks={false}
            view="sign_in"
            magicLink={false}
          />
        </Card>

        <p className="text-center text-sm text-gray-600 mt-8">
          © {new Date().getFullYear()} AFTraduction. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default HRPortal;
