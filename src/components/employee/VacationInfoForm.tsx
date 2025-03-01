import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { VacationInfoFormProps } from "./types/employee-form";
import { Calendar } from "lucide-react";

export const VacationInfoForm = ({
  currentYearVacationDays,
  currentYearUsedDays,
  previousYearVacationDays,
  previousYearUsedDays,
  onFieldChange,
}: VacationInfoFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Congés</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <h4 className="font-medium">Année en cours</h4>
          <div className="space-y-2">
            <Label htmlFor="currentYearVacationDays">Congés acquis</Label>
            <Input
              id="currentYearVacationDays"
              type="number"
              value={currentYearVacationDays}
              onChange={(e) => onFieldChange("currentYearVacationDays", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentYearUsedDays">Congés pris</Label>
            <Input
              id="currentYearUsedDays"
              type="number"
              value={currentYearUsedDays}
              onChange={(e) => onFieldChange("currentYearUsedDays", e.target.value)}
              required
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Solde: {Number(currentYearVacationDays) - Number(currentYearUsedDays)} jours
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Année précédente (N-1)</h4>
          <div className="space-y-2">
            <Label htmlFor="previousYearVacationDays">Congés acquis</Label>
            <Input
              id="previousYearVacationDays"
              type="number"
              value={previousYearVacationDays}
              onChange={(e) => onFieldChange("previousYearVacationDays", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="previousYearUsedDays">Congés pris</Label>
            <Input
              id="previousYearUsedDays"
              type="number"
              value={previousYearUsedDays}
              onChange={(e) => onFieldChange("previousYearUsedDays", e.target.value)}
              required
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Solde: {Number(previousYearVacationDays) - Number(previousYearUsedDays)} jours
          </div>
        </div>
      </div>
    </div>
  );
};