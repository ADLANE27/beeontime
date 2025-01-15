import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { VacationInfoFormProps } from "./types/employee-form";
import { Calendar } from "lucide-react";

export const VacationInfoForm = ({
  previousYearVacationDays,
  usedVacationDays,
  remainingVacationDays,
  onFieldChange,
}: VacationInfoFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Congés</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="previousYearVacationDays">Congés N-1</Label>
          <Input
            id="previousYearVacationDays"
            type="number"
            value={previousYearVacationDays}
            onChange={(e) => onFieldChange("previousYearVacationDays", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="usedVacationDays">Congés pris</Label>
          <Input
            id="usedVacationDays"
            type="number"
            value={usedVacationDays}
            onChange={(e) => onFieldChange("usedVacationDays", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="remainingVacationDays">Congés restants</Label>
          <Input
            id="remainingVacationDays"
            type="number"
            value={remainingVacationDays}
            onChange={(e) => onFieldChange("remainingVacationDays", e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
};