
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname === "/hr";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/portal", { replace: true }); // Redirect to main portal instead of HR portal
    toast.success("Vous avez été déconnecté avec succès");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full">
      <header className="bg-gradient-to-r from-primary/95 to-primary/75 text-primary-foreground shadow-md sticky top-0 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg font-semibold">
              {isAdmin ? "Tableau de bord RH" : "Espace Employé"}
            </h1>
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              className="gap-2 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};
