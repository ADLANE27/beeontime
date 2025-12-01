
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "hr" | "employee";
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole = "employee" 
}: ProtectedRouteProps) => {
  const { session, isLoading, isSessionExpired } = useAuth();

  useEffect(() => {
    if (isSessionExpired) {
      toast.warning("Votre session a expiré. Vous allez être redirigé vers la page de connexion.");
    }
  }, [isSessionExpired]);

  // Show loading state only during initial auth check
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // If session expired or no session, redirect to appropriate portal
  if (isSessionExpired || !session) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
  }

  return <>{children}</>;
};
