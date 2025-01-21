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
    navigate("/hr-portal"); // Redirection vers le portail RH au lieu de /auth
    toast.success("Vous avez été déconnecté avec succès");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-16">
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};