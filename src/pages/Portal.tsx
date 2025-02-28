
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Building2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Portal = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (session?.user) {
      navigate('/employee', { replace: true });
    }

    // Listen for auth errors
    const handleAuthStateChange = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/employee', { replace: true });
      }
    });

    // Clean up listener
    return () => {
      handleAuthStateChange.data.subscription.unsubscribe();
    };
  }, [session, navigate]);

  useEffect(() => {
    // Set up a listener for auth errors
    const { data } = supabase.auth.onAuthStateChange((event, _session) => {
      console.log("Auth state event:", event);
      
      if (event === 'SIGNED_OUT') {
        setLoginError("Vous avez été déconnecté. Veuillez vous reconnecter.");
      } else if (event === 'USER_UPDATED') {
        setLoginError("");
      }
    });

    // Set up a listener for auth errors
    const authListener = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'SIGNED_OUT') {
        setLoginError("Vous avez été déconnecté. Veuillez vous reconnecter.");
      } else if (event === 'USER_UPDATED') {
        setLoginError("");
      }
    });

    // Listen for errors in the URL
    const checkForErrors = () => {
      const url = new URL(window.location.href);
      const errorParam = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');
      
      if (errorParam) {
        if (errorDescription?.includes("Invalid login credentials")) {
          setLoginError("Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.");
        } else if (errorDescription?.includes("Email not confirmed")) {
          setLoginError("Votre email n'a pas été confirmé. Veuillez vérifier votre boîte mail.");
        } else {
          setLoginError(`Erreur de connexion: ${errorDescription}`);
        }
        
        // Remove error params from URL to avoid showing error again on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    checkForErrors();

    return () => {
      data.subscription.unsubscribe();
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Portail Employé</h1>
          <p className="text-sm text-gray-600 text-center">
            Connectez-vous pour accéder à votre espace
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

export default Portal;
