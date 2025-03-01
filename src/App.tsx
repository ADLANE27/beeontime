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
import { useEffect, useState } from "react";

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
  const [routeTimeout, setRouteTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setRouteTimeout(true);
    }, 8000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    console.log("ProtectedRoute - Auth state:", { 
      session: !!session, 
      isLoading, 
      profile: profile?.role,
      requiredRole,
      routeTimeout
    });
  }, [session, isLoading, profile, requiredRole, routeTimeout]);
  
  if (routeTimeout && (isLoading || (session && !profile))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Problème de chargement</h2>
          <p className="text-gray-600 mb-6">
            Le chargement de votre profil prend trop de temps. Veuillez rafraîchir la page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Rafraîchir la page
          </button>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return <LoadingScreen message="Vérification de votre session..." timeout={5000} />;
  }
  
  if (!session) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
  }
  
  if (session && !profile) {
    return <LoadingScreen message="Chargement de votre profil..." timeout={5000} />;
  }
  
  if (profile && profile.role !== requiredRole) {
    toast.error(`Vous n'avez pas les droits pour accéder à cette page.`);
    return <Navigate to={profile.role === "hr" ? "/hr" : "/employee"} replace />;
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
