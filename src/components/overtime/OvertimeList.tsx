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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const OvertimeList = () => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");

  // Exemple de données
  const overtimeRequests: OvertimeRequest[] = [
    {
      id: 1,
      employeeId: 1,
      date: "2024-03-20",
      hours: 2,
      reason: "Projet urgent",
      status: "pending"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ici vous ajouterez la logique pour soumettre la demande
    toast.success("Demande d'heures supplémentaires soumise avec succès");
    setOpen(false);
    // Reset form
    setDate("");
    setStartTime("");
    setEndTime("");
    setReason("");
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Heures supplémentaires</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Nouvelle demande</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouvelle demande d'heures supplémentaires</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                Soumettre
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
              <p className="font-semibold">{request.date}</p>
              <p className="text-sm text-gray-600">{request.hours} heures</p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>
            <Badge
              variant={
                request.status === "approved"
                  ? "secondary"
                  : request.status === "rejected"
                  ? "destructive"
                  : "outline"
              }
            >
              {request.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
};