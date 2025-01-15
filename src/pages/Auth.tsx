import { useEffect, useState } from "react";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { AuthError, AuthApiError } from "@supabase/supabase-js";

const Auth = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN") {
        // Fetch user profile to determine role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session?.user?.id)
          .single();

        if (profile?.role === "hr") {
          navigate("/hr");
        } else {
          navigate("/employee");
        }
      }
      if (event === "USER_UPDATED") {
        const { error } = await supabase.auth.getSession();
        if (error) {
          setErrorMessage(getErrorMessage(error));
        }
      }
      if (event === "SIGNED_OUT") {
        navigate("/");
        setErrorMessage("");
      }
    });

    // Check if user is already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Redirect based on role
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile?.role === "hr") {
              navigate("/hr");
            } else {
              navigate("/employee");
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const getErrorMessage = (error: AuthError) => {
    if (error instanceof AuthApiError) {
      switch (error.code) {
        case "invalid_credentials":
          return "Email ou mot de passe invalide. Veuillez vérifier vos identifiants.";
        case "email_not_confirmed":
          return "Veuillez vérifier votre adresse email avant de vous connecter.";
        case "user_not_found":
          return "Aucun utilisateur trouvé avec ces identifiants.";
        case "invalid_grant":
          return "Identifiants de connexion invalides.";
        default:
          return error.message;
      }
    }
    return error.message;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Portail RH AFTraduction
          </h2>
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
                  brand: '#22c55e',
                  brandAccent: '#16a34a'
                }
              }
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: "Email",
                password_label: "Mot de passe",
                button_label: "Se connecter",
                loading_button_label: "Connexion en cours...",
                social_provider_text: "Continuer avec {{provider}}",
                link_text: "Vous avez déjà un compte ? Connectez-vous"
              },
              sign_up: {
                email_label: "Email",
                password_label: "Mot de passe",
                button_label: "S'inscrire",
                loading_button_label: "Inscription en cours...",
                social_provider_text: "Continuer avec {{provider}}",
                link_text: "Vous n'avez pas de compte ? Inscrivez-vous"
              }
            }
          }}
        />
      </Card>
    </div>
  );
};

export default Auth;