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
import { useState } from "react";
import { Calendar, Clock, Upload } from "lucide-react";
import { toast } from "sonner";
import { differenceInHours, differenceInMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";

type LeaveType = Database["public"]["Enums"]["leave_type"];

interface LeaveRequestFormProps {
  employees?: { id: string; name: string; }[];
  onSubmit?: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export const LeaveRequestForm = ({ employees, onSubmit, isSubmitting }: LeaveRequestFormProps = {}) => {
  const [leaveType, setLeaveType] = useState<LeaveType>();
  const [dayType, setDayType] = useState("full");
  const [period, setPeriod] = useState<string>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Fetch all employees if not provided
  const { data: fetchedEmployees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      return employees.map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`
      }));
    },
    enabled: !employees // Only fetch if employees prop is not provided
  });

  const employeesList = employees || fetchedEmployees || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
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

      // Submit leave request
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
          status: 'pending'
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
      queryClient.invalidateQueries({ queryKey: ['employee-leave-requests'] });
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <Card className="p-6">
      <ScrollArea className="h-[calc(100vh-200px)] pr-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="employee">Employé</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un employé" />
              </SelectTrigger>
              <SelectContent>
                {employeesList.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
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
                <SelectItem value="vacation">Congés payés (48h à l'avance)</SelectItem>
                <SelectItem value="annual">Congé annuel (2 mois à l'avance)</SelectItem>
                <SelectItem value="paternity">Congé paternité</SelectItem>
                <SelectItem value="maternity">Congé maternité</SelectItem>
                <SelectItem value="sickChild">Congé enfant malade</SelectItem>
                <SelectItem value="sickLeave">Arrêt maladie</SelectItem>
                <SelectItem value="unpaidUnexcused">Absence injustifiée non rémunérée</SelectItem>
                <SelectItem value="unpaidExcused">Absence justifiée non rémunérée</SelectItem>
                <SelectItem value="unpaid">Absence non rémunérée</SelectItem>
                <SelectItem value="rtt">RTT</SelectItem>
                <SelectItem value="familyEvent">Absences pour événements familiaux</SelectItem>
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
            <ToggleGroup type="single" value={dayType} onValueChange={(value) => value && setDayType(value)}>
              <ToggleGroupItem value="full">Journée complète</ToggleGroupItem>
              <ToggleGroupItem value="half">Demi-journée</ToggleGroupItem>
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            Soumettre la demande
          </Button>
        </form>
      </ScrollArea>
    </Card>
  );
};