import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname === "/hr";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(currentTime, "EEEE d MMMM yyyy", { locale: fr });
  const formattedTime = format(currentTime, "HH:mm");

  const handleClockIn = () => {
    const scheduledStart = "09:00";
    const currentHourMin = format(currentTime, "HH:mm");
    
    const [schedH, schedM] = scheduledStart.split(":").map(Number);
    const [currH, currM] = currentHourMin.split(":").map(Number);
    
    const schedMinutes = schedH * 60 + schedM;
    const currMinutes = currH * 60 + currM;
    
    const delayMinutes = currMinutes - schedMinutes;
    
    if (delayMinutes > 0) {
      const delays = JSON.parse(localStorage.getItem("delays") || "[]");
      delays.push({
        id: Date.now(),
        employeeId: "1",
        employeeName: "Jean Dupont",
        date: format(currentTime, "yyyy-MM-dd"),
        scheduledTime: scheduledStart,
        actualTime: currentHourMin,
        duration: `${delayMinutes}min`,
        status: "En attente de confirmation",
        reason: "Pointage automatique"
      });
      localStorage.setItem("delays", JSON.stringify(delays));
    }

    toast.success(`Présence enregistrée le ${formattedDate} à ${formattedTime}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Vous avez été déconnecté avec succès");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                {isAdmin ? "Portail RH" : "Pointeuse AFTraduction"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {!isAdmin && (
                <>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{formattedDate}</p>
                    <p className="text-lg font-semibold">{formattedTime}</p>
                  </div>
                  <Button onClick={handleClockIn} className="bg-green-600 hover:bg-green-700">
                    <Clock className="mr-2 h-4 w-4" />
                    Pointer ma présence
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
        {children}
      </nav>

      <div className="pt-16">
        <main className="flex-1 relative z-0 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8 h-full">
        </main>
      </div>
    </div>
  );
};