
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
import { Calendar, Clock, Upload, User, CalendarDays, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { differenceInHours, differenceInMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";

type LeaveType = Database["public"]["Enums"]["leave_type"];

interface LeaveRequestFormProps {
  onSubmit?: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export const LeaveRequestForm = ({ onSubmit, isSubmitting }: LeaveRequestFormProps) => {
  const [leaveType, setLeaveType] = useState<LeaveType>();
  const [dayType, setDayType] = useState("full");
  const [period, setPeriod] = useState<string>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

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
          status: 'approved' // Auto-approve when HR creates the request
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
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-indigo-500" />
          <Label htmlFor="employee" className="text-lg font-medium text-gray-700">Employé</Label>
        </div>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="h-12 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
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

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-indigo-500" />
          <Label htmlFor="type" className="text-lg font-medium text-gray-700">Type de congé</Label>
        </div>
        <Select value={leaveType} onValueChange={(value: LeaveType) => setLeaveType(value)}>
          <SelectTrigger className="h-12 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
            <Label htmlFor="startDate" className="text-lg font-medium text-gray-700">Date de début</Label>
          </div>
          <Input 
            type="date" 
            id="startDate" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="h-12 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
            <Label htmlFor="endDate" className="text-lg font-medium text-gray-700">Date de fin</Label>
          </div>
          <Input 
            type="date" 
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="h-12 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-indigo-500" />
          <Label htmlFor="dayType" className="text-lg font-medium text-gray-700">Type de journée</Label>
        </div>
        <ToggleGroup 
          type="single" 
          value={dayType} 
          onValueChange={(value) => value && setDayType(value)}
          className="justify-start bg-gray-50 p-2 rounded-lg border border-gray-200"
        >
          <ToggleGroupItem 
            value="full" 
            className={`rounded-md px-4 py-2 ${dayType === 'full' ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-gray-100'}`}
          >
            Journée complète
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="half" 
            className={`rounded-md px-4 py-2 ${dayType === 'half' ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-gray-100'}`}
          >
            Demi-journée
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {dayType === "half" && (
        <div className="space-y-4 pl-4 border-l-2 border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            <Label htmlFor="period" className="text-lg font-medium text-gray-700">Période</Label>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-12 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
              <SelectValue placeholder="Sélectionnez la période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Matin</SelectItem>
              <SelectItem value="afternoon">Après-midi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-indigo-500" />
          <Label htmlFor="reason" className="text-lg font-medium text-gray-700">Motif</Label>
        </div>
        <Textarea 
          id="reason" 
          placeholder="Décrivez la raison de votre demande"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-24 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="h-5 w-5 text-indigo-500" />
          <Label htmlFor="file" className="text-lg font-medium text-gray-700">Pièce jointe</Label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            className="flex-1 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {selectedFile && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setSelectedFile(null)}
              className="h-12 w-12"
            >
              ×
            </Button>
          )}
        </div>
        {selectedFile && (
          <p className="text-sm text-muted-foreground ml-2">
            Fichier sélectionné : {selectedFile.name}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button 
          type="submit" 
          className="h-12 px-6 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="mr-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              Traitement...
            </>
          ) : (
            "Soumettre la demande"
          )}
        </Button>
      </div>
    </form>
  );
};
