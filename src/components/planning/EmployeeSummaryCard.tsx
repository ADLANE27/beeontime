import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Clock, CheckCircle2, XCircle, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];
type TimeRecord = Database["public"]["Tables"]["time_records"]["Row"];

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
}

interface EmployeeSummaryCardProps {
  employee: Employee;
  todayLeave?: LeaveRequest;
  todayTimeRecord?: TimeRecord;
  monthlyLeaveCount: number;
  isPresent: boolean;
}

const leaveTypeLabels: Record<string, string> = {
  vacation: "Congés",
  annual: "Annuel",
  rtt: "RTT",
  paternity: "Paternité",
  maternity: "Maternité",
  sickChild: "Enfant malade",
  sickLeave: "Maladie",
  unpaidUnexcused: "Abs. injustifiée",
  unpaidExcused: "Abs. justifiée",
  unpaid: "Sans solde",
  familyEvent: "Événement familial",
};

export const EmployeeSummaryCard = ({
  employee,
  todayLeave,
  todayTimeRecord,
  monthlyLeaveCount,
  isPresent,
}: EmployeeSummaryCardProps) => {
  const getStatusIcon = () => {
    if (todayLeave) {
      return <Plane className="h-4 w-4 text-accent" />;
    }
    if (isPresent) {
      return <CheckCircle2 className="h-4 w-4 text-accent" />;
    }
    return <XCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (todayLeave) {
      return leaveTypeLabels[todayLeave.type] || todayLeave.type;
    }
    if (isPresent) {
      return "Présent";
    }
    return "Non pointé";
  };

  const getStatusColor = () => {
    if (todayLeave) return "bg-accent/10 text-accent border-accent/20";
    if (isPresent) return "bg-accent/10 text-accent border-accent/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <Card className={cn(
      "p-4 transition-all hover:shadow-card group cursor-pointer",
      todayLeave && "border-l-4 border-l-accent"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {employee.first_name[0]}{employee.last_name[0]}
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {employee.first_name} {employee.last_name}
            </h4>
            {employee.position && (
              <p className="text-xs text-muted-foreground truncate">
                {employee.position}
              </p>
            )}
          </div>
        </div>
        
        <Badge 
          variant="outline" 
          className={cn("flex-shrink-0 gap-1.5 font-medium", getStatusColor())}
        >
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
        </Badge>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
        {todayTimeRecord?.morning_in && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Arrivée {todayTimeRecord.morning_in.slice(0, 5)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{monthlyLeaveCount} jour{monthlyLeaveCount > 1 ? 's' : ''} ce mois</span>
        </div>
      </div>
    </Card>
  );
};
