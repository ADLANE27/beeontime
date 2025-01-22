import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError } from "@supabase/supabase-js";

const HRPortal = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Vérification de l'accès RH...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Erreur de session:", sessionError);
          setError("Erreur lors de la vérification de l'authentification");
          return;
        }

        if (session) {
          console.log("Session trouvée, vérification du rôle...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error("Erreur de profil:", profileError);
            setError("Erreur lors de la vérification du rôle utilisateur");
            return;
          }

          console.log("Rôle du profil:", profile?.role);
          if (profile?.role === 'hr') {
            console.log("Rôle RH confirmé, redirection vers /hr");
            navigate('/hr');
          } else {
            console.log("Pas de rôle RH, redirection vers /");
            navigate('/');
          }
        } else {
          console.log("Pas de session active");
        }
      } catch (err) {
        console.error("Erreur inattendue:", err);
        setError("Une erreur inattendue s'est produite lors de la vérification de vos droits d'accès");
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Changement d'état d'authentification:", event);
      
      if (event === 'SIGNED_IN') {
        try {
          console.log("Utilisateur connecté, vérification du rôle...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session?.user.id)
            .single();

          if (profileError) {
            console.error("Erreur de profil après connexion:", profileError);
            setError("Erreur lors de la vérification du rôle utilisateur");
            return;
          }

          console.log("Rôle du profil après connexion:", profile?.role);
          if (profile?.role === 'hr') {
            console.log("Rôle RH confirmé après connexion, redirection vers /hr");
            navigate('/hr');
          } else {
            console.log("Pas de rôle RH après connexion, redirection vers /");
            navigate('/');
          }
        } catch (err) {
          console.error("Erreur lors de la vérification du rôle:", err);
          setError("Erreur lors de la vérification du rôle utilisateur");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const getErrorMessage = (error: AuthError) => {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Email ou mot de passe incorrect';
      case 'Email not confirmed':
        return 'Veuillez confirmer votre email avant de vous connecter';
      case 'Invalid email or password':
        return 'Email ou mot de passe invalide';
      default:
        return error.message;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/ebd70f88-aacb-40cd-b225-d94a0c0f1903.png" 
            alt="AFTraduction Logo" 
            className="h-16 w-auto"
          />
        </div>
        <h1 className="text-2xl font-bold text-center mb-8">Portail RH</h1>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
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
                  brandAccent: '#1E293B'
                }
              }
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
          redirectTo={window.location.origin + '/hr'}
          showLinks={false}
        />
      </Card>
    </div>
  );
};

export default HRPortal;