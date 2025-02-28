
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, Building } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const isAdmin = location.pathname.startsWith("/hr");
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const getUserData = async () => {
      try {
        if (user?.id) {
          const { data: userData, error } = await supabase
            .from('employees')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();
          
          if (!error && userData) {
            setUserName(`${userData.first_name} ${userData.last_name}`);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    getUserData();
  }, [user]);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    try {
      console.log("Logout initiated");
      await signOut();
      
      // Force navigation to portal
      console.log("Navigating to portal after logout");
      navigate("/portal", { replace: true });
      
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error("Erreur lors de la déconnexion");
      
      // As a fallback, try direct logout and force navigation
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Direct logout failed:", e);
      } finally {
        // Always navigate to portal regardless of errors
        window.location.href = "/portal";
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mr-2 flex items-center">
                <Building className="h-5 w-5 text-purple-600 mr-1.5" />
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
                disabled={isLoggingOut}
                className="gap-2 border-gray-200 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}</span>
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
