import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { differenceInHours, differenceInMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";

type LeaveType = Database["public"]["Enums"]["leave_type"];

export const LeaveRequestForm = () => {
  const [leaveType, setLeaveType] = useState<LeaveType>();
  const [dayType, setDayType] = useState("full");
  const [period, setPeriod] = useState<string>();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Vous devez être connecté pour soumettre une demande");
        return;
      }

      // Check if employee record exists
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (employeeError) {
        console.error('Error checking employee record:', employeeError);
        toast.error("Erreur lors de la vérification du profil employé");
        return;
      }

      // If no employee record exists, create one
      if (!employee) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError);
          toast.error("Erreur lors de la récupération du profil");
          return;
        }

        const { error: createEmployeeError } = await supabase
          .from('employees')
          .insert({
            id: user.id,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email
          });

        if (createEmployeeError) {
          console.error('Error creating employee record:', createEmployeeError);
          toast.error("Erreur lors de la création du profil employé");
          return;
        }
      }

      // Submit leave request
      const { error: leaveRequestError } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: user.id,
          start_date: startDate,
          end_date: endDate,
          type: leaveType,
          day_type: dayType,
          period: dayType === "half" ? period : null,
          reason: reason,
          status: 'pending'
        });

      if (leaveRequestError) {
        console.error('Error submitting leave request:', leaveRequestError);
        toast.error("Erreur lors de la soumission de la demande");
        return;
      }

      toast.success("Demande de congé soumise avec succès");
      // Reset form
      setLeaveType(undefined);
      setDayType("full");
      setPeriod(undefined);
      setStartDate("");
      setEndDate("");
      setReason("");
      // Refresh the leave requests list
      queryClient.invalidateQueries({ queryKey: ['employee-leave-requests'] });
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Demande de congé</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
              <SelectItem value="unpaidUnexcused">Absence injustifiée non rémunérée</SelectItem>
              <SelectItem value="unpaidExcused">Absence justifiée non rémunérée</SelectItem>
              <SelectItem value="unpaid">Absence non rémunérée</SelectItem>
              <SelectItem value="rtt">RTT</SelectItem>
              <SelectItem value="familyEvent">Absences pour événements familiaux</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Type de journée</Label>
          <ToggleGroup
            type="single"
            value={dayType}
            onValueChange={(value) => {
              if (value) {
                setDayType(value);
                if (value === "full") {
                  setPeriod(undefined);
                }
              }
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="full" aria-label="Journée complète" className="gap-2">
              <Calendar className="h-4 w-4" />
              Journée complète
            </ToggleGroupItem>
            <ToggleGroupItem value="half" aria-label="Demi-journée" className="gap-2">
              <Clock className="h-4 w-4" />
              Demi-journée
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Button type="submit" className="w-full">
          Soumettre la demande
        </Button>
      </form>
    </Card>
  );
};