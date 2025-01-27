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
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.log('No valid session found');
          setIsAuthorized(false);
          return;
        }

        // Check session expiration
        const expiresAt = new Date(session.expires_at! * 1000);
        if (expiresAt <= new Date()) {
          console.log('Session expired');
          await supabase.auth.signOut();
          setIsAuthorized(false);
          return;
        }

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

        setIsAuthorized(profile?.role === requiredRole);
      } catch (error) {
        console.error('Unexpected error:', error);
        toast.error("Une erreur inattendue est survenue");
        setIsAuthorized(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        setIsAuthorized(false);
        return;
      }

      const expiresAt = new Date(session.expires_at! * 1000);
      if (expiresAt <= new Date()) {
        await supabase.auth.signOut();
        setIsAuthorized(false);
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          toast.error("Erreur lors de la vérification du profil");
          setIsAuthorized(false);
          return;
        }

        setIsAuthorized(profile?.role === requiredRole);
      } catch (error) {
        toast.error("Une erreur inattendue est survenue");
        setIsAuthorized(false);
      }
    });

    // Force sign out when tab/window is closed
    const handleTabClose = async () => {
      await supabase.auth.signOut();
    };

    window.addEventListener('beforeunload', handleTabClose);
    window.addEventListener('unload', handleTabClose);

    // Add visibility change listener
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await supabase.auth.signOut();
        setIsAuthorized(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleTabClose);
      window.removeEventListener('unload', handleTabClose);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [requiredRole]);

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