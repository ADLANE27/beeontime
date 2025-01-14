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

export const LeaveRequestForm = () => {
  const [leaveType, setLeaveType] = useState<string>();

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