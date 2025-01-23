import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { Building2, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const HRPortal = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("rememberMe") === "true";
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error("Erreur lors de la vérification de la session");
        }

        if (session) {
          console.log("Session found, checking user role...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Profile error:", profileError);
            throw new Error("Erreur lors de la vérification du profil");
          }

          console.log("User profile:", profile);
          if (profile?.role === 'hr') {
            console.log("HR role confirmed, redirecting to /hr");
            navigate('/hr', { replace: true });
          } else {
            setError("Vous n'avez pas accès au portail RH");
            setTimeout(() => {
              navigate('/portal', { replace: true });
            }, 2000);
          }
        }
      } catch (err) {
        console.error("Authentication check error:", err);
        const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN') {
        setIsLoading(true);
        try {
          console.log("User signed in, checking role...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session?.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Profile error:", profileError);
            throw new Error("Erreur lors de la vérification du profil");
          }

          // Si "Se souvenir de moi" est activé, sauvegarder les identifiants
          if (rememberMe && session?.user) {
            localStorage.setItem("rememberedEmail", session.user.email || "");
            localStorage.setItem("rememberMe", "true");
          } else {
            localStorage.removeItem("rememberedEmail");
            localStorage.removeItem("rememberMe");
          }

          console.log("User profile after sign in:", profile);
          if (profile?.role === 'hr') {
            console.log("HR role confirmed, redirecting to /hr");
            navigate('/hr', { replace: true });
          } else {
            setError("Vous n'avez pas accès au portail RH");
            setTimeout(() => {
              navigate('/portal', { replace: true });
            }, 2000);
          }
        } catch (err) {
          console.error("Role check error:", err);
          const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      }
    });

    // Pre-fill email if remembered
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      if (emailInput) {
        emailInput.value = rememberedEmail;
      }
    }

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, rememberMe]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
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
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 rounded-lg">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Connexion sécurisée</span>
          </div>

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
                  loading_button_label: 'Connexion en cours...',
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

          <div className="mt-4 flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              checked={rememberMe}
              onCheckedChange={(checked) => {
                setRememberMe(checked === true);
                if (!checked) {
                  localStorage.removeItem("rememberedEmail");
                  localStorage.removeItem("rememberMe");
                }
              }}
            />
            <label 
              htmlFor="rememberMe" 
              className="text-sm text-gray-600 cursor-pointer"
            >
              Se souvenir de moi
            </label>
          </div>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-8">
          © {new Date().getFullYear()} AFTraduction. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default HRPortal;