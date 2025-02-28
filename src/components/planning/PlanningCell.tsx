import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];
type TimeRecord = Database["public"]["Tables"]["time_records"]["Row"];

interface PlanningCellProps {
  date: Date;
  leaveRequest?: LeaveRequest;
  timeRecord?: TimeRecord;
  isWeekend?: boolean;
  isToday?: boolean;
}

const getTimeRecordDisplay = (timeRecord: TimeRecord) => {
  const times = [];
  if (timeRecord.morning_in) times.push(`Arrivée: ${timeRecord.morning_in}`);
  if (timeRecord.lunch_out) times.push(`Départ déjeuner: ${timeRecord.lunch_out}`);
  if (timeRecord.lunch_in) times.push(`Retour déjeuner: ${timeRecord.lunch_in}`);
  if (timeRecord.evening_out) times.push(`Départ: ${timeRecord.evening_out}`);
  return times.join('\n');
};

export const PlanningCell = ({ date, leaveRequest, timeRecord, isWeekend, isToday }: PlanningCellProps) => {
  const baseClasses = "text-center p-2 h-16 relative";
  const todayClasses = isToday ? "bg-blue-50" : "";
  const weekendClasses = isWeekend ? "bg-gray-50" : "";
  
  const getLeaveContent = () => {
    if (!leaveRequest) return null;
    
    const isHalfDay = leaveRequest.day_type === 'half';
    const period = leaveRequest.period;
    
    return (
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        isHalfDay ? (period === 'morning' ? "top-0 h-1/2" : "bottom-0 h-1/2") : ""
      )}>
        <div className="w-full h-full bg-green-200 opacity-50" />
        <span className="absolute text-xs">
          {isHalfDay ? '½' : '✓'}
        </span>
      </div>
    );
  };

  const getTimeRecordContent = () => {
    if (!timeRecord) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-500 overflow-hidden">
        {timeRecord.morning_in && format(new Date(`2000-01-01T${timeRecord.morning_in}`), 'HH:mm')}
      </div>
    );
  };

  return (
    <TableCell className={cn(baseClasses, todayClasses, weekendClasses)}>
      {timeRecord ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full h-full">
              {getLeaveContent()}
              {getTimeRecordContent()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="whitespace-pre-line">{getTimeRecordDisplay(timeRecord)}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="w-full h-full">
          {getLeaveContent()}
        </div>
      )}
    </TableCell>
  );
};