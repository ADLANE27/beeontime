import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isToday, isWeekend, startOfWeek, endOfWeek, addWeeks, subWeeks, parse, setHours } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeaveTypeLegend } from "./LeaveTypeLegend";
import { PlanningCell } from "./PlanningCell";
import { Database } from "@/integrations/supabase/types";
import { generatePlanningPDF } from "@/utils/pdf";
import { createEvents } from 'ics';
import { toast } from "sonner";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"];
type TimeRecord = Database["public"]["Tables"]["time_records"]["Row"];

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
}

const leaveTypeTranslations: { [key: string]: string } = {
  "vacation": "Congés payés",
  "annual": "Congé annuel",
  "rtt": "RTT",
  "paternity": "Congé paternité",
  "maternity": "Congé maternité",
  "sickChild": "Congé enfant malade",
  "unpaidUnexcused": "Absence injustifiée non rémunérée",
  "unpaidExcused": "Absence justifiée non rémunérée",
  "unpaid": "Absence non rémunérée",
  "familyEvent": "Absences pour événements familiaux"
};

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const AdminPlanning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const firstDayOfPeriod = viewMode === 'month' 
    ? startOfMonth(currentDate)
    : startOfWeek(currentDate, { locale: fr });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return;
      }

      setEmployees(employeesData || []);

      // Fetch approved leave requests for the current month
      const startDate = format(firstDayOfPeriod, 'yyyy-MM-dd');
      const endDate = format(
        viewMode === 'month' 
          ? new Date(firstDayOfPeriod.getFullYear(), firstDayOfPeriod.getMonth() + 1, 0)
          : endOfWeek(currentDate, { locale: fr }),
        'yyyy-MM-dd'
      );

      const { data: leaveData, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'approved')
        .gte('start_date', startDate)
        .lte('end_date', endDate);

      if (leaveError) {
        console.error('Error fetching leave requests:', leaveError);
        return;
      }

      setLeaveRequests(leaveData || []);

      // Fetch time records for the current period
      const { data: timeData, error: timeError } = await supabase
        .from('time_records')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (timeError) {
        console.error('Error fetching time records:', timeError);
        return;
      }

      setTimeRecords(timeData || []);
    };

    fetchData();
  }, [currentDate, viewMode]);

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const previousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const getDaysToShow = () => {
    const days: Date[] = [];
    const lastDay = viewMode === 'month'
      ? new Date(firstDayOfPeriod.getFullYear(), firstDayOfPeriod.getMonth() + 1, 0)
      : endOfWeek(currentDate, { locale: fr });
    
    for (let i = firstDayOfPeriod.getDate(); i <= lastDay.getDate(); i++) {
      const date = new Date(firstDayOfPeriod.getFullYear(), firstDayOfPeriod.getMonth(), i);
      days.push(date);
    }
    return days;
  };

  const getLeaveRequestForDay = (employeeId: string, date: Date) => {
    return leaveRequests.find(request => {
      const currentDate = format(date, 'yyyy-MM-dd');
      return (
        request.employee_id === employeeId &&
        currentDate >= request.start_date &&
        currentDate <= request.end_date
      );
    });
  };

  const getTimeRecordForDay = (employeeId: string, date: Date) => {
    return timeRecords.find(record => {
      const currentDate = format(date, 'yyyy-MM-dd');
      return record.employee_id === employeeId && record.date === currentDate;
    });
  };

  const handleExportPDF = () => {
    generatePlanningPDF(employees, currentDate, leaveRequests, viewMode);
  };

  const handleExportICS = () => {
    const events = leaveRequests
      .filter(request => request.status === 'approved')
      .map(request => {
        const startDate = parse(request.start_date, 'yyyy-MM-dd', new Date());
        const endDate = parse(request.end_date, 'yyyy-MM-dd', new Date());
        const employee = employees.find(e => e.id === request.employee_id);
        
        // Définir les heures de début et de fin en fonction du type de journée
        let startHour = 9; // Heure de début par défaut
        let endHour = 18; // Heure de fin par défaut
        
        if (request.day_type === 'half') {
          if (request.period === 'morning') {
            endHour = 13;
          } else {
            startHour = 14;
          }
        }

        const periodText = request.day_type === 'half' 
          ? request.period === 'morning' ? ' (Matin)' : ' (Après-midi)'
          : '';
        
        return {
          start: [
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate(),
            startHour,
            0
          ] as [number, number, number, number, number],
          end: [
            endDate.getFullYear(),
            endDate.getMonth() + 1,
            endDate.getDate(),
            endHour,
            0
          ] as [number, number, number, number, number],
          title: `Absence: ${leaveTypeTranslations[request.type]}${periodText} - ${employee?.first_name} ${employee?.last_name}`,
          description: request.reason || '',
          status: 'CONFIRMED' as const
        };
      });

    createEvents(events, (error: Error | undefined, value: string) => {
      if (error) {
        console.error(error);
        toast.error("Erreur lors de la génération du fichier iCal");
        return;
      }

      const blob = new Blob([value], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `planning-${format(currentDate, 'yyyy-MM')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Planning exporté au format iCal");
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-6 glass-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button variant="outline" size="icon" onClick={previousPeriod} className="hover-scale">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg sm:text-xl font-semibold">
              {capitalizeFirstLetter(
                format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semaine du' dd MMMM yyyy", { locale: fr })
              )}
            </h2>
            <Button variant="outline" size="icon" onClick={nextPeriod} className="hover-scale">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
              className="text-xs sm:text-sm hover-scale"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {viewMode === 'month' ? 'Vue semaine' : 'Vue mois'}
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2 text-xs sm:text-sm hover-scale">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button onClick={handleExportICS} variant="outline" className="flex items-center gap-2 text-xs sm:text-sm hover-scale">
              <Download className="h-4 w-4" />
              iCal
            </Button>
          </div>
        </div>

        <LeaveTypeLegend />
        
        <ScrollArea className="h-[500px] w-full rounded-xl border" orientation="both">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky left-0 bg-background z-10 w-[200px] font-semibold border-r">
                    Employé
                  </TableHead>
                  {getDaysToShow().map((date, i) => (
                    <TableHead 
                      key={i} 
                      className={`text-center min-w-[100px] p-2 whitespace-pre-line ${
                        isToday(date) ? 'bg-primary/5' : ''
                      } ${isWeekend(date) ? 'bg-muted/50' : ''}`}
                    >
                      <div className="text-xs font-medium">
                        {format(date, 'EEE', { locale: fr })}
                      </div>
                      <div className={`text-sm ${isToday(date) ? 'font-bold text-primary' : ''}`}>
                        {format(date, 'dd')}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/30 transition-colors">
                    <TableHead className="sticky left-0 bg-background font-medium w-[200px] border-r">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {`${employee.first_name} ${employee.last_name}`}
                        </span>
                        {employee.position && (
                          <span className="text-xs text-muted-foreground">
                            {employee.position}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    {getDaysToShow().map((date, i) => (
                      <PlanningCell
                        key={i}
                        date={date}
                        leaveRequest={getLeaveRequestForDay(employee.id, date)}
                        timeRecord={getTimeRecordForDay(employee.id, date)}
                        isWeekend={isWeekend(date)}
                        isToday={isToday(date)}
                      />
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
