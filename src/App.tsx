
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

const ProtectedRoute = ({ children, requiredRole = "employee" }: { children: React.ReactNode; requiredRole?: "hr" | "employee" }) => {
  const { session, isLoading, profile } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    let timeoutId: number;
    
    // Set hasCheckedAuth to true when auth check is complete
    if (!isLoading) {
      setHasCheckedAuth(true);

      // Determine redirect path based on auth status and role
      if (!session) {
        console.log("No session, redirecting to portal");
        setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
      } else if (profile && requiredRole === "hr" && profile.role !== "hr") {
        console.log("User is not HR, redirecting to employee dashboard");
        setRedirectPath("/employee");
      } else {
        console.log("Auth check passed, showing protected content");
        setRedirectPath(null); // No redirect needed
      }
    } else {
      // Set a timeout to stop showing loading after 3 seconds regardless
      timeoutId = window.setTimeout(() => {
        setShowLoading(false);
        console.log("Forcing auth check completion after timeout");
        // If we still don't have auth info after timeout, redirect to login
        if (isLoading) {
          setRedirectPath(requiredRole === "hr" ? "/hr-portal" : "/portal");
          setHasCheckedAuth(true);
        }
      }, 3000);
    }
    
    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [isLoading, session, profile, requiredRole]);

  // Show loading state only during initial auth check and before timeout
  if (isLoading && showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
          <button 
            onClick={() => window.location.reload()} 
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
