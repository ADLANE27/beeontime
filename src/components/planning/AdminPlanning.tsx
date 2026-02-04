import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, addMonths, subMonths, isToday, isWeekend, startOfWeek, endOfWeek, addWeeks, subWeeks, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon, Grid3X3, List, LayoutGrid } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeaveTypeLegend } from "./LeaveTypeLegend";
import { PlanningFilters } from "./PlanningFilters";
import { PlanningStatistics } from "./PlanningStatistics";
import { PlanningGridView } from "./PlanningGridView";
import { EmployeeSummaryCard } from "./EmployeeSummaryCard";
import { usePlanningFilters } from "./hooks/usePlanningFilters";
import { usePlanningStatistics } from "./hooks/usePlanningStatistics";
import { Database } from "@/integrations/supabase/types";
import { generatePlanningPDF } from "@/utils/pdf";
import { createEvents } from 'ics';
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [displayMode, setDisplayMode] = useState<'grid' | 'cards'>('grid');

  const {
    searchQuery,
    setSearchQuery,
    selectedDepartment,
    setSelectedDepartment,
    selectedLeaveType,
    setSelectedLeaveType,
    selectedStatus,
    setSelectedStatus,
    filteredEmployees,
    activeFiltersCount,
    clearFilters,
  } = usePlanningFilters(employees, leaveRequests);

  const statistics = usePlanningStatistics(
    filteredEmployees,
    leaveRequests,
    timeRecords
  );

  const firstDayOfPeriod = viewMode === 'month' 
    ? startOfMonth(currentDate)
    : startOfWeek(currentDate, { locale: fr });

  useEffect(() => {
    const fetchData = async () => {
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position')
        .order('last_name', { ascending: true });

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return;
      }

      setEmployees(employeesData || []);

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

  const getTodayLeave = (employeeId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return leaveRequests.find(
      (r) => r.employee_id === employeeId && today >= r.start_date && today <= r.end_date
    );
  };

  const getTodayTimeRecord = (employeeId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return timeRecords.find((r) => r.employee_id === employeeId && r.date === today);
  };

  const getMonthlyLeaveCount = (employeeId: string) => {
    return leaveRequests.filter((r) => r.employee_id === employeeId).length;
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
        
        let startHour = 9;
        let endHour = 18;
        
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
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <PlanningStatistics {...statistics} />

      {/* Filters */}
      <Card className="p-5">
        <PlanningFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          selectedLeaveType={selectedLeaveType}
          onLeaveTypeChange={setSelectedLeaveType}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onClearFilters={clearFilters}
          activeFiltersCount={activeFiltersCount}
        />
      </Card>

      {/* Planning Content */}
      <Card className="p-5 sm:p-6">
        {/* Header with controls */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Period navigation */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={previousPeriod} className="hover-scale rounded-xl">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg sm:text-xl font-semibold min-w-[200px] text-center">
                {capitalizeFirstLetter(
                  format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semaine du' dd MMMM", { locale: fr })
                )}
              </h2>
              <Button variant="outline" size="icon" onClick={nextPeriod} className="hover-scale rounded-xl">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* View controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Display mode toggle */}
              <div className="flex items-center bg-muted/50 rounded-xl p-1">
                <Button
                  variant={displayMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('grid')}
                  className="rounded-lg gap-1.5"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grille</span>
                </Button>
                <Button
                  variant={displayMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('cards')}
                  className="rounded-lg gap-1.5"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Cartes</span>
                </Button>
              </div>

              {/* Period toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
                className="rounded-xl gap-1.5"
              >
                <CalendarIcon className="h-4 w-4" />
                {viewMode === 'month' ? 'Semaine' : 'Mois'}
              </Button>

              {/* Export buttons */}
              <Button onClick={handleExportPDF} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button onClick={handleExportICS} variant="outline" size="sm" className="rounded-xl gap-1.5">
                <Download className="h-4 w-4" />
                iCal
              </Button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6">
          <LeaveTypeLegend />
        </div>

        {/* Content based on display mode */}
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Aucun employé trouvé avec les filtres actuels</p>
            <Button variant="outline" onClick={clearFilters} className="rounded-xl">
              Réinitialiser les filtres
            </Button>
          </div>
        ) : displayMode === 'cards' ? (
          /* Cards view - "At a glance" summary */
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Aperçu du jour
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEmployees.map((employee) => (
                <EmployeeSummaryCard
                  key={employee.id}
                  employee={employee}
                  todayLeave={getTodayLeave(employee.id)}
                  todayTimeRecord={getTodayTimeRecord(employee.id)}
                  monthlyLeaveCount={getMonthlyLeaveCount(employee.id)}
                  isPresent={!!getTodayTimeRecord(employee.id)?.morning_in}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Grid view - Calendar style */
          <div className="border rounded-xl overflow-hidden">
            <PlanningGridView
              employees={filteredEmployees}
              days={getDaysToShow()}
              leaveRequests={leaveRequests}
              timeRecords={timeRecords}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
