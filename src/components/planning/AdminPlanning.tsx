import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isSameMonth, parseISO, isToday, startOfWeek, endOfWeek, isWithinInterval, addDays, differenceInDays, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewEmployeeForm } from "@/components/employee/NewEmployeeForm";
import { NewEmployee, Position } from "@/types/hr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmployeeStats } from "@/components/stats/EmployeeStats";
import { CompanyStats } from "@/components/stats/CompanyStats";

interface TimeLog {
  clockIn?: string;
  breakStart?: string;
  breakEnd?: string;
  clockOut?: string;
}

interface Employee {
  id: number;
  name: string;
  poste: Position;
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
  { id: 1, name: "Jean Dupont", poste: "Traducteur", hasClockedIn: true },
  { id: 2, name: "Marie Martin", poste: "Traductrice", hasClockedIn: false },
  { id: 3, name: "Pierre Durant", poste: "Interprète", hasClockedIn: true }
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
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

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
    toast.success(formMode === 'create' ? "Employé ajouté avec succès" : "Informations de l'employé mises à jour avec succès");
    setShowNewEmployeeForm(false);
    setSelectedEmployee(null);
    setFormMode('create');
  };

  const handleEditEmployee = (employee: NewEmployee) => {
    setSelectedEmployee(employee);
    setFormMode('edit');
    setShowNewEmployeeForm(true);
  };

  return (
    <Tabs defaultValue="planning" className="space-y-4">
      <TabsList>
        <TabsTrigger value="planning">Planning</TabsTrigger>
        <TabsTrigger value="employees">Gestion des employés</TabsTrigger>
        <TabsTrigger value="stats">Statistiques</TabsTrigger>
      </TabsList>

      <TabsContent value="planning">
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
            </div>
            
            <ScrollArea className="h-[500px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white z-10">Employé</TableHead>
                    {getDaysToShow().map((date, i) => (
                      <TableHead 
                        key={i} 
                        className={cn(
                          "text-center min-w-[100px]",
                          {
                            "bg-blue-50": isToday(date),
                            "bg-gray-100": isWeekend(date)
                          }
                        )}
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
                            className={cn(
                              "text-center p-2",
                              {
                                "bg-blue-50": isToday(date),
                                "bg-gray-100": isWeekend(date),
                                [absence?.color || ""]: absence
                              }
                            )}
                          >
                            {timeLog && (
                              <div className="text-xs space-y-1">
                                <div>{timeLog.clockIn} - {timeLog.clockOut}</div>
                                <div className="text-gray-500">
                                  {timeLog.breakStart} - {timeLog.breakEnd}
                                </div>
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
      </TabsContent>

      <TabsContent value="employees">
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gestion des employés</h2>
              <Button onClick={() => {
                setFormMode('create');
                setSelectedEmployee(null);
                setShowNewEmployeeForm(true);
              }}>
                Ajouter un employé
              </Button>
            </div>
            
            <NewEmployeeForm
              isOpen={showNewEmployeeForm}
              onClose={() => {
                setShowNewEmployeeForm(false);
                setSelectedEmployee(null);
                setFormMode('create');
              }}
              onSubmit={handleAddEmployee}
              employeeToEdit={selectedEmployee || undefined}
              mode={formMode}
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
                          onClick={() => handleEditEmployee({
                            firstName: employee.name.split(' ')[0],
                            lastName: employee.name.split(' ')[1],
                            email: `${employee.name.toLowerCase().replace(' ', '.')}@entreprise.com`,
                            position: employee.poste,
                            phone: "0612345678",
                            birthDate: new Date(),
                            birthPlace: "Paris",
                            birthCountry: "France",
                            socialSecurityNumber: "123456789",
                            contractType: "CDI",
                            startDate: new Date(),
                            workSchedule: {
                              startTime: "09:00",
                              endTime: "17:00",
                              breakStartTime: "12:00",
                              breakEndTime: "13:00"
                            },
                            previousYearVacationDays: 25,
                            usedVacationDays: 10,
                            remainingVacationDays: 15
                          })}
                        >
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

      <TabsContent value="stats">
        <Card className="p-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Statistiques</h2>
            
            <Tabs defaultValue="company">
              <TabsList>
                <TabsTrigger value="company">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="individual">Par employé</TabsTrigger>
              </TabsList>
              
              <TabsContent value="company" className="mt-6">
                <CompanyStats />
              </TabsContent>
              
              <TabsContent value="individual" className="mt-6">
                <div className="mb-6">
                  <Label>Employé</Label>
                  <Select>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <EmployeeStats />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
