import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WorkSchedule {
  startTime: string;
  endTime: string;
  breakStartTime: string;
  breakEndTime: string;
}

export const TimeClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRecord, setTimeRecord] = useState<{
    id: string | null;
    morning_in: string | null;
    lunch_out: string | null;
    lunch_in: string | null;
    evening_out: string | null;
  }>({
    id: null,
    morning_in: null,
    lunch_out: null,
    lunch_in: null,
    evening_out: null
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Check if employee has already checked in today
    const checkTodayTimeRecord = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: record } = await supabase
        .from("time_records")
        .select("*")
        .eq("employee_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (record) {
        setTimeRecord({
          id: record.id,
          morning_in: record.morning_in,
          lunch_out: record.lunch_out,
          lunch_in: record.lunch_in,
          evening_out: record.evening_out
        });
      }
    };

    checkTodayTimeRecord();
    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(currentTime, "EEEE d MMMM yyyy", { locale: fr });
  const formattedTime = format(currentTime, "HH:mm:ss");

  const getNextAction = () => {
    if (!timeRecord.morning_in) return "morning_in";
    if (!timeRecord.lunch_out) return "lunch_out";
    if (!timeRecord.lunch_in) return "lunch_in";
    if (!timeRecord.evening_out) return "evening_out";
    return null;
  };

  const getButtonLabel = () => {
    const action = getNextAction();
    switch (action) {
      case "morning_in": return "Pointer arrivée";
      case "lunch_out": return "Pointer départ pause";
      case "lunch_in": return "Pointer retour pause";
      case "evening_out": return "Pointer départ";
      default: return "Journée terminée";
    }
  };

  const checkForDelay = async (userId: string, actualTime: string) => {
    try {
      // Récupérer l'emploi du temps de l'employé
      const { data: employee } = await supabase
        .from('employees')
        .select('work_schedule')
        .eq('id', userId)
        .maybeSingle();

      if (!employee?.work_schedule) return;

      const workSchedule = employee.work_schedule as WorkSchedule;
      const scheduledTime = workSchedule.startTime;
      const today = format(new Date(), "yyyy-MM-dd");

      // Comparer l'heure d'arrivée avec l'heure prévue
      const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
      const [actualHour, actualMinute] = actualTime.split(':').map(Number);

      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledHour, scheduledMinute, 0);

      const actualDate = new Date();
      actualDate.setHours(actualHour, actualMinute, 0);

      // Si l'employé est en retard, créer une entrée dans la table delays
      if (actualDate > scheduledDate) {
        const duration = (actualDate.getTime() - scheduledDate.getTime()) / (1000 * 60); // en minutes
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const formattedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

        await supabase
          .from('delays')
          .insert({
            employee_id: userId,
            date: today,
            scheduled_time: scheduledTime,
            actual_time: actualTime,
            duration: formattedDuration,
            reason: "Pointage arrivée"
          });

        toast.info("Retard détecté et enregistré pour validation par les RH");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du retard:", error);
    }
  };

  const handleTimeRecord = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour pointer");
        return;
      }

      const currentTimeStr = format(currentTime, "HH:mm");
      const today = format(currentTime, "yyyy-MM-dd");
      const nextAction = getNextAction();

      if (!nextAction) {
        toast.error("Tous les pointages ont déjà été effectués aujourd'hui");
        return;
      }

      if (!timeRecord.id) {
        // First check-in of the day
        const { data, error } = await supabase
          .from("time_records")
          .insert({
            employee_id: user.id,
            date: today,
            [nextAction]: currentTimeStr
          })
          .select()
          .single();

        if (error) throw error;
        setTimeRecord({
          id: data.id,
          morning_in: data.morning_in,
          lunch_out: data.lunch_out,
          lunch_in: data.lunch_in,
          evening_out: data.evening_out
        });

        // Si c'est le pointage du matin, vérifier s'il y a un retard
        if (nextAction === "morning_in") {
          await checkForDelay(user.id, currentTimeStr);
        }
      } else {
        // Update existing record
        const { data, error } = await supabase
          .from("time_records")
          .update({ [nextAction]: currentTimeStr })
          .eq("id", timeRecord.id)
          .select()
          .single();

        if (error) throw error;
        setTimeRecord({
          id: data.id,
          morning_in: data.morning_in,
          lunch_out: data.lunch_out,
          lunch_in: data.lunch_in,
          evening_out: data.evening_out
        });
      }

      toast.success("Pointage enregistré avec succès");
    } catch (error) {
      console.error("Erreur lors du pointage:", error);
      toast.error("Erreur lors de l'enregistrement du pointage");
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
          {getNextAction() ? (
            <Button
              size="lg"
              className={getNextAction() === "evening_out" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              onClick={handleTimeRecord}
            >
              {getNextAction() === "evening_out" ? (
                <ArrowLeft className="mr-2 h-5 w-5" />
              ) : (
                <ArrowRight className="mr-2 h-5 w-5" />
              )}
              {getButtonLabel()}
            </Button>
          ) : (
            <Button size="lg" disabled>
              Journée terminée
            </Button>
          )}
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          {timeRecord.morning_in && (
            <p>Arrivée : {timeRecord.morning_in}</p>
          )}
          {timeRecord.lunch_out && (
            <p>Départ pause : {timeRecord.lunch_out}</p>
          )}
          {timeRecord.lunch_in && (
            <p>Retour pause : {timeRecord.lunch_in}</p>
          )}
          {timeRecord.evening_out && (
            <p>Départ : {timeRecord.evening_out}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
