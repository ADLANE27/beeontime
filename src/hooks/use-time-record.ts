
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface TimeRecord {
  id: string | null;
  morning_in: string | null;
  lunch_out: string | null;
  lunch_in: string | null;
  evening_out: string | null;
}

export const useTimeRecord = () => {
  const [timeRecord, setTimeRecord] = useState<TimeRecord>({
    id: null,
    morning_in: null,
    lunch_out: null,
    lunch_in: null,
    evening_out: null
  });
  
  useEffect(() => {
    // Check if employee has already checked in today
    const checkTodayTimeRecord = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = format(new Date(), "yyyy-MM-dd");
        const { data: record, error } = await supabase
          .from("time_records")
          .select("*")
          .eq("employee_id", user.id)
          .eq("date", today)
          .maybeSingle();

        if (error) {
          console.error("Error fetching time record:", error);
          return;
        }

        if (record) {
          setTimeRecord({
            id: record.id,
            morning_in: record.morning_in,
            lunch_out: record.lunch_out,
            lunch_in: record.lunch_in,
            evening_out: record.evening_out
          });
        }
      } catch (error) {
        console.error("Error in checkTodayTimeRecord:", error);
      }
    };

    checkTodayTimeRecord();
  }, []);

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
      console.log("Checking for delay - User ID:", userId);
      console.log("Actual arrival time:", actualTime);

      // Get employee's work schedule using employee_id
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('work_schedule, first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      if (employeeError) {
        console.error("Error fetching employee schedule:", employeeError);
        return;
      }

      if (!employee?.work_schedule) {
        console.log("No work schedule found for employee:", userId);
        return;
      }

      console.log("Employee data:", employee);
      console.log("Work schedule:", employee.work_schedule);

      const workSchedule = employee.work_schedule as any;
      if (!workSchedule.startTime) {
        console.log("Start time not defined in work schedule for employee:", userId);
        return;
      }

      const scheduledTime = workSchedule.startTime;
      const today = format(new Date(), "yyyy-MM-dd");

      // Compare arrival time with scheduled time
      const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
      const [actualHour, actualMinute] = actualTime.split(':').map(Number);

      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledHour, scheduledMinute, 0);

      const actualDate = new Date();
      actualDate.setHours(actualHour, actualMinute, 0);

      console.log("Scheduled time:", scheduledDate);
      console.log("Actual time:", actualDate);

      // If employee is late, create a delay entry
      if (actualDate > scheduledDate) {
        const duration = (actualDate.getTime() - scheduledDate.getTime()) / (1000 * 60);
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        const formattedDuration = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

        console.log("Delay detected for employee:", employee.first_name, employee.last_name);
        console.log("Delay duration:", formattedDuration);

        const { error: delayError } = await supabase
          .from('delays')
          .insert({
            employee_id: userId,
            date: today,
            scheduled_time: scheduledTime,
            actual_time: actualTime,
            duration: formattedDuration,
            reason: "Pointage arrivée"
          });

        if (delayError) {
          console.error("Error recording delay:", delayError);
          toast.error("Erreur lors de l'enregistrement du retard");
          return;
        }

        toast.info("Retard détecté et enregistré pour validation par les RH");
        console.log("Delay successfully recorded");
      } else {
        console.log("No delay detected for employee:", employee.first_name, employee.last_name);
      }
    } catch (error) {
      console.error("Error in delay check process:", error);
      toast.error("Erreur lors de la vérification du retard");
    }
  };

  const handleTimeRecord = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour pointer");
        return;
      }

      const currentTimeStr = format(new Date(), "HH:mm");
      const today = format(new Date(), "yyyy-MM-dd");
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

        if (error) {
          console.error("Error creating time record:", error);
          toast.error("Erreur lors de l'enregistrement du pointage");
          return;
        }
        
        setTimeRecord({
          id: data.id,
          morning_in: data.morning_in,
          lunch_out: data.lunch_out,
          lunch_in: data.lunch_in,
          evening_out: data.evening_out
        });

        // Check for delay only on morning check-in
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

        if (error) {
          console.error("Error updating time record:", error);
          toast.error("Erreur lors de l'enregistrement du pointage");
          return;
        }
        
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

  return {
    timeRecord,
    getNextAction,
    getButtonLabel,
    handleTimeRecord
  };
};
