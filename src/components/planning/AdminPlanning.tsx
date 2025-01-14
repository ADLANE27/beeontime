import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isSameMonth, parseISO, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

// Exemple de données (à remplacer par les vraies données)
const employees: Employee[] = [
  { id: 1, name: "Jean Dupont", hasClockedIn: true },
  { id: 2, name: "Marie Martin", hasClockedIn: false },
  { id: 3, name: "Pierre Durant", hasClockedIn: true }
];

export const AdminPlanning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Exemple de données de pointage (à remplacer par les vraies données)
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
        {/* En-tête avec navigation et légende */}
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
        </div>

        {/* Légende des absences */}
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

        {/* État des pointages du jour */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Pointages du {format(new Date(), 'dd MMMM yyyy', { locale: fr })}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className={`p-4 rounded-lg border ${
                  employee.hasClockedIn ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{employee.name}</span>
                  <Badge variant="outline" className={employee.hasClockedIn ? 'bg-green-100' : 'bg-red-100'}>
                    {employee.hasClockedIn ? 'Présent' : 'Absent'}
                  </Badge>
                </div>
                {employee.hasClockedIn && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div>Arrivée: 09:00</div>
                    <div>Pause déjeuner: 12:00 - 13:00</div>
                    <div>Départ prévu: 17:00</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Calendrier */}
        <ScrollArea className="h-[500px] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-10">Employé</TableHead>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <TableHead 
                    key={i} 
                    className={`text-center min-w-[100px] ${
                      isToday(new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)) 
                        ? 'bg-blue-50' 
                        : ''
                    }`}
                  >
                    {format(new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), i + 1), 'dd/MM')}
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
                    const currentDay = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), i + 1);
                    const timeLog = getTimeLog(employee.id, currentDay);
                    const absence = getAbsence(employee.id, i + 1);

                    return (
                      <TableCell
                        key={i}
                        className={`text-center p-2 ${
                          isToday(currentDay) ? 'bg-blue-50' : ''
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