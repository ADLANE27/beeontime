
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, Buildings } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname === "/hr";
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const getUserData = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const { data: userData, error } = await supabase
          .from('employees')
          .select('first_name, last_name')
          .eq('id', data.session.user.id)
          .single();
        
        if (!error && userData) {
          setUserName(`${userData.first_name} ${userData.last_name}`);
        }
      }
    };
    
    getUserData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/portal", { replace: true }); // Redirect to main portal instead of HR portal
    toast.success("Vous avez été déconnecté avec succès");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mr-2 flex items-center">
                <Buildings className="h-5 w-5 text-purple-600 mr-1.5" />
                {isAdmin ? "HR Admin" : "Dashboard"}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {userName && (
                <div className="hidden sm:flex items-center text-sm text-gray-600 mr-1 bg-gray-50 py-1.5 px-3 rounded-full border">
                  <UserCircle className="h-4 w-4 text-purple-500 mr-1.5" />
                  {userName}
                </div>
              )}
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="gap-2 border-gray-200 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Se déconnecter</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};
