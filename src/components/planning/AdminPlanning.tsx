import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isSameMonth, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useState } from "react";

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
  { type: "paternite", color: "#E5F6FD", label: "Congé paternité" },
  { type: "maternite", color: "#FFF0F0", label: "Congé maternité" },
  { type: "enfantMalade", color: "#F0FFF4", label: "Congé enfant malade" },
  { type: "nonRemuneree", color: "#FFF5EB", label: "Absence non rémunérée" },
  { type: "injustifiee", color: "#FEE2E2", label: "Absence injustifiée" },
  { type: "justifiee", color: "#EFF6FF", label: "Absence justifiée" },
  { type: "rtt", color: "#FFFBEB", label: "RTT" },
  { type: "evenementsFamiliaux", color: "#F5F3FF", label: "Événements familiaux" },
  { type: "annuel", color: "#F3F4F6", label: "Congé annuel" },
  { type: "paye", color: "#EEF2FF", label: "Congé payé" }
];

// Exemple de données (à remplacer par les vraies données)
const employees: Employee[] = [
  { id: 1, name: "Jean Dupont", hasClockedIn: true },
  { id: 2, name: "Marie Martin", hasClockedIn: false },
  { id: 3, name: "Pierre Durant", hasClockedIn: true }
];

export const AdminPlanning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Exemple de données de pointage (à remplacer par les vraies données)
  const getTimeLog = (employeeId: number, day: number): TimeLog | undefined => {
    if (day === 15) {
      return {
        clockIn: "09:00",
        breakStart: "12:00",
        breakEnd: "13:00",
        clockOut: "17:00"
      };
    }
    return undefined;
  };

  // Exemple de données d'absence (à remplacer par les vraies données)
  const getAbsence = (employeeId: number, day: number): AbsenceType | undefined => {
    if (employeeId === 1 && day === 10) {
      return absenceTypes[9];
    }
    return undefined;
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold">
                Planning du mois de {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={previousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                onClick={() => setView('month')}
              >
                Mois
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                onClick={() => setView('week')}
              >
                Semaine
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {absenceTypes.map((type) => (
              <Badge
                key={type.type}
                variant="outline"
                style={{ backgroundColor: type.color }}
                className="text-xs justify-start"
              >
                {type.label}
              </Badge>
            ))}
          </div>

          <div className="bg-muted/10 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">État des pointages du jour</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className={`p-3 rounded-lg ${
                    employee.hasClockedIn ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <span className="font-medium">{employee.name}</span>
                  <span className={`ml-2 text-sm ${
                    employee.hasClockedIn ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {employee.hasClockedIn ? 'A pointé' : 'N\'a pas encore pointé'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">Employé</TableHead>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <TableHead key={i} className="text-center min-w-[120px]">
                    {format(new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), i + 1), 'dd/MM', { locale: fr })}
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
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const timeLog = getTimeLog(employee.id, i + 1);
                    const absence = getAbsence(employee.id, i + 1);

                    return (
                      <TableCell
                        key={i}
                        style={{ backgroundColor: absence?.color }}
                        className="text-center p-1"
                      >
                        {timeLog ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="text-xs space-y-1">
                                  <div className="font-medium">Arrivée: {timeLog.clockIn}</div>
                                  <div>Pause: {timeLog.breakStart}</div>
                                  <div>Reprise: {timeLog.breakEnd}</div>
                                  <div className="font-medium">Départ: {timeLog.clockOut}</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm space-y-1">
                                  <p>Arrivée: {timeLog.clockIn}</p>
                                  <p>Pause: {timeLog.breakStart} - {timeLog.breakEnd}</p>
                                  <p>Départ: {timeLog.clockOut}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : absence ? (
                          <span className="text-xs p-1 rounded">{absence.label}</span>
                        ) : null}
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