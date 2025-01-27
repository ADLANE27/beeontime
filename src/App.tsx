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
    let mounted = true;

    // Force sign out and clear session when tab/window closes or hides
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        supabase.auth.signOut();
        if (mounted) {
          setIsAuthorized(false);
        }
      }
    };

    // Force sign out before unload
    const handleBeforeUnload = () => {
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      supabase.auth.signOut();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Immediate session check
    const checkAuth = async (session: any) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const hasRequiredRole = profile?.role === requiredRole;
        
        if (!hasRequiredRole) {
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
          await supabase.auth.signOut();
          toast.error("Accès non autorisé");
        }

        if (mounted) {
          setIsAuthorized(hasRequiredRole);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.clear();
        await supabase.auth.signOut();
        if (mounted) {
          setIsAuthorized(false);
        }
        toast.error("Erreur d'authentification");
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && mounted) {
        setIsAuthorized(false);
      } else if (session) {
        checkAuth(session);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && mounted) {
        setIsAuthorized(false);
      } else if (session && mounted) {
        await checkAuth(session);
      }
    });

    return () => {
      mounted = false;
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