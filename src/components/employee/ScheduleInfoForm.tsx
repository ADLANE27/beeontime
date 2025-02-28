
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Début journée</Label>
          <div className="relative">
            <Input
              id="startTime"
              type="time"
              value={workSchedule.startTime}
              onChange={(e) => handleScheduleChange("startTime", e.target.value)}
              required
              className="pl-3 pr-9"
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">Fin journée</Label>
          <div className="relative">
            <Input
              id="endTime"
              type="time"
              value={workSchedule.endTime}
              onChange={(e) => handleScheduleChange("endTime", e.target.value)}
              required
              className="pl-3 pr-9"
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="breakStartTime">Début pause déjeuner</Label>
          <div className="relative">
            <Input
              id="breakStartTime"
              type="time"
              value={workSchedule.breakStartTime}
              onChange={(e) => handleScheduleChange("breakStartTime", e.target.value)}
              required
              className="pl-3 pr-9"
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="breakEndTime">Fin pause déjeuner</Label>
          <div className="relative">
            <Input
              id="breakEndTime"
              type="time"
              value={workSchedule.breakEndTime}
              onChange={(e) => handleScheduleChange("breakEndTime", e.target.value)}
              required
              className="pl-3 pr-9"
            />
            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
