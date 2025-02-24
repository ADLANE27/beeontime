
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
  const { session, isLoading, signOut } = useAuth();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkAuth = async () => {
      if (!session?.user) {
        console.log("No session found, redirecting to login");
        await signOut();
        return;
      }

      setIsCheckingProfile(true);

      try {
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Profile verification timeout'));
          }, 5000); // 5 second timeout
        });

        // Profile verification
        const profilePromise = supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        // Race between timeout and profile verification
        const { data: profile, error } = await Promise.race([
          profilePromise,
          timeoutPromise
        ]) as { data: { role: string } | null, error: Error | null };

        clearTimeout(timeoutId);

        if (error) {
          throw error;
        }

        if (!profile || profile.role !== requiredRole) {
          console.log("Unauthorized access or profile not found");
          toast.error("Accès non autorisé");
          await signOut();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        toast.error("Erreur de vérification du profil");
        await signOut();
      } finally {
        setIsCheckingProfile(false);
      }
    };

    if (!isLoading && session) {
      checkAuth();
    }

    return () => {
      clearTimeout(timeoutId);
      setIsCheckingProfile(false);
    };
  }, [session, requiredRole, isLoading, signOut]);

  // Show loading state only during initial auth check or profile verification
  if (isLoading || isCheckingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isCheckingProfile ? "Vérification du profil..." : "Chargement..."}
          </p>
        </div>
      </div>
    );
  }

  // If no session, redirect to appropriate portal
  if (!session) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
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
