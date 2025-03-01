
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface DelayFormValues {
  employee_id: string;
  date: string;
  scheduled_time: string;
  actual_time: string;
  reason: string;
}

interface DelayFormProps {
  employees: { id: string; first_name: string; last_name: string }[];
  onSubmit: (values: DelayFormValues) => void;
  isSubmitting: boolean;
  initialValues?: DelayFormValues;
  isEditing?: boolean;
}

export const DelayForm = ({ 
  employees, 
  onSubmit, 
  isSubmitting,
  initialValues,
  isEditing = false
}: DelayFormProps) => {
  const [employee_id, setEmployeeId] = useState(initialValues?.employee_id || "");
  const [date, setDate] = useState(initialValues?.date || "");
  const [scheduled_time, setScheduledTime] = useState(initialValues?.scheduled_time || "");
  const [actual_time, setActualTime] = useState(initialValues?.actual_time || "");
  const [reason, setReason] = useState(initialValues?.reason || "");

  useEffect(() => {
    if (initialValues) {
      setEmployeeId(initialValues.employee_id);
      setDate(initialValues.date);
      setScheduledTime(initialValues.scheduled_time);
      setActualTime(initialValues.actual_time);
      setReason(initialValues.reason);
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      employee_id,
      date,
      scheduled_time,
      actual_time,
      reason,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="employee_id">Employé</Label>
        <Select
          value={employee_id}
          onValueChange={setEmployeeId}
          disabled={isEditing}
          required
        >
          <SelectTrigger id="employee_id">
            <SelectValue placeholder="Sélectionner un employé" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_time">Heure prévue</Label>
          <Input
            id="scheduled_time"
            type="time"
            value={scheduled_time}
            onChange={(e) => setScheduledTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="actual_time">Heure d'arrivée</Label>
          <Input
            id="actual_time"
            type="time"
            value={actual_time}
            onChange={(e) => setActualTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Motif du retard</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        {isEditing ? "Enregistrer les modifications" : "Enregistrer"}
      </Button>
    </form>
  );
};
