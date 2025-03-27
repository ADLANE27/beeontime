
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Building2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Portal = () => {
  const navigate = useNavigate();
  const { session, isLoading, signIn, isSessionExpired } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      navigate('/employee', { replace: true });
    }
  }, [session, navigate]);

  useEffect(() => {
    if (isSessionExpired) {
      toast.warning("Votre session a expiré. Veuillez vous reconnecter.");
    }
  }, [isSessionExpired]);

  const handleManualSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setLoginError(error);
      }
    } catch (error) {
      setLoginError("Une erreur inattendue s'est produite.");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Portail Employé</h1>
          <p className="text-sm text-gray-600 text-center">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 rounded-lg">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Connexion sécurisée</span>
          </div>

          <form onSubmit={handleManualSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg w-full px-3 py-2"
                placeholder="Votre adresse email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg w-full px-3 py-2"
                placeholder="Votre mot de passe"
                required
              />
            </div>

            {loginError && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-100">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg w-full transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-8">
          © {new Date().getFullYear()} AFTraduction. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default Portal;
