
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  const baseClasses = "text-center p-2 h-16 relative transition-all duration-300 group cursor-pointer";
  const todayClasses = isToday 
    ? "bg-gradient-to-br from-blue-50/90 to-blue-100/30 ring-2 ring-blue-200/50 ring-inset" 
    : "";
  const weekendClasses = isWeekend 
    ? "bg-gradient-to-br from-gray-50/80 to-gray-100/50 border-gray-100" 
    : "";
  const hoverClasses = "hover:shadow-md hover:z-10 hover:scale-[1.02] hover:shadow-blue-100";
  
  const getLeaveContent = () => {
    if (!leaveRequest) return null;
    
    const isHalfDay = leaveRequest.day_type === 'half';
    const period = leaveRequest.period;
    const leaveType = leaveRequest.type as keyof typeof leaveTypeColors || 'other';
    
    const color = leaveTypeColors[leaveType]?.color || '#E0E0E0';
    const gradientStyle = {
      background: `linear-gradient(to right, ${color}70 0%, ${color}50 100%)`,
      boxShadow: `inset 0 0 0 1px ${color}50`
    };
    
    // Enhanced positioning and styling for half-day labels
    const getMorningLabel = () => (
      <div 
        className="absolute top-[33%] left-[8%] transform -rotate-40 bg-white/90 px-0.5 py-0.5 rounded-sm shadow-sm
                text-[7px] font-semibold text-gray-800 whitespace-nowrap z-10 leading-tight"
        style={{ letterSpacing: '-0.01em' }}
      >
        Matin
      </div>
    );
    
    const getAfternoonLabel = () => (
      <div 
        className="absolute top-[33%] right-[7%] transform rotate-40 bg-white/90 px-0.5 py-0.5 rounded-sm shadow-sm
                text-[7px] font-semibold text-gray-800 whitespace-nowrap z-10 leading-tight"
        style={{ letterSpacing: '-0.01em' }}
      >
        Après-midi
      </div>
    );
    
    const getFullDayLabel = () => (
      <div 
        className="absolute top-1/3 inset-x-0 bg-white/80 backdrop-blur-[1px] mx-auto w-fit px-1.5 py-0.5 rounded-sm shadow-sm
                text-[9px] font-medium text-gray-800 z-10 text-center"
      >
        Journée
      </div>
    );
    
    return (
      <div className={cn(
        "absolute inset-0 rounded-sm overflow-hidden transition-opacity duration-300",
        isHalfDay ? (period === 'morning' ? "clip-path-left" : "clip-path-right") : ""
      )}>
        <div className="w-full h-full opacity-80 group-hover:opacity-90 transition-opacity duration-300" style={gradientStyle} />
        
        {isHalfDay 
          ? (period === 'morning' ? getMorningLabel() : getAfternoonLabel())
          : getFullDayLabel()
        }
      </div>
    );
  };

  const getTimeRecordContent = () => {
    if (!timeRecord) return null;

    // Make sure at least one time value exists
    const hasTimeRecords = timeRecord.morning_in || timeRecord.lunch_out || 
                          timeRecord.lunch_in || timeRecord.evening_out;
    
    if (!hasTimeRecords) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-600 font-medium overflow-hidden px-1 py-0.5 
                      bg-white/40 backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-all duration-300
                      border-t border-gray-100/50">
        {timeRecord.morning_in && (
          <span className="flex justify-center space-x-1">
            <span className="group-hover:rotate-12 transition-transform duration-300">⏱️</span>
            <span>{format(new Date(`2000-01-01T${timeRecord.morning_in}`), 'HH:mm')}</span>
          </span>
        )}
      </div>
    );
  };

  const getHoverIndicator = () => {
    return (
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm animate-pulse"></div>
      </div>
    );
  };

  return (
    <TableCell className={cn(baseClasses, todayClasses, weekendClasses, hoverClasses)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full h-full">
            {getLeaveContent()}
            {getTimeRecordContent()}
            {getHoverIndicator()}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="p-3 max-w-xs bg-white/95 backdrop-blur-sm shadow-lg rounded-lg border border-gray-100 animate-in fade-in-50 duration-300">
          <div className="space-y-2">
            <div className="font-medium text-sm text-blue-900">{format(date, 'EEEE dd MMMM yyyy', { locale: fr })}</div>
            {leaveRequest && (
              <div className="text-sm text-gray-600 border-t pt-1">
                <span className="font-medium">Congé: </span>
                {leaveTypeColors[leaveRequest.type as keyof typeof leaveTypeColors]?.label || leaveRequest.type}
                {leaveRequest.day_type === 'half' && (
                  <span className="ml-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-gray-100">
                    {leaveRequest.period === 'morning' ? 'Matin' : 'Après-midi'}
                  </span>
                )}
              </div>
            )}
            {timeRecord && (
              <div className="text-xs text-gray-500 border-t pt-1 space-y-1">
                {timeRecord.morning_in && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500">Arrivée:</span> 
                    <span>{timeRecord.morning_in}</span>
                  </div>
                )}
                {timeRecord.lunch_out && (
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500">Départ déjeuner:</span> 
                    <span>{timeRecord.lunch_out}</span>
                  </div>
                )}
                {timeRecord.lunch_in && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">Retour déjeuner:</span> 
                    <span>{timeRecord.lunch_in}</span>
                  </div>
                )}
                {timeRecord.evening_out && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">Départ:</span> 
                    <span>{timeRecord.evening_out}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
};
