
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

      const today = format(new Date(), "yyyy-MM-dd");

      // First, check if the employee has an approved leave request for today
      const { data: approvedLeaves, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', userId)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);

      if (leaveError) {
        console.error("Error fetching leave requests:", leaveError);
      }

      // Check if employee has a morning leave (half-day morning or full day)
      if (approvedLeaves && approvedLeaves.length > 0) {
        const hasMorningLeave = approvedLeaves.some(leave => {
          // Full day leave
          if (leave.day_type === 'full') {
            console.log("Employee has full day leave, skipping delay check");
            return true;
          }
          // Half-day morning leave
          if (leave.day_type === 'half' && leave.period === 'morning') {
            console.log("Employee has morning half-day leave, skipping delay check");
            return true;
          }
          return false;
        });

        if (hasMorningLeave) {
          console.log("Employee has approved leave for this morning, no delay will be recorded");
          return;
        }
      }

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
      
      // If employee has an afternoon leave, use the breakEndTime as scheduled arrival
      let scheduledTime = workSchedule.startTime;
      
      if (approvedLeaves && approvedLeaves.length > 0) {
        const hasAfternoonLeave = approvedLeaves.some(leave => 
          leave.day_type === 'half' && leave.period === 'afternoon'
        );
        
        // If afternoon leave, no need to adjust morning start time
        // The employee should still arrive at normal start time
        if (hasAfternoonLeave) {
          console.log("Employee has afternoon leave - checking normal morning arrival");
        }
      }

      if (!scheduledTime) {
        console.log("Start time not defined in work schedule for employee:", userId);
        return;
      }

      // Grace period in minutes (configurable tolerance before flagging as late)
      const GRACE_PERIOD_MINUTES = 5;

      // Compare arrival time with scheduled time
      const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
      const [actualHour, actualMinute] = actualTime.split(':').map(Number);

      const scheduledDate = new Date();
      scheduledDate.setHours(scheduledHour, scheduledMinute, 0);

      const actualDate = new Date();
      actualDate.setHours(actualHour, actualMinute, 0);

      // Add grace period to scheduled time
      const scheduledWithGrace = new Date(scheduledDate.getTime() + GRACE_PERIOD_MINUTES * 60 * 1000);

      console.log("Scheduled time:", scheduledDate);
      console.log("Scheduled time with grace period:", scheduledWithGrace);
      console.log("Actual time:", actualDate);
      console.log("Grace period:", GRACE_PERIOD_MINUTES, "minutes");

      // If employee is late (after grace period), create a delay entry
      if (actualDate > scheduledWithGrace) {
        // Calculate duration from original scheduled time (not from grace period end)
        const duration = (actualDate.getTime() - scheduledDate.getTime()) / (1000 * 60);
        const hours = Math.floor(duration / 60);
        const minutes = Math.round(duration % 60);
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
      } else if (actualDate > scheduledDate) {
        console.log("Employee arrived late but within grace period - no delay recorded");
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
      console.log("=== STARTING TIME RECORD ===");
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("User auth check:", { user: user?.id, error: userError });
      
      if (!user) {
        console.error("No authenticated user found");
        toast.error("Vous devez être connecté pour pointer");
        return;
      }

      const currentTimeStr = format(new Date(), "HH:mm");
      const today = format(new Date(), "yyyy-MM-dd");
      const nextAction = getNextAction();
      
      console.log("Time record details:", {
        userId: user.id,
        currentTime: currentTimeStr,
        today,
        nextAction,
        hasExistingRecord: !!timeRecord.id
      });

      if (!nextAction) {
        console.log("All time records completed for today");
        toast.error("Tous les pointages ont déjà été effectués aujourd'hui");
        return;
      }

      if (!timeRecord.id) {
        // First check-in of the day
        console.log("Creating new time record...");
        const insertData = {
          employee_id: user.id,
          date: today,
          [nextAction]: currentTimeStr
        };
        console.log("Insert data:", insertData);
        
        const { data, error } = await supabase
          .from("time_records")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          console.error("Error creating time record:", error);
          console.error("Error details:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          toast.error(`Erreur lors de l'enregistrement: ${error.message}`);
          return;
        }
        
        console.log("Time record created successfully:", data);
        
        setTimeRecord({
          id: data.id,
          morning_in: data.morning_in,
          lunch_out: data.lunch_out,
          lunch_in: data.lunch_in,
          evening_out: data.evening_out
        });

        // Check for delay only on morning check-in
        if (nextAction === "morning_in") {
          console.log("Checking for delay...");
          await checkForDelay(user.id, currentTimeStr);
        }
      } else {
        // Update existing record
        console.log("Updating existing time record...");
        const updateData = { [nextAction]: currentTimeStr };
        console.log("Update data:", updateData);
        
        const { data, error } = await supabase
          .from("time_records")
          .update(updateData)
          .eq("id", timeRecord.id)
          .select()
          .single();

        if (error) {
          console.error("Error updating time record:", error);
          console.error("Error details:", {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          toast.error(`Erreur lors de l'enregistrement: ${error.message}`);
          return;
        }
        
        console.log("Time record updated successfully:", data);
        
        setTimeRecord({
          id: data.id,
          morning_in: data.morning_in,
          lunch_out: data.lunch_out,
          lunch_in: data.lunch_in,
          evening_out: data.evening_out
        });
      }

      console.log("=== TIME RECORD SUCCESS ===");
      toast.success("Pointage enregistré avec succès");
    } catch (error) {
      console.error("=== UNEXPECTED ERROR IN TIME RECORD ===");
      console.error("Error:", error);
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error?.constructor?.name);
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
