import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TimeLog {
  clockIn?: string;
  breakStart?: string;
  breakEnd?: string;
  clockOut?: string;
}

interface Employee {
  id: number;
  name: string;
}

interface AbsenceType {
  type: string;
  color: string;
  label: string;
}

const absenceTypes: AbsenceType[] = [
  { type: "paternite", color: "#FDE1D3", label: "Congé paternité" },
  { type: "maternite", color: "#FFDEE2", label: "Congé maternité" },
  { type: "enfantMalade", color: "#F2FCE2", label: "Congé enfant malade" },
  { type: "nonRemuneree", color: "#FEC6A1", label: "Absence non rémunérée" },
  { type: "injustifiee", color: "#ea384c", label: "Absence injustifiée non rémunérée" },
  { type: "justifiee", color: "#D3E4FD", label: "Absence justifiée non rémunérée" },
  { type: "rtt", color: "#FEF7CD", label: "RTT" },
  { type: "evenementsFamiliaux", color: "#E5DEFF", label: "Absences pour événements familiaux" },
  { type: "annuel", color: "#9b87f5", label: "Congé annuel" },
  { type: "paye", color: "#8B5CF6", label: "Congé payé" }
];

// Exemple de données (à remplacer par les vraies données)
const employees: Employee[] = [
  { id: 1, name: "Jean Dupont" },
  { id: 2, name: "Marie Martin" },
  { id: 3, name: "Pierre Durant" }
];

export const AdminPlanning = () => {
  const currentDate = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);

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
      return absenceTypes[9]; // Congé payé
    }
    return undefined;
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Planning du mois de {format(currentDate, 'MMMM yyyy', { locale: fr })}</h2>
          <div className="flex gap-2 flex-wrap">
            {absenceTypes.map((type) => (
              <Badge
                key={type.type}
                style={{ backgroundColor: type.color }}
                className="text-xs"
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-10">Employé</TableHead>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <TableHead key={i} className="text-center min-w-[120px]">
                    {format(new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), i + 1), 'd', { locale: fr })}
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
                                  <div>A: {timeLog.clockIn}</div>
                                  <div>P: {timeLog.breakStart}-{timeLog.breakEnd}</div>
                                  <div>D: {timeLog.clockOut}</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p>Arrivée: {timeLog.clockIn}</p>
                                  <p>Pause: {timeLog.breakStart} - {timeLog.breakEnd}</p>
                                  <p>Départ: {timeLog.clockOut}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : absence ? (
                          <span className="text-xs">{absence.label}</span>
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