
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, Building } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, profile } = useAuth();
  const isAdmin = location.pathname.startsWith("/hr");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use a simplified display name that doesn't depend on profile 
  // This prevents a dependency on profile data availability
  const userName = user?.email?.split('@')[0] || 'User';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    const toastId = toast.loading("Déconnexion en cours...");
    
    try {
      await signOut();
      toast.dismiss(toastId);
      toast.success("Déconnexion réussie");
      navigate("/portal", { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      toast.dismiss(toastId);
      toast.error("Erreur lors de la déconnexion");
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
              <div className="hidden sm:flex items-center text-sm text-gray-600 mr-1 bg-gray-50 py-1.5 px-3 rounded-full border">
                <UserCircle className="h-4 w-4 text-purple-500 mr-1.5" />
                {userName}
              </div>
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
