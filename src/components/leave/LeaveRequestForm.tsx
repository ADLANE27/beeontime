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

export const LeaveRequestForm = () => {
  const [leaveType, setLeaveType] = useState<string>();
  const [dayType, setDayType] = useState("full"); // "full" ou "half"

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Demande de congé</h2>
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type de congé</Label>
          <Select value={leaveType} onValueChange={setLeaveType}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacation">Congés payés</SelectItem>
              <SelectItem value="sick">Maladie</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Type de journée</Label>
          <ToggleGroup
            type="single"
            value={dayType}
            onValueChange={(value) => {
              if (value) setDayType(value);
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
            <Input type="date" id="startDate" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Date de fin</Label>
            <Input type="date" id="endDate" />
          </div>
        </div>

        {dayType === "half" && (
          <div className="space-y-2">
            <Label htmlFor="period">Période</Label>
            <Select>
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
          <Textarea id="reason" placeholder="Décrivez la raison de votre demande" />
        </div>

        <Button type="submit" className="w-full">
          Soumettre la demande
        </Button>
      </form>
    </Card>
  );
};