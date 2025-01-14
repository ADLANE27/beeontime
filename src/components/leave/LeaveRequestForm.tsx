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
import { differenceInHours, differenceInMonths, addHours, addMonths } from "date-fns";

export const LeaveRequestForm = () => {
  const [leaveType, setLeaveType] = useState<string>();
  const [dayType, setDayType] = useState("full"); // "full" ou "half"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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

    toast.success("Demande de congé soumise avec succès");
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Demande de congé</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="type">Type de congé</Label>
          <Select value={leaveType} onValueChange={setLeaveType}>
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
            <Input 
              type="date" 
              id="startDate" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Date de fin</Label>
            <Input 
              type="date" 
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
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