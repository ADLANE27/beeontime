import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScheduleInfoFormProps } from "./types/employee-form";
import { Clock } from "lucide-react";

export const ScheduleInfoForm = ({
  workSchedule,
  onScheduleChange,
}: ScheduleInfoFormProps) => {
  const handleScheduleChange = (field: keyof typeof workSchedule, value: string) => {
    onScheduleChange({
      ...workSchedule,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Horaires de travail</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Heure d'arrivée</Label>
          <Input
            id="startTime"
            type="time"
            value={workSchedule.startTime}
            onChange={(e) => handleScheduleChange("startTime", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Heure de départ</Label>
          <Input
            id="endTime"
            type="time"
            value={workSchedule.endTime}
            onChange={(e) => handleScheduleChange("endTime", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="breakStartTime">Début pause déjeuner</Label>
          <Input
            id="breakStartTime"
            type="time"
            value={workSchedule.breakStartTime}
            onChange={(e) => handleScheduleChange("breakStartTime", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="breakEndTime">Fin pause déjeuner</Label>
          <Input
            id="breakEndTime"
            type="time"
            value={workSchedule.breakEndTime}
            onChange={(e) => handleScheduleChange("breakEndTime", e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};