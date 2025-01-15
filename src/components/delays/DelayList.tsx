import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Check, X } from "lucide-react";

export const DelayList = () => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [delays, setDelays] = useState<any[]>([]);

  // Exemple de données des employés
  const employees = [
    { id: "1", name: "Jean Dupont" },
    { id: "2", name: "Marie Martin" },
    { id: "3", name: "Pierre Durant" }
  ];

  useEffect(() => {
    // Load delays from localStorage
    const storedDelays = JSON.parse(localStorage.getItem("delays") || "[]");
    setDelays(storedDelays);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) {
      toast.error("Veuillez sélectionner un employé");
      return;
    }
    
    const newDelay = {
      id: Date.now(),
      employeeId: selectedEmployee,
      employeeName: employees.find(e => e.id === selectedEmployee)?.name,
      date: date,
      scheduledTime: "09:00",
      actualTime: time,
      duration: time,
      status: "En attente de confirmation",
      reason: reason
    };

    const updatedDelays = [...delays, newDelay];
    setDelays(updatedDelays);
    localStorage.setItem("delays", JSON.stringify(updatedDelays));
    
    toast.success("Retard enregistré avec succès");
    setOpen(false);
    setDate("");
    setTime("");
    setReason("");
    setSelectedEmployee("");
  };

  const handleConfirmDelay = (delayId: number) => {
    const updatedDelays = delays.map(delay => 
      delay.id === delayId 
        ? { ...delay, status: "Confirmé" }
        : delay
    );
    setDelays(updatedDelays);
    localStorage.setItem("delays", JSON.stringify(updatedDelays));
    toast.success("Retard confirmé");
  };

  const handleDeleteDelay = (delayId: number) => {
    const updatedDelays = delays.filter(delay => delay.id !== delayId);
    setDelays(updatedDelays);
    localStorage.setItem("delays", JSON.stringify(updatedDelays));
    toast.success("Retard supprimé");
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Retards</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un retard
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enregistrer un retard</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="space-y-2">
                <Label htmlFor="time">Heure d'arrivée</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
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
        {delays.map((delay) => (
          <div
            key={delay.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-semibold">{delay.employeeName}</p>
              <p className="text-sm text-gray-600">Date: {delay.date}</p>
              <p className="text-sm text-gray-600">
                Heure prévue: {delay.scheduledTime} - Arrivée: {delay.actualTime}
              </p>
              <p className="text-sm text-gray-600">Durée: {delay.duration}</p>
              <p className="text-sm text-gray-600">Motif: {delay.reason}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Badge
                variant={
                  delay.status === "Confirmé"
                    ? "secondary"
                    : delay.status === "Rejeté"
                    ? "destructive"
                    : "outline"
                }
              >
                {delay.status}
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfirmDelay(delay.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteDelay(delay.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};