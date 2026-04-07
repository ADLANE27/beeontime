
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { ShieldX, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "hr" | "employee";
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole = "employee" 
}: ProtectedRouteProps) => {
  const { session, user, isLoading: isAuthLoading, isSessionExpired, signOut } = useAuth();
  const { role, isLoading: isRoleLoading, hasRole } = useUserRole();

  useEffect(() => {
    if (isSessionExpired) {
      toast.warning("Votre session a expiré. Vous allez être redirigé vers la page de connexion.");
    }
  }, [isSessionExpired]);

  // Show loading state during initial auth and role check
  if (isAuthLoading || isRoleLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-5 py-3 backdrop-blur-xl shadow-card">
          <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-br from-primary to-accent" />
          <p className="text-sm font-medium text-muted-foreground">Vérification des accès…</p>
        </div>
      </div>
    );
  }

  // If session expired or no session, send visitor to the role selector
  if (isSessionExpired || !session) {
    return <Navigate to="/" replace />;
  }

  // Check if user has the required role
  if (!hasRole(requiredRole)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-md surface-2 p-10 text-center animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
            <ShieldX className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
            Accès non autorisé
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
            {requiredRole === "hr" && (
              <span className="mt-1 block">Cette zone est réservée aux responsables RH.</span>
            )}
          </p>

          {user?.email && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">
                Connecté&nbsp;: <span className="font-medium text-foreground">{user.email}</span>
                {role && <> · {role === "hr" ? "RH" : "employé"}</>}
              </span>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-2.5">
            {role === "employee" && (
              <a
                href="/employee"
                className="ring-focus inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent px-5 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:opacity-95 hover:shadow-elevation"
              >
                Accéder à mon espace employé
              </a>
            )}
            {role === "hr" && requiredRole === "employee" && (
              <a
                href="/hr"
                className="ring-focus inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent px-5 text-sm font-medium text-primary-foreground shadow-glow transition-all hover:opacity-95 hover:shadow-elevation"
              >
                Accéder à l'espace RH
              </a>
            )}
            <Button
              variant="outline"
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
              className="ring-focus h-11 gap-2 rounded-xl border-border/60"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter et changer de compte
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
