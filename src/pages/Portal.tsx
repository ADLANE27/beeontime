import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const Portal = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoading(true);
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) throw profileError;

          if (profile?.role === 'employee') {
            navigate('/employee', { replace: true });
          } else if (profile?.role === 'hr') {
            navigate('/hr-portal', { replace: true });
          }
        } catch (err) {
          console.error("Profile check error:", err);
          const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
          toast.error(errorMessage);
          await supabase.auth.signOut();
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-6">
          <div className="bg-primary/5 p-3 rounded-full">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          
          <img 
            src="/lovable-uploads/ebd70f88-aacb-40cd-b225-d94a0c0f1903.png" 
            alt="AFTraduction Logo" 
            className="h-16 w-auto"
          />
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Portail Employé</h1>
            <p className="text-sm text-gray-600">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>
        </div>

        <div className="mt-8">
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
                  button_label: isLoading ? 'Connexion en cours...' : 'Se connecter',
                  loading_button_label: 'Connexion en cours...',
                  email_input_placeholder: 'Votre adresse email',
                  password_input_placeholder: 'Votre mot de passe'
                }
              }
            }}
            theme="light"
            providers={[]}
            redirectTo={window.location.origin}
            onlyThirdPartyProviders={false}
            magicLink={false}
            showLinks={false}
            view="sign_in"
          />
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
          © {new Date().getFullYear()} AFTraduction. Tous droits réservés.
        </p>
      </Card>
    </div>
  );
};

export default Portal;