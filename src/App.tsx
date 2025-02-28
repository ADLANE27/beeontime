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
import { AuthProvider, useAuth } from "./contexts/auth";
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
  const { session, isLoading, profile, authReady, profileFetchAttempted } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      // Don't make decisions if we're still properly loading (but implement a safety fallback below)
      if (isLoading && !profileFetchAttempted) {
        console.log("Still loading auth state, waiting...");
        return;
      }
      
      // No session means we need to redirect to login
      if (!session) {
        console.log("No session, redirecting to portal");
        setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
        return;
      }
      
      // Session exists but no profile, but we already tried to fetch it - redirect to login
      if (session && !profile && profileFetchAttempted) {
        console.log("Session exists but no profile after fetch attempt, redirecting to portal");
        setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
        return;
      }
      
      // User has a profile but wrong role for HR section
      if (profile && requiredRole === "hr" && profile.role !== "hr") {
        console.log("User is not HR, redirecting to employee dashboard");
        toast.error("Vous n'avez pas les droits pour accéder à cette page.");
        setRedirectPath("/employee");
        return;
      }
      
      // User authenticated with correct role - keep redirectPath null
      console.log("Auth check passed, showing protected content");
      setRedirectPath(null);
    };
    
    checkAuth();
    
    // Loading timeout as a safety mechanism
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Loading timeout reached, redirecting to login");
        setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, session, profile, requiredRole, profileFetchAttempted]);

  // Show loading state for a reasonable time
  if (isLoading && !redirectPath && !profileFetchAttempted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
          <button 
            onClick={() => setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal")} 
            className="text-sm text-primary hover:underline mt-4"
          >
            Cliquez ici si le chargement persiste
          </button>
        </div>
      </div>
    );
  }

  // Redirect if needed
  if (redirectPath) {
    console.log(`Redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  // Render protected content
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
