
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
    <div className="min-h-screen w-full">
      <header className="glass-card sticky top-0 z-30">
        <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-end h-16 sm:h-18 md:h-20">
            <Button variant="ghost" onClick={handleLogout} className="gap-2 hover-scale hover:bg-primary/5 rounded-xl h-10 sm:h-11 md:h-12 px-4 sm:px-5 md:px-6 text-sm sm:text-base">
              <LogOut className="h-4 w-4" />
              <span className="font-medium hidden sm:inline">Se déconnecter</span>
              <span className="font-medium sm:hidden">Quitter</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-full mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10 md:py-12">
        {children}
      </main>
    </div>
  );
};
