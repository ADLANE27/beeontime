import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isSameMonth, parseISO, isToday, startOfWeek, endOfWeek, isWithinInterval, addDays, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeLog {
  clockIn?: string;
  breakStart?: string;
  breakEnd?: string;
  clockOut?: string;
}

interface Employee {
  id: number;
  name: string;
  hasClockedIn?: boolean;
}

interface AbsenceType {
  type: string;
  color: string;
  label: string;
}

const absenceTypes: AbsenceType[] = [
  { type: "paternite", color: "bg-blue-100", label: "Congé paternité" },
  { type: "maternite", color: "bg-pink-100", label: "Congé maternité" },
  { type: "enfantMalade", color: "bg-green-100", label: "Congé enfant malade" },
  { type: "nonRemuneree", color: "bg-orange-100", label: "Absence non rémunérée" },
  { type: "injustifiee", color: "bg-red-100", label: "Absence injustifiée" },
  { type: "justifiee", color: "bg-blue-100", label: "Absence justifiée" },
  { type: "rtt", color: "bg-yellow-100", label: "RTT" },
  { type: "evenementsFamiliaux", color: "bg-purple-100", label: "Événements familiaux" },
  { type: "annuel", color: "bg-gray-100", label: "Congé annuel" },
  { type: "paye", color: "bg-indigo-100", label: "Congé payé" }
];

const employees: Employee[] = [
  { id: 1, name: "Jean Dupont", hasClockedIn: true },
  { id: 2, name: "Marie Martin", hasClockedIn: false },
  { id: 3, name: "Pierre Durant", hasClockedIn: true }
];

export const AdminPlanning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'custom'>('month');
  
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getTimeLog = (employeeId: number, date: Date): TimeLog | undefined => {
    if (isToday(date)) {
      return {
        clockIn: employees.find(e => e.id === employeeId)?.hasClockedIn ? "09:00" : undefined,
        breakStart: "12:00",
        breakEnd: "13:00",
        clockOut: "17:00"
      };
    }
    return undefined;
  };

  const getAbsence = (employeeId: number, day: number): AbsenceType | undefined => {
    if (employeeId === 1 && day === 10) {
      return absenceTypes[9];
    }
    return undefined;
  };

  const getDaysToShow = () => {
    switch (viewMode) {
      case 'week':
        const start = startOfWeek(currentDate, { locale: fr });
        const end = endOfWeek(currentDate, { locale: fr });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
      case 'custom':
        if (date?.from && date?.to) {
          const dayCount = differenceInDays(date.to, date.from) + 1;
          return Array.from({ length: dayCount }, (_, i) => addDays(date.from, i));
        }
        return [];
      default:
        return Array.from({ length: daysInMonth }, (_, i) => 
          new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), i + 1)
        );
    }
  };

  const isDateInRange = (dateToCheck: Date) => {
    if (viewMode === 'custom' && date?.from && date?.to) {
      return isWithinInterval(dateToCheck, { start: date.from, end: date.to });
    }
    return true;
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={viewMode} onValueChange={(value: 'month' | 'week' | 'custom') => setViewMode(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner une vue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Vue mensuelle</SelectItem>
                <SelectItem value="week">Vue hebdomadaire</SelectItem>
                <SelectItem value="custom">Période personnalisée</SelectItem>
              </SelectContent>
            </Select>

            {viewMode === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "dd/MM/yyyy")} -{" "}
                          {format(date.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(date.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Sélectionner une période</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {absenceTypes.map((type) => (
            <div
              key={type.type}
              className={`flex items-center space-x-2 p-2 rounded-md ${type.color}`}
            >
              <div className="w-3 h-3 rounded-full bg-current"></div>
              <span className="text-sm">{type.label}</span>
            </div>
          ))}
        </div>

        <ScrollArea className="h-[500px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-10">Employé</TableHead>
                {getDaysToShow().map((date, i) => (
                  <TableHead 
                    key={i} 
                    className={`text-center min-w-[100px] ${
                      isToday(date) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {format(date, 'dd/MM')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="sticky left-0 bg-white font-medium">
                    {employee.name}
                  </TableCell>
                  {getDaysToShow().map((date, i) => {
                    const timeLog = getTimeLog(employee.id, date);
                    const absence = getAbsence(employee.id, date.getDate());

                    return (
                      <TableCell
                        key={i}
                        className={`text-center p-2 ${
                          isToday(date) ? 'bg-blue-50' : ''
                        } ${absence ? absence.color : ''}`}
                      >
                        {timeLog && (
                          <div className="text-xs space-y-1">
                            {timeLog.clockIn ? (
                              <>
                                <div className="font-medium text-green-600">✓</div>
                                <div>{timeLog.clockIn}</div>
                              </>
                            ) : (
                              <div className="font-medium text-red-600">✗</div>
                            )}
                          </div>
                        )}
                        {absence && (
                          <div className="text-xs font-medium">{absence.label}</div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </Card>
  );
};