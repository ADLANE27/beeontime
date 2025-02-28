
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Check, X, Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const OvertimeList = () => {
  const [openManual, setOpenManual] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [selectedOvertimeId, setSelectedOvertimeId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: overtimeRequests, isLoading } = useQuery({
    queryKey: ['overtime_requests'],
    queryFn: async () => {
      console.log('Fetching overtime requests...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      if (profile?.role === 'hr') {
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
        return data;
      }

      const { data, error } = await supabase
        .from('overtime_requests')
        .select(`
          *,
          employees (
            first_name,
            last_name
          )
        `)
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching overtime requests:', error);
        throw error;
      }
      console.log('Overtime requests fetched:', data);
      return data;
    },
    enabled: !!profile
  });

  const addOvertimeMutation = useMutation({
    mutationFn: async (newRequest: {
      date: string;
      start_time: string;
      end_time: string;
      reason: string;
      hours: number;
      employee_id: string;
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

  const updateOvertimeMutation = useMutation({
    mutationFn: async (updatedRequest: {
      id: string;
      date: string;
      start_time: string;
      end_time: string;
      reason: string;
      hours: number;
    }) => {
      const { id, ...rest } = updatedRequest;
      const { error } = await supabase
        .from('overtime_requests')
        .update(rest)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime_requests'] });
      toast.success("Demande d'heures supplémentaires mise à jour");
      setOpenEdit(false);
      setSelectedOvertimeId(null);
      setDate("");
      setStartTime("");
      setEndTime("");
      setReason("");
    },
    onError: (error) => {
      console.error('Error updating overtime request:', error);
      toast.error("Erreur lors de la mise à jour de la demande");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('overtime_requests')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime_requests'] });
      toast.success("Statut de la demande mis à jour");
    },
    onError: (error) => {
      console.error('Error updating overtime request:', error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  });

  const deleteOvertimeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('overtime_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime_requests'] });
      toast.success("Demande supprimée avec succès");
      setOpenDelete(false);
      setSelectedOvertimeId(null);
    },
    onError: (error) => {
      console.error('Error deleting overtime request:', error);
      toast.error("Erreur lors de la suppression de la demande");
    }
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !startTime || !endTime) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (hours <= 0) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vous devez être connecté pour faire une demande");
      return;
    }

    addOvertimeMutation.mutate({
      date,
      start_time: startTime,
      end_time: endTime,
      reason,
      hours,
      employee_id: user.id
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOvertimeId || !date || !startTime || !endTime) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (hours <= 0) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }

    updateOvertimeMutation.mutate({
      id: selectedOvertimeId,
      date,
      start_time: startTime,
      end_time: endTime,
      reason,
      hours
    });
  };

  const handleEdit = (request: any) => {
    setSelectedOvertimeId(request.id);
    setDate(request.date);
    setStartTime(request.start_time);
    setEndTime(request.end_time);
    setReason(request.reason || "");
    setOpenEdit(true);
  };

  const handleDelete = (id: string) => {
    setSelectedOvertimeId(id);
    setOpenDelete(true);
  };

  const confirmDelete = () => {
    if (selectedOvertimeId) {
      deleteOvertimeMutation.mutate(selectedOvertimeId);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {profile?.role !== 'hr' && (
          <Dialog open={openManual} onOpenChange={setOpenManual}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto whitespace-nowrap">
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
        )}
      </div>
      <div className="space-y-4">
        {overtimeRequests?.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
          >
            <div>
              {profile?.role === 'hr' && (
                <p className="font-medium">
                  {request.employees.first_name} {request.employees.last_name}
                </p>
              )}
              <p className="text-sm text-gray-600">{request.date}</p>
              <p className="text-sm text-gray-600">
                De {request.start_time} à {request.end_time} ({request.hours} heures)
              </p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>
            <div className="flex items-center gap-2">
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
              {profile?.role === 'hr' && request.status === 'pending' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'approved' })}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'rejected' })}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              {/* Pour l'employé, il peut supprimer sa propre demande en attente */}
              {profile?.role !== 'hr' && request.status === "pending" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(request.id)}
                  className="text-destructive hover:text-destructive/90"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {/* Pour l'admin RH, il peut modifier et supprimer n'importe quelle demande */}
              {profile?.role === 'hr' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(request)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(request.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog pour la modification */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier des heures supplémentaires</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editDate">Date</Label>
              <Input
                id="editDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartTime">Heure de début</Label>
                <Input
                  id="editStartTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndTime">Heure de fin</Label>
                <Input
                  id="editEndTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editReason">Motif</Label>
              <Textarea
                id="editReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEdit(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={updateOvertimeMutation.isPending}
              >
                {updateOvertimeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Mettre à jour
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog pour la confirmation de suppression */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande d'heures supplémentaires ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDelete(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteOvertimeMutation.isPending}
            >
              {deleteOvertimeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
