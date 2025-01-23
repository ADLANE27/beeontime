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
import { LoadingSpinner } from "./components/ui/loading-spinner";
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
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error("Erreur lors de la vérification de la session");
          setIsAuthorized(false);
          return;
        }

        if (!session) {
          console.log('No session found');
          setIsAuthorized(false);
          return;
        }

        console.log('Session found, checking profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile error:', profileError);
          toast.error("Erreur lors de la vérification du profil");
          setIsAuthorized(false);
          return;
        }

        const isAuthorized = profile?.role === requiredRole;
        console.log('Authorization result:', { role: profile?.role, requiredRole, isAuthorized });
        setIsAuthorized(isAuthorized);
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error("Une erreur inattendue est survenue");
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial check
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setIsLoading(true);
      
      if (!session) {
        console.log('No session after auth change');
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile error:', profileError);
          toast.error("Erreur lors de la vérification du profil");
          setIsAuthorized(false);
          return;
        }

        const isAuthorized = profile?.role === requiredRole;
        console.log('Authorization result after auth change:', { role: profile?.role, requiredRole, isAuthorized });
        setIsAuthorized(isAuthorized);
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error("Une erreur inattendue est survenue");
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
  }

  return <>{children}</>;
};

const App = () => (
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
);

export default App;