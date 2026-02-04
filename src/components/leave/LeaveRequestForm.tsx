
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useState, useEffect } from "react";
import { Calendar, Clock, Upload } from "lucide-react";
import { toast } from "sonner";
import { differenceInHours, differenceInMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { leaveTypeColors } from "../planning/LeaveTypeLegend";

type LeaveType = Database["public"]["Enums"]["leave_type"];

interface LeaveRequestFormProps {
  onSubmit?: (data: any) => Promise<void>;
  isSubmitting?: boolean;
  initialValues?: {
    employee_id: string;
    start_date: string;
    end_date: string;
    type: LeaveType;
    day_type: string;
    period: string;
    reason: string;
  };
  isEditing?: boolean;
}

// Mapping from database enum to French display labels
const leaveTypeLabels: Record<LeaveType, string> = {
  vacation: "Congés payés",
  rtt: "RTT",
  paternity: "Congé paternité",
  maternity: "Congé maternité",
  sickChild: "Congé enfant malade",
  sickLeave: "Arrêt maladie",
  unpaidUnexcused: "Absence injustifiée non rémunérée",
  unpaidExcused: "Absence justifiée non rémunérée",
  unpaid: "Absence non rémunérée",
  annual: "Congé annuel",
  familyEvent: "Absences pour événements familiaux"
};

export const LeaveRequestForm = ({ onSubmit, isSubmitting, initialValues, isEditing }: LeaveRequestFormProps) => {
  const [leaveType, setLeaveType] = useState<LeaveType | undefined>(initialValues?.type);
  const [dayType, setDayType] = useState(initialValues?.day_type || "full");
  const [period, setPeriod] = useState<string | undefined>(initialValues?.period);
  const [startDate, setStartDate] = useState(initialValues?.start_date || "");
  const [endDate, setEndDate] = useState(initialValues?.end_date || "");
  const [reason, setReason] = useState(initialValues?.reason || "");
  const [selectedEmployee, setSelectedEmployee] = useState<string | undefined>(initialValues?.employee_id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // If initialValues change (e.g. when editing different requests), update the form
  useEffect(() => {
    if (initialValues) {
      setLeaveType(initialValues.type);
      setDayType(initialValues.day_type);
      setPeriod(initialValues.period);
      setStartDate(initialValues.start_date);
      setEndDate(initialValues.end_date);
      setReason(initialValues.reason);
      setSelectedEmployee(initialValues.employee_id);
    }
  }, [initialValues]);

  // Fetch all employees
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      console.log('Fetching employees...');
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      console.log('Fetched employees:', employees);
      return employees;
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Check for overlapping leave requests
  const checkOverlappingLeaves = async (employeeId: string, start: string, end: string): Promise<boolean> => {
    const { data: existingLeaves, error } = await supabase
      .from('leave_requests')
      .select('id, start_date, end_date, status')
      .eq('employee_id', employeeId)
      .neq('status', 'rejected')
      .or(`and(start_date.lte.${end},end_date.gte.${start})`);

    if (error) {
      console.error('Error checking overlapping leaves:', error);
      return false;
    }

    return existingLeaves && existingLeaves.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveType) {
      toast.error("Veuillez sélectionner un type de congé");
      return;
    }

    if (dayType === "half" && !period) {
      toast.error("Veuillez sélectionner la période (matin ou après-midi)");
      return;
    }

    if (!selectedEmployee) {
      toast.error("Veuillez sélectionner un employé");
      return;
    }

    // Check for overlapping leave requests (skip if editing)
    if (!isEditing) {
      const hasOverlap = await checkOverlappingLeaves(selectedEmployee, startDate, endDate);
      if (hasOverlap) {
        toast.error("Une demande de congé existe déjà pour cette période. Veuillez choisir d'autres dates.");
        return;
      }
    }

    const start = new Date(startDate);
    const now = new Date();

    // Vérification des délais selon le type de congé
    if (leaveType === "vacation") {
      const hoursUntilStart = differenceInHours(start, now);
      if (hoursUntilStart < 48) {
        toast.error("Les congés payés doivent être demandés au moins 48 heures à l'avance");
        return;
      }
    }

    if (leaveType === "annual") {
      const monthsUntilStart = differenceInMonths(start, now);
      if (monthsUntilStart < 2) {
        toast.error("Les congés annuels doivent être demandés au moins 2 mois à l'avance");
        return;
      }
    }

    try {
      if (onSubmit) {
        await onSubmit({
          employee_id: selectedEmployee,
          start_date: startDate,
          end_date: endDate,
          type: leaveType,
          day_type: dayType,
          period: dayType === "half" ? period : null,
          reason: reason,
        });
        return;
      }

      // Submit leave request - CHANGED STATUS TO 'pending' INSTEAD OF 'approved'
      const { data: leaveRequest, error: leaveRequestError } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: selectedEmployee,
          start_date: startDate,
          end_date: endDate,
          type: leaveType,
          day_type: dayType,
          period: dayType === "half" ? period : null,
          reason: reason,
          status: 'pending' // Changed from 'approved' to 'pending'
        })
        .select()
        .single();

      if (leaveRequestError) {
        console.error('Error submitting leave request:', leaveRequestError);
        toast.error("Erreur lors de la soumission de la demande");
        return;
      }

      // Upload file if selected
      if (selectedFile && leaveRequest) {
        const fileExt = selectedFile.name.split('.').pop();
        const filePath = `${leaveRequest.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('leave-documents')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error("Erreur lors de l'upload du fichier");
          return;
        }

        // Save document reference
        const { error: docError } = await supabase
          .from('leave_request_documents')
          .insert({
            leave_request_id: leaveRequest.id,
            file_path: filePath,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            uploaded_by: selectedEmployee
          });

        if (docError) {
          console.error('Error saving document reference:', docError);
          toast.error("Erreur lors de l'enregistrement du document");
          return;
        }
      }

      toast.success("Demande de congé soumise avec succès");
      // Reset form
      setLeaveType(undefined);
      setDayType("full");
      setPeriod(undefined);
      setStartDate("");
      setEndDate("");
      setReason("");
      setSelectedEmployee(undefined);
      setSelectedFile(null);
      // Refresh the leave requests list
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <Card className="p-4 sm:p-6">
      <ScrollArea className="h-[calc(100vh-250px)] sm:h-[calc(100vh-200px)] pr-2 sm:pr-4">
        <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="employee">Employé</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de congé</Label>
            <Select value={leaveType} onValueChange={(value: LeaveType) => setLeaveType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacation">{leaveTypeLabels.vacation} (48h à l'avance)</SelectItem>
                <SelectItem value="annual">{leaveTypeLabels.annual} (2 mois à l'avance)</SelectItem>
                <SelectItem value="paternity">{leaveTypeLabels.paternity}</SelectItem>
                <SelectItem value="maternity">{leaveTypeLabels.maternity}</SelectItem>
                <SelectItem value="sickChild">{leaveTypeLabels.sickChild}</SelectItem>
                <SelectItem value="sickLeave">{leaveTypeLabels.sickLeave}</SelectItem>
                <SelectItem value="unpaidUnexcused">{leaveTypeLabels.unpaidUnexcused}</SelectItem>
                <SelectItem value="unpaidExcused">{leaveTypeLabels.unpaidExcused}</SelectItem>
                <SelectItem value="unpaid">{leaveTypeLabels.unpaid}</SelectItem>
                <SelectItem value="rtt">{leaveTypeLabels.rtt}</SelectItem>
                <SelectItem value="familyEvent">{leaveTypeLabels.familyEvent}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Date de début</Label>
            <Input 
              type="date" 
              id="startDate" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Date de fin</Label>
            <Input 
              type="date" 
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayType">Type de journée</Label>
            <ToggleGroup type="single" value={dayType} onValueChange={(value) => value && setDayType(value)} className="justify-start">
              <ToggleGroupItem value="full" className="text-sm sm:text-base h-9 sm:h-10">Journée complète</ToggleGroupItem>
              <ToggleGroupItem value="half" className="text-sm sm:text-base h-9 sm:h-10">Demi-journée</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {dayType === "half" && (
            <div className="space-y-2">
              <Label htmlFor="period">Période</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Matin</SelectItem>
                  <SelectItem value="afternoon">Après-midi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motif</Label>
            <Textarea 
              id="reason" 
              placeholder="Décrivez la raison de votre demande"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Pièce jointe</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                className="flex-1"
              />
              {selectedFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  ×
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Fichier sélectionné : {selectedFile.name}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isSubmitting}>
            {isEditing ? "Mettre à jour" : "Soumettre la demande"}
          </Button>
        </form>
      </ScrollArea>
    </Card>
  );
};
