import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isSameMonth, parseISO, isToday, startOfWeek, endOfWeek, isWithinInterval, addDays, differenceInDays, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewEmployeeForm } from "@/components/employee/NewEmployeeForm";
import { NewEmployee } from "@/types/hr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [showNewEmployeeForm, setShowNewEmployeeForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<NewEmployee | null>(null);

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getTimeLog = (employeeId: number, date: Date): TimeLog | undefined => {
    if (!isWeekend(date)) {
      return {
        clockIn: "09:00",
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

  const handleAddEmployee = (employee: NewEmployee) => {
    toast.success("Employé ajouté avec succès");
    setShowNewEmployeeForm(false);
    setSelectedEmployee(null);
  };

  const handleUpdateEmployee = (employee: NewEmployee) => {
    toast.success("Informations de l'employé mises à jour avec succès");
    setShowNewEmployeeForm(false);
    setSelectedEmployee(null);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee({
      firstName: employee.name.split(' ')[0],
      lastName: employee.name.split(' ')[1],
      email: `${employee.name.toLowerCase().replace(' ', '.')}@entreprise.com`,
      phone: '0612345678', // Default value, should be replaced with actual data
      birthDate: new Date(),
      birthPlace: '',
      birthCountry: '',
      socialSecurityNumber: '',
      contractType: 'CDI',
      startDate: new Date(),
      position: 'Traducteur',
      workSchedule: {
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00'
      },
      previousYearVacationDays: 0,
      usedVacationDays: 0,
      remainingVacationDays: 0,
    });
    setShowNewEmployeeForm(true);
  };

  return (
    <Tabs defaultValue="planning" className="space-y-4">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="planning">Planning</TabsTrigger>
        <TabsTrigger value="employees">Gestion des employés</TabsTrigger>
      </TabsList>

      <TabsContent value="employees">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des employés</h2>
              <Button onClick={() => setShowNewEmployeeForm(true)}>
                Ajouter un employé
              </Button>
            </div>
            
            <NewEmployeeForm
              isOpen={showNewEmployeeForm}
              onClose={() => {
                setShowNewEmployeeForm(false);
                setSelectedEmployee(null);
              }}
              onSubmit={selectedEmployee ? handleUpdateEmployee : handleAddEmployee}
              initialData={selectedEmployee}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{`${employee.name.toLowerCase().replace(' ', '.')}@entreprise.com`}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Actif</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm">Réinitialiser MDP</Button>
                        <Button variant="outline" size="sm">Désactiver</Button>
                        <Button variant="destructive" size="sm">Supprimer</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="planning">
        {/* Planning content goes here */}
      </TabsContent>
    </Tabs>
  );
};
