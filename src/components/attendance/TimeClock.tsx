import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const TimeClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [checkInId, setCheckInId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Vérifier si l'employé a déjà pointé aujourd'hui
    const checkTodayAttendance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: attendance } = await supabase
        .from("delays")
        .select("id, actual_time")
        .eq("employee_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (attendance) {
        setHasCheckedIn(true);
        setCheckInId(attendance.id);
      }
    };

    checkTodayAttendance();
    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(currentTime, "EEEE d MMMM yyyy", { locale: fr });
  const formattedTime = format(currentTime, "HH:mm:ss");

  const handleCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour pointer");
        return;
      }

      const { data, error } = await supabase
        .from("delays")
        .insert({
          employee_id: user.id,
          date: format(currentTime, "yyyy-MM-dd"),
          scheduled_time: "09:00",
          actual_time: format(currentTime, "HH:mm"),
          duration: "0",
          reason: "Pointage arrivée"
        })
        .select()
        .single();

      if (error) throw error;

      setCheckInId(data.id);
      setHasCheckedIn(true);
      toast.success("Arrivée enregistrée avec succès");
    } catch (error) {
      console.error("Erreur lors du pointage:", error);
      toast.error("Erreur lors de l'enregistrement du pointage");
    }
  };

  const handleCheckOut = async () => {
    if (!checkInId) {
      toast.error("Aucun pointage d'entrée trouvé");
      return;
    }

    try {
      const checkOutTime = format(currentTime, "HH:mm");
      const { error } = await supabase
        .from("delays")
        .update({
          reason: `Pointage arrivée-sortie (${checkOutTime})`,
          status: 'approved'
        })
        .eq('id', checkInId);

      if (error) throw error;

      setHasCheckedIn(false);
      setCheckInId(null);
      toast.success("Départ enregistré avec succès");
    } catch (error) {
      console.error("Erreur lors du pointage de sortie:", error);
      toast.error("Erreur lors de l'enregistrement du pointage de sortie");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <p className="text-lg text-gray-600">{formattedDate}</p>
          <p className="text-4xl font-bold tracking-tight">{formattedTime}</p>
        </div>
        
        <div className="flex gap-4">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700"
            onClick={handleCheckIn}
            disabled={hasCheckedIn}
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Pointer arrivée
          </Button>
          
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleCheckOut}
            disabled={!hasCheckedIn}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Pointer sortie
          </Button>
        </div>
      </div>
    </Card>
  );
};