import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const MAX_VERIFICATION_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

const ProtectedRoute = ({ children, requiredRole = "employee" }: { children: React.ReactNode; requiredRole?: "hr" | "employee" }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const { session, isLoading: isAuthLoading, signOut } = useAuth();

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const checkAuth = async () => {
      if (!session?.user) {
        if (isMounted) {
          setIsAuthorized(false);
          // Si pas de session, on force la déconnexion pour nettoyer
          await signOut();
        }
        return;
      }

      try {
        console.log("Checking auth for user:", session.user.email);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Profile fetch error:", error);
          throw error;
        }

        if (!profile) {
          console.error("Profile not found");
          throw new Error("Profile not found");
        }

        const hasRequiredRole = profile.role === requiredRole;
        console.log("Has required role:", hasRequiredRole);
        
        if (!hasRequiredRole) {
          console.log("Unauthorized access attempt");
          toast.error("Accès non autorisé");
          await signOut();
        }

        if (isMounted) {
          setIsAuthorized(hasRequiredRole);
          if (hasRequiredRole) {
            setVerificationAttempts(0); // Reset attempts on success
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        
        if (isMounted) {
          if (verificationAttempts < MAX_VERIFICATION_ATTEMPTS - 1) {
            console.log(`Retry attempt ${verificationAttempts + 1}/${MAX_VERIFICATION_ATTEMPTS}`);
            setVerificationAttempts(prev => prev + 1);
            retryTimeout = setTimeout(checkAuth, RETRY_DELAY);
          } else {
            console.log("Max verification attempts reached");
            toast.error("Erreur de vérification du profil");
            await signOut();
            setIsAuthorized(false);
          }
        }
      }
    };

    if (!isAuthLoading) {
      checkAuth();
    }

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [session, requiredRole, isAuthLoading, verificationAttempts, signOut]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Vérification du profil...</p>
          {verificationAttempts > 0 && (
            <p className="text-sm text-muted-foreground">
              Tentative {verificationAttempts + 1}/{MAX_VERIFICATION_ATTEMPTS}
            </p>
          )}
        </div>
      </div>
    );
  }

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