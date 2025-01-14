import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, startOfMonth, addMonths, subMonths, isSameMonth, parseISO, isToday, startOfWeek, endOfWeek, isWithinInterval, addDays, differenceInDays, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Pencil, Clock, Clock4 } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewEmployeeForm } from "@/components/employee/NewEmployeeForm";
import { NewEmployee } from "@/types/hr";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OvertimeRequest } from "@/types/hr";

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

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getTimeLog = (employeeId: number, date: Date): TimeLog | undefined => {
    // Simulation de données de pointage
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
    // Ici vous ajouteriez la logique pour sauvegarder l'employé
    console.log("Nouvel employé:", employee);
    toast.success("Employé ajouté avec succès");
  };

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [showExtraTimeDialog, setShowExtraTimeDialog] = useState(false);

  const handleEditEmployee = (employee: NewEmployee) => {
    // Here you would update the employee data
    toast.success("Informations de l'employé mises à jour");
    setShowEditDialog(false);
  };

  const handleAddDelay = (data: { date: string; time: string; reason: string }) => {
    // Here you would save the delay record
    toast.success("Retard enregistré");
  };

  const handleAddExtraTime = (data: { date: string; time: string; reason: string }) => {
    // Here you would save the extra time record
    toast.success("Heures supplémentaires enregistrées");
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
                        <div className="flex items-center space-x-2">
                          <span>{employee.name}</span>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowEditDialog(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowDelayDialog(true);
                              }}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowExtraTimeDialog(true);
                              }}
                            >
                              <Clock4 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
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
              <Button onClick={() => setShowNewEmployeeForm(true)}>
                Ajouter un employé
              </Button>
            </div>
            
            <NewEmployeeForm
              isOpen={showNewEmployeeForm}
              onClose={() => setShowNewEmployeeForm(false)}
              onSubmit={handleAddEmployee}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Taux de présence</h3>
                <p className="text-3xl font-bold text-green-600">95%</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Taux d'absentéisme</h3>
                <p className="text-3xl font-bold text-red-600">5%</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Congés pris (moyenne)</h3>
                <p className="text-3xl font-bold text-blue-600">12 jours</p>
              </Card>
              
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-2">Retards (ce mois)</h3>
                <p className="text-3xl font-bold text-orange-600">3</p>
              </Card>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

interface EditEmployeeDialogProps {
  employee: Partial<NewEmployee>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employee: NewEmployee) => void;
}

const EditEmployeeDialog = ({ employee, isOpen, onClose, onSubmit }: EditEmployeeDialogProps) => {
  return (
    <NewEmployeeForm
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      initialData={employee}
    />
  );
};

interface TimeAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string; time: string; reason: string }) => void;
  type: 'delay' | 'extraTime';
  employeeName: string;
}

const TimeAdjustmentDialog = ({ isOpen, onClose, onSubmit, type, employeeName }: TimeAdjustmentDialogProps) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ date, time, reason });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'delay' ? 'Ajouter un retard' : 'Ajouter des heures supplémentaires'}
          </DialogTitle>
          <DialogDescription>
            {`Pour ${employeeName}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">
              {type === 'delay' ? 'Durée du retard' : 'Heures supplémentaires'}
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motif</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">Valider</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

{selectedEmployee && (
  <>
    <EditEmployeeDialog
      employee={selectedEmployee}
      isOpen={showEditDialog}
      onClose={() => setShowEditDialog(false)}
      onSubmit={handleEditEmployee}
    />
    <TimeAdjustmentDialog
      isOpen={showDelayDialog}
      onClose={() => setShowDelayDialog(false)}
      onSubmit={handleAddDelay}
      type="delay"
      employeeName={selectedEmployee.name}
    />
    <TimeAdjustmentDialog
      isOpen={showExtraTimeDialog}
      onClose={() => setShowExtraTimeDialog(false)}
      onSubmit={handleAddExtraTime}
      type="extraTime"
      employeeName={selectedEmployee.name}
    />
  </>
)}
