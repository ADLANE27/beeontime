import { supabase } from "@/integrations/supabase/client";

interface LeaveNotificationDetails {
  startDate: string;
  endDate: string;
  leaveType: string;
  dayType: string;
  reason?: string;
}

interface OvertimeNotificationDetails {
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason?: string;
}

export const sendLeaveRequestNotification = async (
  employeeName: string,
  details: LeaveNotificationDetails
): Promise<void> => {
  try {
    console.log("Sending leave request notification for:", employeeName);
    
    const { data, error } = await supabase.functions.invoke('send-hr-notification', {
      body: {
        type: 'leave_request',
        employeeName,
        details: {
          startDate: details.startDate,
          endDate: details.endDate,
          leaveType: details.leaveType,
          dayType: details.dayType,
          reason: details.reason,
        },
      },
    });

    if (error) {
      console.error("Error sending leave notification:", error);
      // Don't throw - notification failure shouldn't block the main flow
    } else {
      console.log("Leave notification sent successfully:", data);
    }
  } catch (error) {
    console.error("Failed to send leave notification:", error);
    // Silently fail - notification is a nice-to-have
  }
};

export const sendOvertimeRequestNotification = async (
  employeeName: string,
  details: OvertimeNotificationDetails
): Promise<void> => {
  try {
    console.log("Sending overtime request notification for:", employeeName);
    
    const { data, error } = await supabase.functions.invoke('send-hr-notification', {
      body: {
        type: 'overtime_request',
        employeeName,
        details: {
          date: details.date,
          startTime: details.startTime,
          endTime: details.endTime,
          hours: details.hours,
          reason: details.reason,
        },
      },
    });

    if (error) {
      console.error("Error sending overtime notification:", error);
    } else {
      console.log("Overtime notification sent successfully:", data);
    }
  } catch (error) {
    console.error("Failed to send overtime notification:", error);
  }
};
