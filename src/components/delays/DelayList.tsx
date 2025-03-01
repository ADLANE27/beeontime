
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DelayForm } from "./DelayForm";
import { DelayItem } from "./DelayItem";
import { useDelayMutations } from "./useDelayMutations";

export const DelayList = () => {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDelay, setCurrentDelay] = useState<any>(null);
  
  const { 
    addDelayMutation, 
    updateDelayMutation, 
    deleteDelayMutation,
    updateDelayDetailsMutation
  } = useDelayMutations({ 
    onSuccess: () => {
      setOpen(false);
      setEditDialogOpen(false);
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

  const handleEdit = (delay: any) => {
    setCurrentDelay(delay);
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce retard ?")) {
      deleteDelayMutation.mutate(id);
    }
  };

  const filteredDelays = useMemo(() => {
    if (!delays) return [];
    
    return delays.filter(delay => {
      if (!searchTerm) return true;
      
      const employeeName = delay.employees 
        ? `${delay.employees.first_name} ${delay.employees.last_name}`.toLowerCase()
        : '';
      
      return (
        employeeName.includes(searchTerm.toLowerCase()) ||
        delay.date.includes(searchTerm) ||
        (delay.reason && delay.reason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [delays, searchTerm]);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <h2 className="text-2xl font-bold">Retards</h2>
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un retard
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
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
      </div>
      
      <div className="space-y-4">
        {filteredDelays.length > 0 ? (
          filteredDelays.map((delay) => (
            <DelayItem
              key={delay.id}
              delay={delay}
              onApprove={(id) => updateDelayMutation.mutate({ id, status: 'approved' })}
              onReject={(id) => updateDelayMutation.mutate({ id, status: 'rejected' })}
              onEdit={() => handleEdit(delay)}
              onDelete={() => handleDelete(delay.id)}
              isUpdating={updateDelayMutation.isPending}
              formatDuration={formatDuration}
            />
          ))
        ) : (
          <p className="text-center text-gray-500">Aucun retard enregistré</p>
        )}
      </div>

      {currentDelay && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier le retard</DialogTitle>
            </DialogHeader>
            <DelayForm 
              employees={employees}
              initialValues={{
                employee_id: currentDelay.employee_id,
                date: currentDelay.date,
                scheduled_time: currentDelay.scheduled_time,
                actual_time: currentDelay.actual_time,
                reason: currentDelay.reason || ""
              }}
              onSubmit={(values) => 
                updateDelayDetailsMutation.mutate({
                  id: currentDelay.id,
                  ...values
                })
              }
              isSubmitting={updateDelayDetailsMutation?.isPending}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};
