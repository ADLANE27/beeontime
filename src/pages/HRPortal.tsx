
import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Building2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, signIn, isSessionExpired } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      navigate('/hr', { replace: true });
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
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-5">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-full shadow-sm">
            <Building2 className="h-9 w-9 text-primary" />
          </div>
          <img 
            src="/lovable-uploads/ebd70f88-aacb-40cd-b225-d94a0c0f1903.png" 
            alt="AFTraduction Logo" 
            className="h-16 w-auto"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Portail RH</h1>
            <p className="text-sm text-gray-600 mt-1">
              Connectez-vous pour accéder à l'espace RH
            </p>
          </div>
        </div>

        <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-xl">
          <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 rounded-lg">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">Connexion sécurisée</span>
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

export default HRPortal;
