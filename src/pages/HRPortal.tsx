
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card } from "@/components/ui/card";
import { Building2, Lock, Loader2, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const HRPortal = () => {
  const navigate = useNavigate();
  const { session, isLoading, profile, authInitialized, profileFetchAttempted, authError } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [manualSignInAttempted, setManualSignInAttempted] = useState(false);

  // Check network status
  useEffect(() => {
    const checkNetwork = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    // Initial check
    checkNetwork();

    // Add event listeners for online/offline status
    window.addEventListener('online', checkNetwork);
    window.addEventListener('offline', checkNetwork);

    return () => {
      window.removeEventListener('online', checkNetwork);
      window.removeEventListener('offline', checkNetwork);
    };
  }, []);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timeout detected in HRPortal");
        setLoadingTimeout(true);
      }
    }, 12000); // 12 seconds timeout (reduced from 15)

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Handle authentication redirects
  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout | null = null;

    // Check if we can determine authentication state
    const canDetermineAuthState = authInitialized || authError || loadingTimeout;
    
    if (canDetermineAuthState) {
      // User is authenticated and has a profile
      if (session && profile) {
        console.log("HR Portal: Session and profile found, checking role", profile.role);
        redirectTimeout = setTimeout(() => {
          if (profile.role === "hr") {
            navigate('/hr', { replace: true });
          } else {
            toast.error("Vous n'avez pas les droits pour accéder à cette page.");
            navigate('/employee', { replace: true });
          }
        }, 300); // Short delay to avoid immediate redirect
      } 
      // User is authenticated but no profile found
      else if (session && !profile && profileFetchAttempted) {
        console.log("HR Portal: Session exists but no profile found after fetch attempt");
        setLoginError("Profil utilisateur introuvable. Veuillez contacter l'administrateur.");
        setAuthCheckComplete(true);
      } 
      // User is not authenticated
      else if (!session && canDetermineAuthState) {
        console.log("HR Portal: No session found, user should log in");
        setAuthCheckComplete(true);
      }
    }

    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [session, profile, navigate, authInitialized, profileFetchAttempted, authError, loadingTimeout]);

  // Check for error parameters in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('error')) {
      const errorDescription = url.searchParams.get('error_description');
      
      if (errorDescription?.includes("Invalid login credentials")) {
        setLoginError("Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.");
      } else if (errorDescription?.includes("Email not confirmed")) {
        setLoginError("Votre email n'a pas été confirmé. Veuillez vérifier votre boîte mail.");
      } else {
        setLoginError(`Erreur de connexion: ${errorDescription || "Connexion invalide"}`);
      }
      
      // Remove error params from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Display auth errors from auth state
  useEffect(() => {
    if (authError && !loginError) {
      setLoginError(`Problème d'authentification: ${authError.message}`);
    }
  }, [authError, loginError]);

  // Manual sign-in handler to provide better error feedback
  const handleManualSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (!email || !password) {
      setLoginError("Veuillez remplir tous les champs.");
      return;
    }
    
    try {
      setManualSignInAttempted(true);
      setLoginError(null);
      
      console.log("Attempting manual sign in for:", email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Sign in error:", error.message);
        if (error.message.includes("Invalid login credentials")) {
          setLoginError("Email ou mot de passe incorrect.");
        } else {
          setLoginError(`Erreur de connexion: ${error.message}`);
        }
        setManualSignInAttempted(false);
      }
    } catch (err) {
      console.error("Exception during sign in:", err);
      setLoginError("Une erreur s'est produite lors de la connexion. Veuillez réessayer.");
      setManualSignInAttempted(false);
    }
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    window.location.reload();
  };

  // Handle manual sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erreur lors de la déconnexion. Veuillez rafraîchir la page.");
    }
  };

  // Show clear loading state during authentication check
  if ((!authCheckComplete && isLoading && !loadingTimeout) || manualSignInAttempted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Vérification de votre session...</p>
          <p className="text-xs text-muted-foreground/70">
            {session ? "Récupération du profil..." : "Chargement de l'authentification..."}
          </p>
          <Button 
            variant="link" 
            className="text-sm text-muted-foreground"
            onClick={handleManualRefresh}
            disabled={manualSignInAttempted}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Rafraîchir
          </Button>
        </div>
      </div>
    );
  }

  // Loading timeout detected
  if (loadingTimeout && !authCheckComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h1 className="text-2xl font-bold">Délai de connexion dépassé</h1>
            <p className="text-gray-600">
              La vérification de votre session prend plus de temps que prévu. Veuillez rafraîchir la page.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={handleManualRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir la page
            </Button>
            
            {session && (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleSignOut}
              >
                Se déconnecter
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // If we have a session but profile fetch failed
  if (session && !profile && profileFetchAttempted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h1 className="text-2xl font-bold">Profil non disponible</h1>
            <p className="text-gray-600">
              Votre session est active, mais nous n'avons pas pu récupérer votre profil utilisateur.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              className="w-full" 
              onClick={handleManualRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir la page
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleSignOut}
            >
              Se déconnecter
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main login form
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
          <h1 className="text-2xl font-bold text-gray-900">Portail RH</h1>
          <p className="text-sm text-gray-600 text-center">
            Connectez-vous pour accéder à l'espace RH
          </p>
        </div>

        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          {networkStatus === 'offline' && (
            <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
              <WifiOff className="h-4 w-4 text-amber-500" />
              <AlertTitle>Connexion limitée</AlertTitle>
              <AlertDescription>
                Vous semblez être hors ligne. La connexion pourrait échouer.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 rounded-lg">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Connexion sécurisée</span>
          </div>

          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}

          {authError && !loginError && (
            <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle>Problème d'authentification</AlertTitle>
              <AlertDescription>
                {authError.message || "Une erreur s'est produite lors de l'authentification."}
              </AlertDescription>
            </Alert>
          )}

          {/* Manual sign-in form instead of Supabase Auth UI */}
          <form onSubmit={handleManualSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <input 
                id="email"
                name="email"
                type="email" 
                className="bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg w-full p-2.5 border"
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
                name="password"
                type="password" 
                className="bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg w-full p-2.5 border"
                placeholder="Votre mot de passe"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors"
              disabled={manualSignInAttempted}
            >
              {manualSignInAttempted ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {networkStatus === 'offline' && (
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => setNetworkStatus(navigator.onLine ? 'online' : 'offline')}
              >
                Vérifier la connexion
              </Button>
            </div>
          )}
        </Card>

        <p className="text-center text-sm text-gray-600 mt-8">
          © {new Date().getFullYear()} AFTraduction. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default HRPortal;
