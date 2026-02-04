import { format, isToday, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { leaveTypeColors } from "./LeaveTypeLegend";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];
type TimeRecord = Database["public"]["Tables"]["time_records"]["Row"];

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
}

interface PlanningGridViewProps {
  employees: Employee[];
  days: Date[];
  leaveRequests: LeaveRequest[];
  timeRecords: TimeRecord[];
}

const leaveTypeLabels: Record<string, string> = {
  vacation: "Congés payés",
  annual: "Congé annuel",
  rtt: "RTT",
  paternity: "Congé paternité",
  maternity: "Congé maternité",
  sickChild: "Enfant malade",
  sickLeave: "Arrêt maladie",
  unpaidUnexcused: "Absence injustifiée",
  unpaidExcused: "Absence justifiée",
  unpaid: "Sans solde",
  familyEvent: "Événement familial",
};

export const PlanningGridView = ({
  employees,
  days,
  leaveRequests,
  timeRecords,
}: PlanningGridViewProps) => {
  const getLeaveForDay = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return leaveRequests.find(
      (r) => r.employee_id === employeeId && dateStr >= r.start_date && dateStr <= r.end_date
    );
  };

  const getTimeRecordForDay = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeRecords.find(
      (r) => r.employee_id === employeeId && r.date === dateStr
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl">
      <div className="min-w-max">
        {/* Header row with days */}
        <div className="flex sticky top-0 z-10 bg-background">
          <div className="w-52 flex-shrink-0 p-3 font-semibold text-sm border-b border-r bg-muted/30 rounded-tl-xl">
            Employé
          </div>
          {days.map((day, i) => (
            <div
              key={i}
              className={cn(
                "w-14 flex-shrink-0 p-2 text-center border-b transition-colors",
                isToday(day) && "bg-primary/10",
                isWeekend(day) && !isToday(day) && "bg-muted/50",
                i === days.length - 1 && "rounded-tr-xl"
              )}
            >
              <div className="text-[10px] font-medium text-muted-foreground uppercase">
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div className={cn(
                "text-sm font-semibold",
                isToday(day) && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Employee rows */}
        {employees.map((employee, rowIndex) => (
          <div
            key={employee.id}
            className={cn(
              "flex group",
              rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20",
              "hover:bg-primary/5 transition-colors"
            )}
          >
            {/* Employee name - sticky */}
            <div className={cn(
              "w-52 flex-shrink-0 p-3 border-r border-b sticky left-0 z-[5]",
              rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20",
              "group-hover:bg-primary/5 transition-colors"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {employee.first_name[0]}{employee.last_name[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">
                    {employee.first_name} {employee.last_name}
                  </div>
                  {employee.position && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {employee.position}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Day cells */}
            {days.map((day, dayIndex) => {
              const leave = getLeaveForDay(employee.id, day);
              const timeRecord = getTimeRecordForDay(employee.id, day);
              const leaveColor = leave
                ? leaveTypeColors[leave.type as keyof typeof leaveTypeColors]?.color
                : null;

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "w-14 flex-shrink-0 h-14 border-b relative flex items-center justify-center",
                    isToday(day) && "bg-primary/5",
                    isWeekend(day) && !isToday(day) && "bg-muted/30"
                  )}
                >
                  {leave ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110",
                            leave.day_type === 'half' && "h-5"
                          )}
                          style={{ backgroundColor: leaveColor || '#ccc' }}
                        >
                          <span className="text-white text-xs font-bold drop-shadow-sm">
                            {leave.day_type === 'half' ? '½' : ''}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{leaveTypeLabels[leave.type] || leave.type}</p>
                          <p className="text-xs text-muted-foreground">
                            Du {format(new Date(leave.start_date), 'dd/MM')} au {format(new Date(leave.end_date), 'dd/MM')}
                          </p>
                          {leave.reason && (
                            <p className="text-xs">{leave.reason}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : timeRecord?.morning_in ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-xs space-y-0.5">
                          {timeRecord.morning_in && <p>Arrivée: {timeRecord.morning_in.slice(0, 5)}</p>}
                          {timeRecord.evening_out && <p>Départ: {timeRecord.evening_out.slice(0, 5)}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
