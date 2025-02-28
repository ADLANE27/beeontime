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
import { AuthProvider, useAuth } from "./contexts/auth";
import { toast } from "sonner";
import { LoadingScreen } from "./components/ui/loading-screen";

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
  
  // Show loading state if auth is still initializing
  if (isLoading || !authReady) {
    return <LoadingScreen fullScreen message="Chargement de votre session..." />;
  }

  // Determine where to redirect if not authenticated
  const redirectPath = requiredRole === "hr" ? "/hr-portal" : "/portal";
  
  // Handle authentication and authorization cases
  if (!session) {
    // Not logged in - redirect to login
    return <Navigate to={redirectPath} replace />;
  }
  
  if (!profile) {
    // Logged in but no profile - show error and redirect
    toast.error("Session invalide. Veuillez vous reconnecter.");
    return <Navigate to={redirectPath} replace />;
  }
  
  if (requiredRole === "hr" && profile.role !== "hr") {
    // Wrong role for HR section
    toast.error("Vous n'avez pas les droits pour accéder à cette page.");
    return <Navigate to="/employee" replace />;
  }
  
  // All checks passed - render children
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
