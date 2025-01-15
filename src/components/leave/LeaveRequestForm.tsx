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
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const LeaveRequestForm = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<"vacation" | "rtt" | "unpaid" | "familyEvent">("vacation");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Vous devez être connecté pour soumettre une demande");
        return;
      }

      if (!startDate || !endDate || !leaveType) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        toast.error("La date de fin doit être après la date de début");
        return;
      }

      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: user.id,
          start_date: startDate,
          end_date: endDate,
          type: leaveType,
          reason: reason,
          day_type: 'full',
          status: 'pending'
        });

      if (error) {
        console.error('Error submitting leave request:', error);
        toast.error("Erreur lors de la soumission de la demande");
        return;
      }

      toast.success("Demande de congé soumise avec succès");
      // Reset form
      setStartDate("");
      setEndDate("");
      setLeaveType("vacation");
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
      <h2 className="text-2xl font-bold mb-6">Nouvelle demande de congé</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="type">Type de congé</Label>
          <Select value={leaveType} onValueChange={(value: "vacation" | "rtt" | "unpaid" | "familyEvent") => setLeaveType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacation">Congés payés</SelectItem>
              <SelectItem value="rtt">RTT</SelectItem>
              <SelectItem value="unpaid">Congé sans solde</SelectItem>
              <SelectItem value="familyEvent">Événement familial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Motif (optionnel)</Label>
          <Textarea
            id="reason"
            placeholder="Précisez la raison de votre demande"
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