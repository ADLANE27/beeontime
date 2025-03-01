
import { useState, useMemo } from "react";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Check, X, Edit, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const OvertimeList = () => {
  const [openManual, setOpenManual] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentOvertime, setCurrentOvertime] = useState<any>(null);
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
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error deleting overtime request:', error);
      toast.error("Erreur lors de la suppression de la demande");
    }
  });

  const updateOvertimeMutation = useMutation({
    mutationFn: async (updatedRequest: {
      id: string;
      date?: string;
      start_time?: string;
      end_time?: string;
      reason?: string;
      hours?: number;
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
      toast.success("Demande mise à jour avec succès");
      setEditDialogOpen(false);
      setCurrentOvertime(null);
    },
    onError: (error) => {
      console.error('Error updating overtime request:', error);
      toast.error("Erreur lors de la mise à jour de la demande");
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

  const handleDeleteClick = (overtime: any) => {
    setCurrentOvertime(overtime);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (currentOvertime) {
      deleteOvertimeMutation.mutate(currentOvertime.id);
    }
  };

  const handleEdit = (overtime: any) => {
    setCurrentOvertime(overtime);
    setDate(overtime.date);
    setStartTime(overtime.start_time);
    setEndTime(overtime.end_time);
    setReason(overtime.reason || "");
    setEditDialogOpen(true);
  };

  const handleUpdateOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !startTime || !endTime) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!currentOvertime) return;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (hours <= 0) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }

    updateOvertimeMutation.mutate({
      id: currentOvertime.id,
      date,
      start_time: startTime,
      end_time: endTime,
      reason,
      hours
    });
  };

  const filteredOvertimeRequests = useMemo(() => {
    if (!overtimeRequests) return [];
    
    return overtimeRequests.filter(request => {
      if (!searchTerm) return true;
      
      // Pour les RH qui voient les noms des employés
      if (profile?.role === 'hr' && request.employees) {
        const fullName = `${request.employees.first_name} ${request.employees.last_name}`.toLowerCase();
        if (fullName.includes(searchTerm.toLowerCase())) return true;
      }
      
      // Recherche par date ou motif
      return (
        request.date.includes(searchTerm) ||
        (request.reason && request.reason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [overtimeRequests, searchTerm, profile?.role]);

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
        <div className="w-full sm:w-auto">
          <h2 className="text-2xl font-bold">Heures supplémentaires</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
      </div>
      <div className="space-y-4">
        {filteredOvertimeRequests.length > 0 ? (
          filteredOvertimeRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 border rounded-lg"
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
                {profile?.role === 'hr' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(request)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(request)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                )}
                {profile?.role !== 'hr' && request.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(request)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(request)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">Aucune demande d'heures supplémentaires</p>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier les heures supplémentaires</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateOvertime} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startTime">Heure de début</Label>
                <Input
                  id="edit-startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endTime">Heure de fin</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reason">Motif</Label>
              <Textarea
                id="edit-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
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
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible et supprimera définitivement la demande d'heures supplémentaires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOvertimeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
