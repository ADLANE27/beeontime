import { useEffect, useState } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AuthError } from "@supabase/supabase-js";

const HRPortal = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const getErrorMessage = (error: AuthError) => {
    console.error("Auth error details:", error);
    
    if (error.message.includes("invalid_credentials")) {
      return "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
    }
    
    return "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Session error:", sessionError);
          setErrorMessage(getErrorMessage(sessionError));
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile error:", profileError);
            setErrorMessage("Erreur lors de la vérification du profil.");
            setIsLoading(false);
            return;
          }

          if (profile?.role === "hr") {
            navigate("/hr");
          } else {
            setErrorMessage("Accès non autorisé. Ce portail est réservé aux RH.");
            await supabase.auth.signOut();
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Session check error:", error);
        setErrorMessage("Une erreur est survenue lors de la vérification de la session.");
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session);
      
      if (event === "SIGNED_IN" && session) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
          setErrorMessage("Erreur lors de la vérification du profil.");
          return;
        }

        if (profile?.role === "hr") {
          navigate("/hr");
        } else {
          setErrorMessage("Accès non autorisé. Ce portail est réservé aux RH.");
          await supabase.auth.signOut();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Portail RH AFTraduction
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous avec vos identifiants RH
          </p>
        </div>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8'
                }
              }
            }
          }}
          providers={[]}
          view="sign_in"
          showLinks={false}
          redirectTo={window.location.origin + "/hr-portal"}
          localization={{
            variables: {
              sign_in: {
                email_label: "Email",
                password_label: "Mot de passe",
                button_label: "Se connecter",
                loading_button_label: "Connexion en cours..."
              }
            }
          }}
        />
      </Card>
    </div>
  );
};

export default HRPortal;