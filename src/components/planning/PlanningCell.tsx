
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { leaveTypeColors } from "./LeaveTypeLegend";

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
  const baseClasses = "text-center p-2 h-16 relative transition-all duration-200 group";
  const todayClasses = isToday 
    ? "bg-gradient-to-br from-blue-50/90 to-blue-100/30 ring-2 ring-blue-200/50 ring-inset" 
    : "";
  const weekendClasses = isWeekend 
    ? "bg-gradient-to-br from-gray-50/80 to-gray-100/50 border-gray-100" 
    : "";
  const hoverClasses = "hover:shadow-md hover:z-10 hover:scale-[1.01]";
  
  const getLeaveContent = () => {
    if (!leaveRequest) return null;
    
    const isHalfDay = leaveRequest.day_type === 'half';
    const period = leaveRequest.period;
    const leaveType = leaveRequest.type as keyof typeof leaveTypeColors || 'other';
    
    // Use color from LeaveTypeLegend or fallback to a default
    const bgColorClass = leaveTypeColors[leaveType] 
      ? `bg-gradient-to-r from-${leaveTypeColors[leaveType].color.replace('#', '')}/50 to-${leaveTypeColors[leaveType].color.replace('#', '')}/30` 
      : "bg-green-200/50";
    
    return (
      <div className={cn(
        "absolute inset-0 flex items-center justify-center rounded-sm overflow-hidden",
        isHalfDay ? (period === 'morning' ? "clip-path-left" : "clip-path-right") : ""
      )}>
        <div className={cn(
          "w-full h-full opacity-70",
          bgColorClass
        )} />
        <span className="absolute text-xs font-medium">
          {isHalfDay ? '½' : '✓'}
        </span>
      </div>
    );
  };

  const getTimeRecordContent = () => {
    if (!timeRecord) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-600 font-medium overflow-hidden px-1 py-0.5 bg-white/40 backdrop-blur-sm opacity-90 group-hover:opacity-100">
        {timeRecord.morning_in && (
          <span className="flex justify-center space-x-1">
            <span>⏱️</span>
            <span>{format(new Date(`2000-01-01T${timeRecord.morning_in}`), 'HH:mm')}</span>
          </span>
        )}
      </div>
    );
  };

  const getHoverEffect = () => {
    if (!leaveRequest && !timeRecord) return null;
    
    return (
      <div className="absolute top-0 right-0 m-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
      </div>
    );
  };

  return (
    <TableCell className={cn(baseClasses, todayClasses, weekendClasses, hoverClasses)}>
      {(timeRecord || leaveRequest) ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full h-full cursor-pointer">
              {getLeaveContent()}
              {getTimeRecordContent()}
              {getHoverEffect()}
            </div>
          </TooltipTrigger>
          <TooltipContent className="p-3 max-w-xs bg-white/95 backdrop-blur-sm shadow-lg rounded-lg border border-gray-100">
            <div className="space-y-2">
              <div className="font-medium text-sm">{format(date, 'EEEE dd MMMM yyyy')}</div>
              {leaveRequest && (
                <div className="text-sm text-gray-600 border-t pt-1">
                  <span className="font-medium">Congé: </span>
                  {leaveRequest.type}
                  {leaveRequest.day_type === 'half' && (
                    <span> ({leaveRequest.period === 'morning' ? 'Matin' : 'Après-midi'})</span>
                  )}
                </div>
              )}
              {timeRecord && (
                <div className="text-xs text-gray-500 border-t pt-1 whitespace-pre-line">
                  {getTimeRecordDisplay(timeRecord)}
                </div>
              )}
            </div>
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
