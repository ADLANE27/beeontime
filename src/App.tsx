
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
  const { session, user } = useAuth();
  
  // Simple check - if we don't have a session, go to login
  if (!session) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
  }
  
  // Simple email-based role check
  const emailDomain = user?.email?.split('@')[1];
  const isHR = emailDomain === 'aftraduction.fr'; // Assuming HR emails have this domain
  const userRole = isHR ? "hr" : "employee";
  
  // If user doesn't match required role, redirect to appropriate dashboard
  if (userRole !== requiredRole) {
    toast.error(`Vous n'avez pas les droits pour accéder à cette page.`);
    return <Navigate to={userRole === "hr" ? "/hr" : "/employee"} replace />;
  }
  
  // User has session and matches role, allow access
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
