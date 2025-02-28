
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isToday, isWeekend, startOfWeek, endOfWeek, addWeeks, subWeeks, parse, setHours, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon, ArrowUpRight, CalendarDays, XCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeaveTypeLegend } from "./LeaveTypeLegend";
import { PlanningCell } from "./PlanningCell";
import { Database } from "@/integrations/supabase/types";
import { generatePlanningPDF } from "@/utils/pdf";
import { createEvents } from 'ics';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingView, setIsChangingView] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
  const [filterByDate, setFilterByDate] = useState<Date | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const firstDayOfPeriod = viewMode === 'month' 
    ? startOfMonth(currentDate)
    : startOfWeek(currentDate, { locale: fr });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        toast.error("Erreur lors du chargement des employés");
        setIsLoading(false);
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
        toast.error("Erreur lors du chargement des congés");
        setIsLoading(false);
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
        toast.error("Erreur lors du chargement des pointages");
        setIsLoading(false);
        return;
      }

      setTimeRecords(timeData || []);
      setIsLoading(false);
    };

    fetchData();
  }, [currentDate, viewMode]);

  useEffect(() => {
    // Si on vient de supprimer le filtre, on remet en évidence la date actuelle
    if (!filterByDate && !highlightedDate) {
      setHighlightedDate(new Date());
    }
  }, [filterByDate, highlightedDate]);

  // Effet pour faire défiler jusqu'à la colonne de la date sélectionnée/aujourd'hui
  useEffect(() => {
    // Attendre que les données soient chargées
    if (!isLoading && tableContainerRef.current && !filterByDate) {
      // Déterminer la date à mettre en évidence (aujourd'hui ou date sélectionnée)
      const dateToHighlight = highlightedDate || new Date();
      
      // Trouver l'index du jour à mettre en évidence (si présent dans la vue actuelle)
      const days = getDaysToShow();
      const highlightIndex = days.findIndex(date => isSameDay(date, dateToHighlight));
      
      if (highlightIndex !== -1) {
        // Calculer la position de défilement approximative
        const cellWidth = 100; // Largeur approximative d'une cellule en pixels
        const scrollPosition = highlightIndex * cellWidth;
        
        // Faire défiler jusqu'à cette position, avec un décalage pour centrer la cellule
        setTimeout(() => {
          if (tableContainerRef.current) {
            const containerWidth = tableContainerRef.current.clientWidth;
            const nameColumnWidth = 200; // Largeur de la colonne des noms
            tableContainerRef.current.scrollLeft = scrollPosition - (containerWidth - nameColumnWidth) / 2 + cellWidth / 2;
          }
        }, 100);
      }
    }
  }, [isLoading, highlightedDate, filterByDate]);

  const nextPeriod = () => {
    if (filterByDate) return; // Ne pas permettre de changer de période si un filtre de date est actif
    
    setIsChangingView(true);
    setHighlightedDate(null);
    setTimeout(() => {
      if (viewMode === 'month') {
        setCurrentDate(addMonths(currentDate, 1));
      } else {
        setCurrentDate(addWeeks(currentDate, 1));
      }
      setIsChangingView(false);
    }, 150);
  };

  const previousPeriod = () => {
    if (filterByDate) return; // Ne pas permettre de changer de période si un filtre de date est actif
    
    setIsChangingView(true);
    setHighlightedDate(null);
    setTimeout(() => {
      if (viewMode === 'month') {
        setCurrentDate(subMonths(currentDate, 1));
      } else {
        setCurrentDate(subWeeks(currentDate, 1));
      }
      setIsChangingView(false);
    }, 150);
  };

  const goToToday = () => {
    setIsChangingView(true);
    
    // Supprimer le filtre de date si présent
    setFilterByDate(null);
    
    // Définir la date sur aujourd'hui
    const today = new Date();
    
    // Assurer que la période (mois ou semaine) affichée contient le jour actuel
    setCurrentDate(today);
    setSelectedDate(today);
    setHighlightedDate(today);
    
    // Notification pour l'utilisateur
    toast.success(`Affichage du ${format(today, 'dd MMMM yyyy', { locale: fr })}`);
    
    setTimeout(() => {
      setIsChangingView(false);
    }, 150);
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    
    setCalendarOpen(false);
    setIsChangingView(true);
    
    // Mettre à jour les dates sélectionnées
    setSelectedDate(date);
    setCurrentDate(date);
    
    // Appliquer le filtre de date
    setFilterByDate(date);
    setHighlightedDate(null); // Pas besoin de mettre en évidence si on filtre déjà
    
    // Notification pour l'utilisateur
    toast.success(`Filtrage par date: ${format(date, 'dd MMMM yyyy', { locale: fr })}`);
    
    setTimeout(() => {
      setIsChangingView(false);
    }, 150);
  };

  const clearDateFilter = () => {
    setIsChangingView(true);
    setFilterByDate(null);
    
    // Notification pour l'utilisateur
    toast.success("Filtre de date supprimé");
    
    setTimeout(() => {
      setIsChangingView(false);
    }, 150);
  };

  const toggleViewMode = () => {
    setIsChangingView(true);
    setHighlightedDate(null);
    setTimeout(() => {
      setViewMode(viewMode === 'month' ? 'week' : 'month');
      setIsChangingView(false);
    }, 150);
  };

  const getDaysToShow = () => {
    // Si un filtre de date est actif, ne montrer que cette date
    if (filterByDate) {
      return [filterByDate];
    }
    
    // Sinon, montrer toutes les dates de la période
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
    toast.loading("Génération du PDF...");
    generatePlanningPDF(employees, currentDate, leaveRequests, viewMode);
  };

  const handleExportICS = () => {
    toast.loading("Génération du calendrier iCal...");
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
    <Card className="bg-white/90 shadow-lg rounded-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
      <div className="space-y-4 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={previousPeriod}
                className={cn(
                  "rounded-none border-r border-gray-100 hover:bg-gray-50 transition-colors",
                  filterByDate ? "opacity-50 cursor-not-allowed" : ""
                )}
                disabled={!!filterByDate}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold px-4 min-w-[180px] text-center">
                <span className={cn(
                  "block transition-all duration-300",
                  isChangingView ? "opacity-0 transform -translate-y-4" : "opacity-100 transform translate-y-0"
                )}>
                  {filterByDate 
                    ? format(filterByDate, 'dd MMMM yyyy', { locale: fr })
                    : capitalizeFirstLetter(
                        format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semaine du' dd MMMM yyyy", { locale: fr })
                      )
                  }
                </span>
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextPeriod}
                className={cn(
                  "rounded-none border-l border-gray-100 hover:bg-gray-50 transition-colors",
                  filterByDate ? "opacity-50 cursor-not-allowed" : ""
                )}
                disabled={!!filterByDate}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={filterByDate ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "shadow-sm hover:shadow transition-all duration-200 hover:scale-105 flex items-center gap-1.5",
                      filterByDate ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                    )}
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Date précise</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelectDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              
              {filterByDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateFilter}
                  className="shadow-sm hover:shadow transition-all duration-200 hover:scale-105 flex items-center gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Supprimer le filtre</span>
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2 shadow-sm hover:shadow transition-all duration-200 hover:scale-105">
              <Download className="h-4 w-4 group-hover:animate-bounce" />
              PDF
            </Button>
            <Button onClick={handleExportICS} variant="outline" className="flex items-center gap-2 shadow-sm hover:shadow transition-all duration-200 hover:scale-105">
              <Download className="h-4 w-4 group-hover:animate-bounce" />
              iCal
            </Button>
          </div>
        </div>

        {filterByDate && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-500">Mode filtre</Badge>
              <span className="text-sm text-blue-700">
                Affichage uniquement de la journée du {format(filterByDate, 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateFilter}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            >
              Voir le mois complet
            </Button>
          </div>
        )}

        <LeaveTypeLegend />
        
        <div 
          ref={tableContainerRef}
          className="relative h-[500px] w-full rounded-lg border border-gray-100 shadow-inner bg-white overflow-auto"
        >
          <div className={cn(
            "min-w-max transition-opacity duration-300",
            isChangingView ? "opacity-50" : "opacity-100"
          )}>
            <Table>
              <TableHeader className="sticky top-0 z-20 bg-white">
                <TableRow>
                  <TableHead className="sticky left-0 top-0 bg-white z-30 w-[200px] shadow-[5px_0_5px_-5px_rgba(0,0,0,0.1)]">
                    <div className="font-medium">Employé</div>
                  </TableHead>
                  {getDaysToShow().map((date, i) => (
                    <TableHead 
                      key={i} 
                      className={cn(
                        "text-center min-w-[100px] p-2 whitespace-pre-line bg-gradient-to-b from-gray-50 to-white font-medium",
                        isWeekend(date) ? "text-gray-500" : "",
                        isToday(date) ? "text-blue-600 font-semibold" : "",
                        filterByDate ? "bg-blue-50" : "",
                        !filterByDate && highlightedDate && isSameDay(date, highlightedDate) ? "bg-blue-50" : ""
                      )}
                    >
                      <div className="text-xs">
                        <div className="uppercase">{format(date, 'EEE', { locale: fr })}</div>
                        <div className={cn(
                          "text-sm mt-1 transition-all duration-200",
                          isToday(date) ? "bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center mx-auto shadow-inner" : "",
                          filterByDate ? "bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center mx-auto shadow-inner font-semibold" : "",
                          !filterByDate && highlightedDate && isSameDay(date, highlightedDate) ? "bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center mx-auto shadow-inner" : ""
                        )}>
                          {format(date, 'dd')}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={getDaysToShow().length + 1} className="h-96">
                      <div className="flex flex-col items-center justify-center h-full space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="text-gray-500">Chargement du planning...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee, index) => (
                    <TableRow 
                      key={employee.id} 
                      className={cn(
                        "hover:bg-gray-50/30 transition-all duration-150",
                        index % 2 === 0 ? "bg-gray-50/10" : ""
                      )}
                    >
                      <TableHead 
                        className="sticky left-0 bg-white font-medium w-[200px] shadow-[5px_0_5px_-5px_rgba(0,0,0,0.1)] z-10 transition-all duration-200 hover:bg-gray-50"
                      >
                        <div className="truncate font-medium">
                          {`${employee.first_name} ${employee.last_name}`}
                        </div>
                        <div className="text-xs text-gray-500 truncate">{employee.position}</div>
                      </TableHead>
                      {getDaysToShow().map((date, i) => (
                        <PlanningCell
                          key={i}
                          date={date}
                          leaveRequest={getLeaveRequestForDay(employee.id, date)}
                          timeRecord={getTimeRecordForDay(employee.id, date)}
                          isWeekend={isWeekend(date)}
                          isToday={isToday(date)}
                          isHighlighted={
                            filterByDate ? true : (highlightedDate ? isSameDay(date, highlightedDate) : false)
                          }
                        />
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </Card>
  );
};
