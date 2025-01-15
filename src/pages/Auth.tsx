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

  const getErrorMessage = (error: AuthError) => {
    if (error instanceof AuthApiError) {
      switch (error.status) {
        case 400:
          if (error.message.includes("Invalid login credentials")) {
            return "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
          } else if (error.message.includes("requested path is invalid")) {
            return "Erreur de configuration de l'authentification. Veuillez contacter l'administrateur.";
          }
          return "Une erreur s'est produite lors de la connexion. Veuillez réessayer.";
        case 422:
          return "Format d'email invalide.";
        default:
          return "Une erreur inattendue s'est produite. Veuillez réessayer.";
      }
    }
    return error.message;
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "employee") {
          navigate("/employee");
        } else if (profile?.role === "hr") {
          navigate("/hr");
        } else {
          setErrorMessage("Accès non autorisé. Ce portail est réservé aux employés.");
          await supabase.auth.signOut();
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      if (event === "SIGNED_IN") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session?.user?.id)
          .single();

        if (profile?.role === "employee") {
          navigate("/employee");
        } else if (profile?.role === "hr") {
          navigate("/hr");
        } else {
          setErrorMessage("Accès non autorisé. Ce portail est réservé aux employés.");
          await supabase.auth.signOut();
        }
      } else if (event === "SIGNED_OUT") {
        setErrorMessage("");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Portail AFTraduction
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous avec les identifiants fournis par votre responsable RH
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
                  brand: '#22c55e',
                  brandAccent: '#16a34a'
                }
              }
            }
          }}
          providers={[]}
          redirectTo={window.location.origin + "/auth/callback"}
          showLinks={false}
          view="sign_in"
          localization={{
            variables: {
              sign_in: {
                email_label: "Email",
                password_label: "Mot de passe",
                button_label: "Se connecter",
                loading_button_label: "Connexion en cours...",
              }
            }
          }}
        />
      </Card>
    </div>
  );
};

export default Auth;