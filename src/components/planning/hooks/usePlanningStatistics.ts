import { useMemo } from "react";
import { format, isToday } from "date-fns";

interface Employee {
  id: string;
}

interface LeaveRequest {
  employee_id: string;
  start_date: string;
  end_date: string;
  status: string;
  day_type: string;
}

interface TimeRecord {
  employee_id: string;
  date: string;
}

export const usePlanningStatistics = (
  employees: Employee[],
  leaveRequests: LeaveRequest[],
  timeRecords: TimeRecord[]
) => {
  return useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Calculate employees present/absent today
    const absentToday = leaveRequests.filter((request) => {
      return (
        request.status === "approved" &&
        today >= request.start_date &&
        today <= request.end_date
      );
    }).length;

    const presentToday = employees.length - absentToday;

    // Calculate total leave hours (approximate: full day = 8h, half day = 4h)
    const totalLeaveHours = leaveRequests
      .filter((request) => request.status === "approved")
      .reduce((total, request) => {
        const start = new Date(request.start_date);
        const end = new Date(request.end_date);
        const days = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        
        const hours = request.day_type === "half" ? days * 4 : days * 8;
        return total + hours;
      }, 0);

    // Calculate average presence rate
    const totalPossibleDays = employees.length * 30; // Approximate month
    const totalAbsentDays = leaveRequests
      .filter((request) => request.status === "approved")
      .reduce((total, request) => {
        const start = new Date(request.start_date);
        const end = new Date(request.end_date);
        const days = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        return total + (request.day_type === "half" ? days * 0.5 : days);
      }, 0);

    const averagePresenceRate = Math.round(
      ((totalPossibleDays - totalAbsentDays) / totalPossibleDays) * 100
    );

    return {
      totalEmployees: employees.length,
      presentToday,
      absentToday,
      totalLeaveHours,
      averagePresenceRate: isNaN(averagePresenceRate) ? 100 : averagePresenceRate,
    };
  }, [employees, leaveRequests, timeRecords]);
};
