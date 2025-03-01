import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, authReady, signIn, profile, fetchProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // Auto-navigate if already logged in
    if (session && authReady) {
      console.log("User is logged in, checking profile:", profile);
      
      // If we have a profile, use it to determine if they're HR
      if (profile) {
        console.log("User profile found:", profile);
        const isHR = profile.role === 'hr' || email.endsWith('@aftraduction.fr');
        navigate(isHR ? '/hr' : '/employee', { replace: true });
      } else {
        // If profile isn't loaded yet, try fetching it
        fetchProfile().then(() => {
          console.log("Profile fetched, checking email domain");
          // Fallback to email domain check if profile doesn't specify role
          const isHR = email.endsWith('@aftraduction.fr') || session.user.email?.endsWith('@aftraduction.fr');
          navigate(isHR ? '/hr' : '/employee', { replace: true });
        });
      }
    }
  }, [session, authReady, profile, navigate, fetchProfile]);

  // If still checking authentication, show loading
  if (isLoading && !authReady) {
    return <LoadingScreen message="Vérification de l'authentification..." />;
  }

  // Don't render login form if already logged in (will redirect via useEffect)
  if (session) {
    return <LoadingScreen message="Redirection en cours..." />;
  }

  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!email || !password) {
      toast.error("Veuillez saisir votre email et votre mot de passe");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error("Login error:", error.message);
        setLoginError("Identifiants invalides, veuillez réessayer");
        toast.error("Identifiants invalides, veuillez réessayer");
      }
    } catch (error) {
      console.error("Login exception:", error);
      setLoginError("Une erreur est survenue lors de la connexion");
      toast.error("Une erreur est survenue lors de la connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center border-b pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Portail RH
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {loginError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="h-12"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="h-12"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    Se connecter...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
              
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  Si vous ne parvenez pas à vous connecter, contactez votre administrateur système.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HRPortal;
