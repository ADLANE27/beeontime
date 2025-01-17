import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isToday, isWeekend, startOfWeek, endOfWeek, addWeeks, subWeeks, parse } from "date-fns";
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

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
}

export const AdminPlanning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
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
        new Date(firstDayOfPeriod.getFullYear(), firstDayOfPeriod.getMonth() + 1, 0),
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
    };

    fetchData();
  }, [currentDate]);

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
        
        return {
          start: [
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate()
          ],
          end: [
            endDate.getFullYear(),
            endDate.getMonth() + 1,
            endDate.getDate()
          ],
          title: `Absence: ${request.type} - ${employee?.first_name} ${employee?.last_name}`,
          description: request.reason || '',
          status: 'CONFIRMED'
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
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={previousPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semaine du' dd MMMM yyyy", { locale: fr })}
            </h2>
            <Button variant="outline" size="icon" onClick={nextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {viewMode === 'month' ? 'Vue hebdomadaire' : 'Vue mensuelle'}
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button onClick={handleExportICS} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              iCal
            </Button>
          </div>
        </div>

        <LeaveTypeLegend />
        
        <ScrollArea className="h-[500px] w-full" orientation="both">
          <div className="min-w-max border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10 w-[200px]">Employé</TableHead>
                  {getDaysToShow().map((date, i) => (
                    <TableHead 
                      key={i} 
                      className="text-center min-w-[100px] p-2 whitespace-pre-line"
                    >
                      <div className="text-xs font-medium">
                        {format(date, 'EEEE dd', { locale: fr })}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableHead className="sticky left-0 bg-white font-medium w-[200px]">
                      {`${employee.first_name} ${employee.last_name}`}
                    </TableHead>
                    {getDaysToShow().map((date, i) => (
                      <PlanningCell
                        key={i}
                        date={date}
                        leaveRequest={getLeaveRequestForDay(employee.id, date)}
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
      </div>
    </Card>
  );
};