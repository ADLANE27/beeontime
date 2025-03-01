
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
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, 
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "hr" | "employee";
}

const ProtectedRoute = ({ children, requiredRole = "employee" }: ProtectedRouteProps) => {
  const { session, isLoading, profile } = useAuth();
  
  // Add debugging logs
  useEffect(() => {
    console.log("ProtectedRoute - Auth state:", { 
      session: !!session, 
      isLoading, 
      profile: profile?.role,
      requiredRole 
    });
  }, [session, isLoading, profile, requiredRole]);
  
  // Only show loading while initial authentication check is happening
  // Add a shorter timeout for the loading screen
  if (isLoading) {
    return <LoadingScreen message="Vérification de votre session..." timeout={10000} />;
  }
  
  // If no session, redirect to appropriate portal
  if (!session) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
  }
  
  // If we have a session but no profile yet, show loading but with shorter timeout
  if (session && !profile) {
    return <LoadingScreen message="Chargement de votre profil..." timeout={8000} />;
  }
  
  // If we have a profile but wrong role, redirect to the appropriate dashboard
  if (profile && profile.role !== requiredRole) {
    // Show error toast
    toast.error(`Vous n'avez pas les droits pour accéder à cette page.`);
    // Redirect to the appropriate dashboard based on role
    return <Navigate to={profile.role === "hr" ? "/hr" : "/employee"} replace />;
  }
  
  // Everything looks good, render the child components
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
