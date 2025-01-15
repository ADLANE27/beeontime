import { useState } from "react";
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
import { Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const OvertimeList = () => {
  const [openManual, setOpenManual] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const { data: overtimeRequests, isLoading } = useQuery({
    queryKey: ['overtime_requests'],
    queryFn: async () => {
      console.log('Fetching overtime requests...');
      const { data, error } = await supabase
        .from('overtime_requests')
        .select(`
          *,
          employees (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching overtime requests:', error);
        throw error;
      }
      console.log('Overtime requests fetched:', data);
      return data;
    }
  });

  const addOvertimeMutation = useMutation({
    mutationFn: async (newRequest: {
      date: string;
      start_time: string;
      end_time: string;
      reason: string;
      hours: number;
    }) => {
      console.log('Adding new overtime request:', newRequest);
      const { error } = await supabase
        .from('overtime_requests')
        .insert([newRequest]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime_requests'] });
      toast.success("Demande d'heures supplémentaires enregistrée");
      setOpenManual(false);
      // Reset form
      setDate("");
      setStartTime("");
      setEndTime("");
      setReason("");
    },
    onError: (error) => {
      console.error('Error adding overtime request:', error);
      toast.error("Erreur lors de l'enregistrement de la demande");
    }
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !startTime || !endTime) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Calculate hours between start and end time
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (hours <= 0) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }

    addOvertimeMutation.mutate({
      date,
      start_time: startTime,
      end_time: endTime,
      reason,
      hours
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    );
  }

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
              <Button 
                type="submit" 
                className="w-full"
                disabled={addOvertimeMutation.isPending}
              >
                {addOvertimeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Enregistrer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-4">
        {overtimeRequests?.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="text-sm text-gray-600">{request.date}</p>
              <p className="text-sm text-gray-600">
                De {request.start_time} à {request.end_time} ({request.hours} heures)
              </p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>
            <div>
              <Badge
                variant={
                  request.status === "approved"
                    ? "secondary"
                    : request.status === "rejected"
                    ? "destructive"
                    : "outline"
                }
              >
                {request.status === "pending" ? "En attente" : 
                 request.status === "approved" ? "Approuvé" : "Refusé"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};