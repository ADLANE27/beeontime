
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
  const { session, isLoading, profile, authReady } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("ProtectedRoute: Auth state updated", { 
      isLoading, 
      hasSession: !!session, 
      profileRole: profile?.role,
      requiredRole,
      authReady
    });
    
    // Only make decisions when auth is ready
    if (!authReady && isLoading) {
      return;
    }
    
    // Handle authentication-based redirections
    if (!session) {
      console.log("No session, redirecting to portal");
      setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
      setShouldRedirect(true);
      return;
    }
    
    // Handle role-based access
    if (profile) {
      if (requiredRole === "hr" && profile.role !== "hr") {
        console.log("User is not HR, redirecting to employee dashboard");
        setRedirectPath("/employee");
        setShouldRedirect(true);
        return;
      }
      
      // User has correct role, allow access
      console.log("Auth check passed, showing protected content");
      setShouldRedirect(false);
      return;
    }
    
    // Edge case: session exists but no profile yet
    if (session && !profile && !isLoading) {
      // This might be a rare race condition, redirect to login
      console.log("Session exists but no profile, redirecting to portal");
      setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
      setShouldRedirect(true);
    }
  }, [isLoading, session, profile, requiredRole, navigate, authReady]);

  // Show loading state
  if (isLoading || (!authReady && !shouldRedirect)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
          <button 
            onClick={() => {
              setShouldRedirect(true);
              setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
            }} 
            className="text-sm text-primary hover:underline mt-4"
          >
            Cliquez ici si le chargement persiste
          </button>
        </div>
      </div>
    );
  }

  // Redirect if needed
  if (shouldRedirect && redirectPath) {
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
