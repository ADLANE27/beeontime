
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Building2, Lock, Loader2, WifiOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, profile, authReady, profileFetchAttempted } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

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

  // Handle authentication redirects
  useEffect(() => {
    if (!authReady) return;
    
    if (session && profile) {
      console.log("HR Portal: Session and profile found, checking role", profile.role);
      if (profile.role === "hr") {
        navigate('/hr', { replace: true });
      } else {
        toast.error("Vous n'avez pas les droits pour accéder à cette page.");
        navigate('/employee', { replace: true });
      }
    } else if (session && !profile && profileFetchAttempted) {
      console.log("HR Portal: Session exists but no profile found after fetch attempt");
      setLoginError("Profil utilisateur introuvable. Veuillez contacter l'administrateur.");
    } else if (!session && authReady) {
      console.log("HR Portal: No session found, user should log in");
      setAuthCheckComplete(true);
    }
  }, [session, profile, navigate, authReady, profileFetchAttempted]);

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
      setLoginError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Sign in error:", error.message);
        if (error.message.includes("Invalid login credentials")) {
          setLoginError("Email ou mot de passe incorrect.");
        } else {
          setLoginError(`Erreur de connexion: ${error.message}`);
        }
      }
    } catch (err) {
      console.error("Exception during sign in:", err);
      setLoginError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
    }
  };

  // Show clear loading state during authentication check
  if (!authCheckComplete && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Vérification de votre session...</p>
        </div>
      </div>
    );
  }

  // If we have a session but profile fetch failed
  if (session && !profile && profileFetchAttempted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h1 className="text-2xl font-bold">Profil non disponible</h1>
            <p className="text-gray-600">
              Votre session est active, mais nous n'avons pas pu récupérer votre profil utilisateur.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={() => window.location.reload()}
            >
              Rafraîchir la page
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
            >
              Se déconnecter
            </Button>
          </div>
        </Card>
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
          {networkStatus === 'offline' && (
            <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
              <WifiOff className="h-4 w-4 text-amber-500" />
              <AlertTitle>Connexion limitée</AlertTitle>
              <AlertDescription>
                Vous semblez être hors ligne. La connexion pourrait échouer.
              </AlertDescription>
            </Alert>
          )}
          
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

          {networkStatus === 'offline' && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => setNetworkStatus(navigator.onLine ? 'online' : 'offline')}
              >
                Vérifier la connexion
              </Button>
            </div>
          )}
        </Card>

        <p className="text-center text-sm text-gray-600 mt-8">
          © {new Date().getFullYear()} AFTraduction. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default HRPortal;
