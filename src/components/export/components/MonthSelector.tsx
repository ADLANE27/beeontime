
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getLastTwelveMonths } from "../utils/exportHelpers";

interface MonthSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const MonthSelector = ({ value, onValueChange }: MonthSelectorProps) => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-64">
        <Label>Période</Label>
        <Select
          value={value}
          onValueChange={onValueChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un mois" />
          </SelectTrigger>
          <SelectContent>
            {getLastTwelveMonths().map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
