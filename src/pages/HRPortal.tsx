
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2, RefreshCcw } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, signIn, profile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // For debugging
  useEffect(() => {
    console.log("HRPortal - Auth state:", { session, isLoading, profile });
  }, [session, isLoading, profile]);

  // Handle redirection based on session and role
  useEffect(() => {
    if (!isLoading && session) {
      // If we have a session, try to redirect
      if (profile?.role === "hr") {
        navigate('/hr', { replace: true });
      } else if (profile?.role === "employee") {
        toast.error("Vous n'avez pas les droits pour accéder à cette page.");
        navigate('/employee', { replace: true });
      }
      // If we have a session but no profile yet, let's wait but with a timeout
    }
  }, [session, profile, navigate, isLoading]);

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    let timer;
    if ((session && !profile) || isLoading) {
      timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // 5 seconds timeout
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [session, profile, isLoading]);

  // Handle forced refresh when loading takes too long
  const handleForceRefresh = () => {
    window.location.reload();
  };

  // Display shorter loading period only during initialization
  if (isLoading && !loadingTimeout) {
    return <LoadingScreen message="Chargement..." timeout={5000} />;
  }

  // If loading timeout occurred, show a refresh button
  if (loadingTimeout) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-medium text-gray-900">
              Chargement trop long
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Le chargement prend plus de temps que prévu. Veuillez réessayer.
            </p>
            <Button 
              onClick={handleForceRefresh}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Rafraîchir la page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we have a session but no navigation happened yet, show a temporary waiting screen with timeout
  if (session && !isLoading && !profile) {
    return <LoadingScreen message="Vérification des accès..." timeout={5000} />;
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
              Portail RH
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
