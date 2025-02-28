
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DelayForm } from "./DelayForm";
import { DelayItem } from "./DelayItem";
import { useDelayMutations } from "./useDelayMutations";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const DelayList = () => {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDelayId, setSelectedDelayId] = useState<string | null>(null);
  const [editingDelay, setEditingDelay] = useState<any | null>(null);

  const { 
    addDelayMutation, 
    updateDelayMutation, 
    editDelayMutation, 
    deleteDelayMutation 
  } = useDelayMutations({ 
    onSuccess: () => {
      setOpen(false);
      setEditDialogOpen(false);
      setDeleteDialogOpen(false);
    }
  });

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      console.log('Fetching employees...');
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name');
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      console.log('Employees fetched:', data);
      return data;
    }
  });

  const { data: delays, isLoading: isLoadingDelays } = useQuery({
    queryKey: ['delays'],
    queryFn: async () => {
      console.log('Fetching delays...');
      const { data, error } = await supabase
        .from('delays')
        .select(`
          *,
          employees (
            first_name,
            last_name
          )
        `);
      if (error) {
        console.error('Error fetching delays:', error);
        throw error;
      }
      console.log('Delays fetched:', data);
      return data;
    }
  });

  const formatDuration = (duration: unknown): string => {
    console.log('Formatting duration:', duration);
    if (!duration || typeof duration !== 'string') return 'N/A';
    const formattedDuration = duration.split('.')[0];
    console.log('Formatted duration:', formattedDuration);
    return formattedDuration;
  };

  const handleEditDelay = (delay: any) => {
    setEditingDelay({
      id: delay.id,
      employee_id: delay.employee_id,
      date: delay.date,
      scheduled_time: delay.scheduled_time,
      actual_time: delay.actual_time,
      reason: delay.reason || '',
    });
    setEditDialogOpen(true);
  };

  const handleDeleteDelay = (id: string) => {
    setSelectedDelayId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDelayId) {
      deleteDelayMutation.mutate(selectedDelayId);
    }
  };

  const handleUpdate = () => {
    if (editingDelay) {
      editDelayMutation.mutate(editingDelay);
    }
  };

  if (isLoadingEmployees || isLoadingDelays) {
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
      <div className="flex justify-center mb-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un retard
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] mx-auto my-auto fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle>Enregistrer un retard</DialogTitle>
            </DialogHeader>
            <DelayForm 
              employees={employees}
              onSubmit={addDelayMutation.mutate}
              isSubmitting={addDelayMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-4">
        {delays?.map((delay) => (
          <DelayItem
            key={delay.id}
            delay={delay}
            onApprove={(id) => updateDelayMutation.mutate({ id, status: 'approved' })}
            onReject={(id) => updateDelayMutation.mutate({ id, status: 'rejected' })}
            onEdit={handleEditDelay}
            onDelete={handleDeleteDelay}
            isUpdating={updateDelayMutation.isPending}
            formatDuration={formatDuration}
          />
        ))}
      </div>

      {/* Dialog pour la modification */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="fixed inset-0 grid place-items-center sm:max-w-[425px] mx-auto my-auto">
          <DialogHeader>
            <DialogTitle>Modifier un retard</DialogTitle>
          </DialogHeader>
          {editingDelay && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employé</Label>
                <Select
                  value={editingDelay.employee_id}
                  onValueChange={(value) => setEditingDelay({ ...editingDelay, employee_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {`${employee.first_name} ${employee.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDate">Date</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editingDelay.date}
                  onChange={(e) => setEditingDelay({ ...editingDelay, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editScheduledTime">Heure prévue</Label>
                  <Input
                    id="editScheduledTime"
                    type="time"
                    value={editingDelay.scheduled_time}
                    onChange={(e) => setEditingDelay({ ...editingDelay, scheduled_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editActualTime">Heure d'arrivée</Label>
                  <Input
                    id="editActualTime"
                    type="time"
                    value={editingDelay.actual_time}
                    onChange={(e) => setEditingDelay({ ...editingDelay, actual_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editReason">Motif</Label>
                <Textarea
                  id="editReason"
                  value={editingDelay.reason}
                  onChange={(e) => setEditingDelay({ ...editingDelay, reason: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="button" 
                  onClick={handleUpdate}
                  disabled={editDelayMutation.isPending}
                >
                  {editDelayMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Mettre à jour
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour la confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="fixed inset-0 grid place-items-center sm:max-w-[425px] mx-auto my-auto">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce retard ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteDelayMutation.isPending}
            >
              {deleteDelayMutation.isPending ? (
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
