import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OvertimeRequest } from "@/types/hr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const OvertimeList = () => {
  const [openManual, setOpenManual] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // Exemple de données des employés
  const employees = [
    { id: "1", name: "Jean Dupont" },
    { id: "2", name: "Marie Martin" },
    { id: "3", name: "Pierre Durant" }
  ];

  // Exemple de données
  const overtimeRequests: OvertimeRequest[] = [
    {
      id: 1,
      employeeId: 1,
      date: "2024-03-20",
      hours: 2,
      reason: "Projet urgent",
      status: "En attente de confirmation"
    }
  ];

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      toast.error("Veuillez sélectionner un employé");
      return;
    }
    
    toast.success("Heures supplémentaires ajoutées avec succès");
    setOpenManual(false);
    // Reset form
    setDate("");
    setStartTime("");
    setEndTime("");
    setReason("");
    setSelectedEmployee("");
  };

  const handleApprove = (requestId: number) => {
    toast.success("Demande approuvée avec succès");
  };

  const handleReject = (requestId: number) => {
    toast.error("Demande rejetée");
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Heures supplémentaires</h2>
        <Dialog open={openManual} onOpenChange={setOpenManual}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter des heures
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter des heures supplémentaires</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employé</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
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
                  <Label htmlFor="startTime">Heure de début</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Heure de fin</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motif</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Enregistrer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-4">
        {overtimeRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-semibold">
                {employees.find(e => e.id === String(request.employeeId))?.name}
              </p>
              <p className="text-sm text-gray-600">{request.date}</p>
              <p className="text-sm text-gray-600">{request.hours} heures</p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>
            <div className="flex gap-2">
              {request.status === "en attente de confirmation" && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleReject(request.id)}
                  >
                    Refuser
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleApprove(request.id)}
                  >
                    Accepter
                  </Button>
                </>
              )}
              <Badge
                variant={
                  request.status === "approuvé"
                    ? "secondary"
                    : request.status === "rejeté"
                    ? "destructive"
                    : "outline"
                }
              >
                {request.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};