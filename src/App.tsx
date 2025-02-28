
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Portal from "./pages/Portal";
import HRPortal from "./pages/HRPortal";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import HRDashboard from "./pages/hr/HRDashboard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { supabase } from "./integrations/supabase/client";
import { toast } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode; 
  requiredRole?: "hr" | "employee";
}

const ProtectedRoute = ({ children, requiredRole = "employee" }: ProtectedRouteProps) => {
  const { session, isLoading, profile, refreshProfile } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("ProtectedRoute: Auth state changed", { 
      isLoading, 
      hasSession: !!session, 
      profileRole: profile?.role,
      requiredRole,
      retryCount
    });
    
    // Éviter de manipuler l'état directement au premier rendu
    if (isLoading && !hasCheckedAuth && retryCount === 0) {
      console.log("Initial loading, waiting for auth to complete");
      return;
    }
    
    let timeoutId: number;
    
    // Si le chargement est en cours mais qu'on a déjà un nombre de tentatives élevé, on force la fin
    if (isLoading && retryCount >= 2) {
      console.log("Too many retries while loading, forcing completion");
      // Fix: use setIsLoading from useState hook instead of a non-existent setIsLoading
      setShowLoading(false);
      setHasCheckedAuth(true);
      setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
      return;
    }
    
    // Si le chargement est terminé, on peut prendre des décisions
    if (!isLoading) {
      // Si session existe mais pas le profil, essayer de récupérer le profil une fois
      if (session && !profile && retryCount < 2) {
        console.log("Session exists but no profile, attempting to refresh profile");
        setRetryCount(prev => prev + 1);
        refreshProfile();
        return;
      }
      
      setHasCheckedAuth(true);

      // Determine redirect path based on auth status and role
      if (!session) {
        console.log("No session, redirecting to portal");
        setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
      } else if (profile && requiredRole === "hr" && profile.role !== "hr") {
        console.log("User is not HR, redirecting to employee dashboard");
        setRedirectPath("/employee");
      } else if (session && !profile) {
        console.log("Session exists but no profile found after retries, redirecting to portal and signing out");
        toast.error("Erreur de profil utilisateur. Veuillez vous reconnecter.");
        setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
        // Force signout to clean state
        supabase.auth.signOut().then(() => {
          console.log("User signed out due to missing profile");
        });
      } else {
        console.log("Auth check passed, showing protected content");
        setRedirectPath(null); // No redirect needed
      }
    } else {
      // Set a timeout to stop showing loading after 3 seconds regardless
      timeoutId = window.setTimeout(() => {
        setShowLoading(false);
        console.log("Forcing auth check completion after timeout");
        if (isLoading) {
          // Si toujours en chargement après le timeout, rediriger
          setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
          setHasCheckedAuth(true);
          toast.error("Délai d'authentification dépassé. Veuillez réessayer.");
        }
      }, 3000);
    }
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isLoading, session, profile, requiredRole, navigate, refreshProfile, retryCount, hasCheckedAuth]);

  // Show loading state only during initial auth check and before timeout
  if ((isLoading || (!hasCheckedAuth && retryCount > 0)) && showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement... {retryCount > 0 ? `(tentative ${retryCount})` : ''}</p>
          <button 
            onClick={() => {
              setRetryCount(0);
              setShowLoading(false);
              setHasCheckedAuth(true);
              setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
              supabase.auth.signOut();
            }} 
            className="text-sm text-primary hover:underline mt-4"
          >
            Cliquez ici si le chargement persiste
          </button>
        </div>
      </div>
    );
  }

  // If we need to redirect, do so
  if (hasCheckedAuth && redirectPath) {
    console.log(`Redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // Otherwise, render children
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/portal" replace />} />
              <Route path="/portal" element={<Portal />} />
              <Route path="/hr-portal" element={<HRPortal />} />
              <Route 
                path="/employee/*" 
                element={
                  <ProtectedRoute requiredRole="employee">
                    <EmployeeDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hr/*" 
                element={
                  <ProtectedRoute requiredRole="hr">
                    <HRDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/portal" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
