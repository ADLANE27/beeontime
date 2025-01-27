import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Portal from "./pages/Portal";
import HRPortal from "./pages/HRPortal";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import HRDashboard from "./pages/hr/HRDashboard";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { toast } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children, requiredRole = "employee" }: { children: React.ReactNode; requiredRole?: "hr" | "employee" }) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    // Immediately sign out when tab/window closes or hides
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        supabase.auth.signOut();
        setIsAuthorized(false);
      }
    };

    // Immediately sign out before unload
    const handleBeforeUnload = () => {
      supabase.auth.signOut();
      setIsAuthorized(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Synchronous initial check
    const session = supabase.auth.session();
    if (!session) {
      setIsAuthorized(false);
      return;
    }

    // Check role and set authorization
    const checkAuth = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const hasRequiredRole = profile?.role === requiredRole;
        
        if (!hasRequiredRole) {
          await supabase.auth.signOut();
          toast.error("Accès non autorisé");
        }

        setIsAuthorized(hasRequiredRole);
      } catch (error) {
        console.error('Auth check error:', error);
        await supabase.auth.signOut();
        setIsAuthorized(false);
        toast.error("Erreur d'authentification");
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthorized(false);
      } else {
        await checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [requiredRole]);

  if (!isAuthorized) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;