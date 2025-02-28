
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Portal = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, session, isLoading: authLoading, profile } = useAuth();
  const navigate = useNavigate();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    console.log("Portal: session state:", session ? "Logged in" : "Not logged in");
    console.log("Portal: profile state:", profile ? `Role: ${profile.role}` : "No profile");
    
    // Set a safety timeout for loading state
    const timeoutId = setTimeout(() => {
      if (authLoading) {
        console.log("Auth loading timeout reached in portal");
        setLoadingTimeout(true);
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [session, authLoading, profile]);

  // Handle loading state with timeout safety
  const isActuallyLoading = authLoading && !loadingTimeout;
  
  // If already authenticated, redirect to dashboard
  if (session && profile && !isActuallyLoading) {
    console.log("User already authenticated, redirecting to dashboard");
    return <Navigate to="/employee" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Veuillez saisir votre email et votre mot de passe");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Attempting to sign in with email:", email);
      
      const { error } = await signIn(email, password);
      
      if (error) {
        console.error("Sign in error:", error);
        toast.error("Identifiants invalides, veuillez réessayer");
        return;
      }
      
      console.log("Sign in successful, redirecting to employee dashboard");
      navigate("/employee", { replace: true });
      
    } catch (error) {
      console.error("Exception during sign in:", error);
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
            {isActuallyLoading ? (
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                <p className="text-gray-500">Chargement en cours...</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Portal;
