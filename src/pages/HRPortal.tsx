import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

const HRPortal = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw new Error("Erreur lors de la vérification de la session");
        }

        console.log("Session status:", session ? "Active" : "No session");
        
        if (session) {
          console.log("Checking user role for:", session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Profile fetch error:", profileError);
            throw new Error("Erreur lors de la vérification du rôle utilisateur");
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
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        setIsLoading(true);
        try {
          console.log("User signed in, checking role...");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session?.user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          
          console.log("User profile after sign in:", profile);
          
          if (profile?.role === 'hr') {
            console.log("HR role confirmed after sign in, redirecting to /hr");
            navigate('/hr', { replace: true });
          } else {
            setError("Vous n'avez pas accès au portail RH");
            setTimeout(() => {
              navigate('/portal', { replace: true });
            }, 2000);
          }
        } catch (err) {
          console.error("Role check error after sign in:", err);
          const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
          setError(errorMessage);
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
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
          redirectTo={window.location.origin}
          showLinks={false}
        />
      </Card>
    </div>
  );
};

export default HRPortal;