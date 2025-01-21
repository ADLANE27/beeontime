import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const HRPortal = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking HR access...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError("Erreur lors de la vérification de l'authentification. Veuillez réessayer.");
          setIsLoading(false);
          return;
        }

        if (session) {
          console.log("Session found, checking role...");
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.error("Profile error:", profileError);
              setError("Erreur lors de la vérification du rôle utilisateur. Veuillez réessayer.");
              setIsLoading(false);
              return;
            }

            console.log("Profile role:", profile?.role);
            if (profile?.role === 'hr') {
              console.log("HR role confirmed, redirecting to /hr");
              navigate('/hr', { replace: true });
            } else if (profile?.role === 'employee') {
              console.log("Employee role detected, redirecting to employee portal");
              setError("Vous n'avez pas accès au portail RH. Redirection vers le portail employé...");
              setIsLoading(false);
              setTimeout(() => {
                navigate('/portal', { replace: true });
              }, 2000);
            }
          } catch (err) {
            console.error("Error during role check:", err);
            setError("Une erreur est survenue lors de la vérification de vos droits d'accès. Veuillez réessayer.");
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_IN') {
        try {
          console.log("User signed in, checking role...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session?.user.id)
            .single();

          if (profileError) {
            console.error("Profile error:", profileError);
            setError("Erreur lors de la vérification du rôle utilisateur");
            setIsLoading(false);
            return;
          }

          console.log("Profile role after sign in:", profile?.role);
          if (profile?.role === 'hr') {
            console.log("HR role confirmed after sign in, redirecting to /hr");
            navigate('/hr', { replace: true });
          } else if (profile?.role === 'employee') {
            console.log("Employee role detected, redirecting to employee portal");
            setError("Vous n'avez pas accès au portail RH. Redirection vers le portail employé...");
            setIsLoading(false);
            setTimeout(() => {
              navigate('/portal', { replace: true });
            }, 2000);
          }
        } catch (err) {
          console.error("Error during role check:", err);
          setError("Une erreur est survenue lors de la vérification de vos droits d'accès");
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setError(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          redirectTo={`${window.location.origin}/hr`}
          showLinks={false}
        />
      </Card>
    </div>
  );
};

export default HRPortal;