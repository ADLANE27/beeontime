
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface DelayFormProps {
  employees: { id: string; first_name: string; last_name: string; }[] | undefined;
  onSubmit: (data: {
    employee_id: string;
    date: string;
    scheduled_time: string;
    actual_time: string;
    reason: string;
  }) => void;
  isSubmitting: boolean;
}

export const DelayForm = ({ employees, onSubmit, isSubmitting }: DelayFormProps) => {
  const [date, setDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [actualTime, setActualTime] = useState("");
  const [reason, setReason] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employee_id: selectedEmployee,
      date,
      scheduled_time: scheduledTime,
      actual_time: actualTime,
      reason
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="employee">Employé</Label>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
          <SelectTrigger id="employee" className="h-12">
            <SelectValue placeholder="Sélectionner un employé" />
          </SelectTrigger>
          <SelectContent>
            {employees?.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {`${employee.first_name} ${employee.last_name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-12"
          required
        />
      </div>
      <div className="space-y-3">
        <Label htmlFor="scheduledTime">Heure prévue</Label>
        <Input
          id="scheduledTime"
          type="time"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="h-12"
          required
        />
      </div>
      <div className="space-y-3">
        <Label htmlFor="actualTime">Heure d'arrivée réelle</Label>
        <Input
          id="actualTime"
          type="time"
          value={actualTime}
          onChange={(e) => setActualTime(e.target.value)}
          className="h-12"
          required
        />
      </div>
      <div className="space-y-3">
        <Label htmlFor="reason">Motif</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="resize-none min-h-[100px]"
          required
        />
      </div>
      <div className="flex gap-4 justify-end pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => window.history.back()}
          className="px-6 h-12"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          className="px-8 h-12 bg-indigo-600 hover:bg-indigo-700"
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          )}
          Enregistrer
        </Button>
      </div>
    </form>
  );
};
