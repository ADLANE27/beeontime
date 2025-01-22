import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Portal = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking user session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error("Erreur lors de la vérification de la session");
        }

        if (session) {
          console.log("Session found, checking user profile...");
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
          if (profile?.role === 'employee') {
            console.log("Employee role confirmed, redirecting to /employee");
            navigate('/employee', { replace: true });
          } else if (profile?.role === 'hr') {
            console.log("HR role detected, redirecting to HR portal");
            navigate('/hr-portal', { replace: true });
          }
        }
      } catch (err) {
        console.error("Authentication error:", err);
        const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_IN') {
        try {
          console.log("User signed in, checking profile...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session?.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Profile error:", profileError);
            throw new Error("Erreur lors de la vérification du profil");
          }

          console.log("User profile after sign in:", profile);
          if (profile?.role === 'employee') {
            console.log("Employee role confirmed, redirecting to /employee");
            navigate('/employee', { replace: true });
          } else if (profile?.role === 'hr') {
            console.log("HR role detected, redirecting to HR portal");
            navigate('/hr-portal', { replace: true });
          }
        } catch (err) {
          console.error("Profile check error:", err);
          const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
          setError(errorMessage);
          toast.error(errorMessage);
        }
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
        <h1 className="text-2xl font-bold text-center mb-8">Portail Employé</h1>
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
          redirectTo={window.location.origin}
          showLinks={false}
        />
      </Card>
    </div>
  );
};

export default Portal;