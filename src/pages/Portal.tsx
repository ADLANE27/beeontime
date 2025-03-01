
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Portal = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, session, isLoading, profile } = useAuth();
  const navigate = useNavigate();

  // Handle redirection based on session and role
  useEffect(() => {
    if (session && profile) {
      if (profile.role === "hr") {
        navigate('/hr', { replace: true });
      } else {
        navigate('/employee', { replace: true });
      }
    }
  }, [session, profile, navigate]);

  // Display loading indicator only during initialization
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          <p className="mt-2 text-gray-500">Initialisation de l'application...</p>
        </div>
      </div>
    );
  }

  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Veuillez saisir votre email et votre mot de passe");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error("Login error:", error.message);
        toast.error("Identifiants invalides, veuillez réessayer");
      }
    } catch (error) {
      console.error("Login exception:", error);
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
              Portail Employé
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
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
                  Si vous ne parvenez pas à vous connecter, contactez votre service RH.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Portal;
