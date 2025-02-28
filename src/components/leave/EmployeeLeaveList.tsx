
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "approved":
      return "Acceptée";
    case "rejected":
      return "Refusée";
    default:
      return "En attente";
  }
};

const getLeaveTypeText = (type: string) => {
  switch (type) {
    case "vacation":
      return "Congés payés";
    case "annual":
      return "Congé annuel";
    case "paternity":
      return "Congé paternité";
    case "maternity":
      return "Congé maternité";
    case "sickChild":
      return "Congé enfant malade";
    case "unpaidUnexcused":
      return "Absence injustifiée non rémunérée";
    case "unpaidExcused":
      return "Absence justifiée non rémunérée";
    case "unpaid":
      return "Absence non rémunérée";
    case "rtt":
      return "RTT";
    case "familyEvent":
      return "Absences pour événements familiaux";
    default:
      return type;
  }
};

export const EmployeeLeaveList = () => {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<any | null>(null);

  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['employee-leave-requests'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }

      console.log('Fetching leave requests for user:', user.id);

      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leave requests:', error);
        throw error;
      }

      console.log('Leave requests fetched:', data);
      return data;
    },
    retry: false
  });

  const deleteMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', leaveId)
        .eq('employee_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Demande de congé supprimée avec succès");
      queryClient.invalidateQueries({ 
        queryKey: ['employee-leave-requests']
      });
      setDeleteDialogOpen(false);
      setLeaveToDelete(null);
    },
    onError: (error) => {
      console.error('Error in deleteMutation:', error);
      toast.error("Erreur lors de la suppression de la demande");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (leaveData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('leave_requests')
        .update({
          start_date: leaveData.start_date,
          end_date: leaveData.end_date,
          type: leaveData.type,
          reason: leaveData.reason,
          day_type: leaveData.day_type,
          period: leaveData.period,
          updated_at: new Date().toISOString()
        })
        .eq('id', leaveData.id)
        .eq('employee_id', user.id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Demande de congé mise à jour avec succès");
      queryClient.invalidateQueries({ 
        queryKey: ['employee-leave-requests']
      });
      setEditDialogOpen(false);
      setEditingLeave(null);
    },
    onError: (error) => {
      console.error('Error in updateMutation:', error);
      toast.error("Erreur lors de la mise à jour de la demande");
    }
  });

  const openDeleteDialog = (leaveId: string) => {
    setLeaveToDelete(leaveId);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (leave: any) => {
    setEditingLeave({ ...leave });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingLeave) {
      updateMutation.mutate(editingLeave);
    }
  };

  const handleDelete = () => {
    if (leaveToDelete) {
      deleteMutation.mutate(leaveToDelete);
    }
  };

  const leaveTypes = [
    { value: "vacation", label: "Congés payés" },
    { value: "annual", label: "Congé annuel" },
    { value: "paternity", label: "Congé paternité" },
    { value: "maternity", label: "Congé maternité" },
    { value: "sickChild", label: "Congé enfant malade" },
    { value: "unpaidUnexcused", label: "Absence injustifiée non rémunérée" },
    { value: "unpaidExcused", label: "Absence justifiée non rémunérée" },
    { value: "unpaid", label: "Absence non rémunérée" },
    { value: "rtt", label: "RTT" },
    { value: "familyEvent", label: "Absences pour événements familiaux" }
  ];

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
      <h2 className="text-2xl font-bold mb-6">Mes demandes de congés</h2>
      <div className="space-y-4">
        {leaveRequests && leaveRequests.length > 0 ? (
          leaveRequests.map((request) => {
            const startDate = new Date(request.start_date);
            const endDate = new Date(request.end_date);
            const numberOfDays = differenceInDays(endDate, startDate) + 1;
            
            return (
              <Card key={request.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        Du {format(startDate, "dd MMMM yyyy", { locale: fr })}
                      </p>
                      <p className="font-semibold">
                        au {format(endDate, "dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Durée : {numberOfDays} jour{numberOfDays > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600">
                      Type: {getLeaveTypeText(request.type)}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-600">Motif: {request.reason}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      Type de journée: {request.day_type === "full" ? "Journée complète" : "Demi-journée"}
                      {request.day_type === "half" && request.period && (
                        <span className="font-medium"> ({request.period === "morning" ? "Matin" : "Après-midi"})</span>
                      )}
                    </p>
                    {request.rejection_reason && (
                      <p className="text-sm text-red-600">
                        Motif du refus: {request.rejection_reason}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Soumis le {format(new Date(request.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(request)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => openDeleteDialog(request.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending && leaveToDelete === request.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <p className="text-center text-gray-500">Aucune demande de congés</p>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande de congé ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la demande de congé</DialogTitle>
          </DialogHeader>
          {editingLeave && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={editingLeave.start_date}
                    onChange={(e) => setEditingLeave({ ...editingLeave, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={editingLeave.end_date}
                    onChange={(e) => setEditingLeave({ ...editingLeave, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type de congé</Label>
                <Select
                  value={editingLeave.type}
                  onValueChange={(value) => setEditingLeave({ ...editingLeave, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="day_type">Type de journée</Label>
                <Select
                  value={editingLeave.day_type}
                  onValueChange={(value) => setEditingLeave({ ...editingLeave, day_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de journée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Journée complète</SelectItem>
                    <SelectItem value="half">Demi-journée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingLeave.day_type === "half" && (
                <div className="space-y-2">
                  <Label htmlFor="period">Période</Label>
                  <Select
                    value={editingLeave.period || "morning"}
                    onValueChange={(value) => setEditingLeave({ ...editingLeave, period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Matin</SelectItem>
                      <SelectItem value="afternoon">Après-midi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="reason">Motif (optionnel)</Label>
                <Textarea
                  id="reason"
                  placeholder="Précisez le motif de votre demande..."
                  value={editingLeave.reason || ""}
                  onChange={(e) => setEditingLeave({ ...editingLeave, reason: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
