
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { ShieldX } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "hr" | "employee";
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole = "employee" 
}: ProtectedRouteProps) => {
  const { session, isLoading: isAuthLoading, isSessionExpired } = useAuth();
  const { role, isLoading: isRoleLoading, hasRole } = useUserRole();

  useEffect(() => {
    if (isSessionExpired) {
      toast.warning("Votre session a expiré. Vous allez être redirigé vers la page de connexion.");
    }
  }, [isSessionExpired]);

  // Show loading state during initial auth and role check
  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  // If session expired or no session, redirect to appropriate portal
  if (isSessionExpired || !session) {
    return <Navigate to={requiredRole === "hr" ? "/hr-portal" : "/portal"} replace />;
  }

  // Check if user has the required role
  if (!hasRole(requiredRole)) {
    // User is authenticated but doesn't have the required role
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="max-w-md text-center space-y-6 p-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Accès non autorisé</h1>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette section.
              {requiredRole === "hr" && (
                <span className="block mt-2">
                  Cette zone est réservée aux responsables RH.
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {role === "employee" && (
              <a 
                href="/employee" 
                className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Accéder à mon espace employé
              </a>
            )}
            <a 
              href={role === "hr" ? "/hr-portal" : "/portal"} 
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Retour à la connexion
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
