import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Portal from "./pages/Portal";
import HRPortal from "./pages/HRPortal";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import HRDashboard from "./pages/hr/HRDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requiredRole = "employee" }: { children: React.ReactNode; requiredRole?: "hr" | "employee" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"hr" | "employee" | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }

        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile error:", profileError);
            throw profileError;
          }

          if (mounted) {
            setIsAuthenticated(true);
            setUserRole(profile?.role || null);
          }
        } else {
          if (mounted) {
            setIsAuthenticated(false);
            setUserRole(null);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        toast.error("Erreur lors de la vérification de l'authentification");
        if (mounted) {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session);
      
      if (event === "SIGNED_IN" && session) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) throw profileError;

          if (mounted) {
            setIsAuthenticated(true);
            setUserRole(profile?.role || null);
          }
        } catch (error) {
          console.error("Profile fetch error:", error);
          toast.error("Erreur lors de la récupération du profil");
          if (mounted) {
            setIsAuthenticated(false);
            setUserRole(null);
          }
        }
      } else if (event === "SIGNED_OUT") {
        if (mounted) {
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === "hr" ? "/hr" : "/employee"} replace />;
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