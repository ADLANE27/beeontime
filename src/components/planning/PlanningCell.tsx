import { cn } from "@/lib/utils";
import { leaveTypeColors } from "./LeaveTypeLegend";
import { Database } from "@/integrations/supabase/types";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];

interface PlanningCellProps {
  date: Date;
  leaveRequest?: LeaveRequest;
  isWeekend: boolean;
  isToday: boolean;
}

export const PlanningCell = ({
  date,
  leaveRequest,
  isWeekend,
  isToday
}: PlanningCellProps) => {
  if (!leaveRequest) {
    return (
      <td
        className={cn(
          "text-center p-2 min-w-[100px] whitespace-pre-line text-xs relative",
          {
            "bg-blue-50": isToday,
            "bg-gray-100": isWeekend
          }
        )}
      />
    );
  }

  const getLeaveColor = (type: string) => {
    switch (type) {
      case "vacation":
        return leaveTypeColors.vacation.color;
      case "rtt":
        return leaveTypeColors.rtt.color;
      case "paternity":
        return leaveTypeColors.paternity.color;
      case "maternity":
        return leaveTypeColors.maternity.color;
      case "sickChild":
        return leaveTypeColors.sickChild.color;
      default:
        return leaveTypeColors.other.color;
    }
  };

  const getLeaveLabel = (type: string) => {
    switch (type) {
      case "vacation":
        return "CP";
      case "rtt":
        return "RTT";
      case "paternity":
        return "CP";
      case "maternity":
        return "CM";
      case "sickChild":
        return "CEM";
      default:
        return "Autre";
    }
  };

  const backgroundColor = getLeaveColor(leaveRequest.type);

  return (
    <td
      className={cn(
        "text-center p-2 min-w-[100px] whitespace-pre-line text-xs relative",
        {
          "bg-blue-50": isToday,
          "bg-gray-100": isWeekend
        }
      )}
    >
      {leaveRequest.day_type === "half" ? (
        <div className="relative w-full h-full min-h-[40px]">
          <div 
            className={cn(
              "absolute inset-0",
              leaveRequest.period === "morning" ? "clip-path-left" : "clip-path-right"
            )}
            style={{ backgroundColor }}
          />
          <div className="relative z-10">
            <span className="font-medium">{getLeaveLabel(leaveRequest.type)}</span>
            <span className="text-xs block">
              {leaveRequest.period === "morning" ? "Matin" : "Après-midi"}
            </span>
          </div>
        </div>
      ) : (
        <div
          className="w-full h-full min-h-[40px] flex flex-col items-center justify-center"
          style={{ backgroundColor }}
        >
          <span className="font-medium">{getLeaveLabel(leaveRequest.type)}</span>
        </div>
      )}
    </td>
  );
};