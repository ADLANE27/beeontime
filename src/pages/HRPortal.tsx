import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Building2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [isCheckingRole, setIsCheckingRole] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const MAX_VERIFICATION_ATTEMPTS = 3;

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const checkUserRole = async () => {
      if (!session?.user) return;

      try {
        setIsCheckingRole(true);
        console.log("Checking role for user:", session.user.email);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Profile fetch error:", error);
          if (isMounted) {
            toast.error("Erreur lors de la vérification du profil");
            if (verificationAttempts < MAX_VERIFICATION_ATTEMPTS) {
              setVerificationAttempts(prev => prev + 1);
              retryTimeout = setTimeout(checkUserRole, 2000);
            } else {
              toast.error("Impossible de vérifier votre profil. Veuillez réessayer plus tard.");
              await supabase.auth.signOut();
            }
          }
          return;
        }

        if (!isMounted) return;

        console.log("User profile data:", profile);

        if (profile?.role === 'hr') {
          console.log("User has HR role, redirecting to /hr");
          navigate('/hr', { replace: true });
        } else if (profile?.role === 'employee') {
          console.log("User has employee role, redirecting to /employee");
          navigate('/employee', { replace: true });
        } else {
          toast.error("Rôle utilisateur non reconnu");
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error("Role check error:", error);
        if (isMounted) {
          toast.error("Erreur lors de la vérification du rôle");
        }
      } finally {
        if (isMounted) {
          setIsCheckingRole(false);
        }
      }
    };

    if (session?.user && !isCheckingRole) {
      checkUserRole();
    }

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [session, navigate, verificationAttempts]);

  if (isAuthLoading || isCheckingRole) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isAuthLoading ? "Vérification de l'authentification..." : "Vérification du profil..."}
          </p>
          {verificationAttempts > 0 && (
            <p className="text-sm text-muted-foreground">
              Tentative {verificationAttempts}/{MAX_VERIFICATION_ATTEMPTS}
            </p>
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

export default HRPortal;
