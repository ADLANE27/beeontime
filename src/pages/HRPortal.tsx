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
  let isSubscribed = true;

  const checkUserRole = async (userId: string) => {
    try {
      console.log("Checking role for user:", userId);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error("Erreur lors de la vérification du rôle utilisateur");
      }

      if (!profile) {
        console.error("No profile found for user:", userId);
        throw new Error("Profil utilisateur non trouvé");
      }

      console.log("User profile:", profile);
      return profile.role;
    } catch (error) {
      console.error("Role check error:", error);
      throw error;
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

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
          const role = await checkUserRole(session.user.id);
          
          if (isSubscribed) {
            if (role === 'hr') {
              console.log("HR role confirmed, redirecting to /hr");
              navigate('/hr', { replace: true });
            } else {
              setError("Vous n'avez pas accès au portail RH");
              timeoutId = setTimeout(() => {
                if (isSubscribed) {
                  navigate('/portal', { replace: true });
                }
              }, 2000);
            }
          }
        }
      } catch (err) {
        console.error("Authentication check error:", err);
        if (isSubscribed) {
          const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        setIsLoading(true);
        try {
          console.log("User signed in, checking role...");
          const role = await checkUserRole(session?.user.id);
          
          if (isSubscribed) {
            if (role === 'hr') {
              console.log("HR role confirmed after sign in, redirecting to /hr");
              navigate('/hr', { replace: true });
            } else {
              setError("Vous n'avez pas accès au portail RH");
              timeoutId = setTimeout(() => {
                if (isSubscribed) {
                  navigate('/portal', { replace: true });
                }
              }, 2000);
            }
          }
        } catch (err) {
          console.error("Role check error after sign in:", err);
          if (isSubscribed) {
            const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
            setError(errorMessage);
            toast.error(errorMessage);
          }
        } finally {
          if (isSubscribed) {
            setIsLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
        if (isSubscribed) {
          setError(null);
          setIsLoading(false);
        }
      }
    });

    checkAuth();

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
          redirectTo={`${window.location.origin}/hr`}
          showLinks={false}
        />
      </Card>
    </div>
  );
};

export default HRPortal;