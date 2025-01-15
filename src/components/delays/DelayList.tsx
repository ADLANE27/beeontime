import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DelayForm } from "./DelayForm";
import { DelayItem } from "./DelayItem";

type Delay = Database['public']['Tables']['delays']['Row'] & {
  employees: {
    first_name: string;
    last_name: string;
  } | null;
};

const formatDuration = (duration: unknown): string => {
  console.log('Formatting duration:', duration);
  if (!duration || typeof duration !== 'string') return 'N/A';
  const formattedDuration = duration.split('.')[0];
  console.log('Formatted duration:', formattedDuration);
  return formattedDuration;
};

export const DelayList = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

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
      return data as Delay[];
    }
  });

  const addDelayMutation = useMutation({
    mutationFn: async (newDelay: any) => {
      console.log('Adding new delay:', newDelay);
      const { error } = await supabase
        .from('delays')
        .insert(newDelay);
      if (error) {
        console.error('Error adding delay:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delays'] });
      toast.success("Retard enregistré avec succès");
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Erreur lors de l'enregistrement du retard");
      console.error('Error adding delay:', error);
    }
  });

  const updateDelayMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      console.log('Updating delay status:', { id, status });
      const { error } = await supabase
        .from('delays')
        .update({ status })
        .eq('id', id);
      if (error) {
        console.error('Error updating delay status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delays'] });
      toast.success("Statut mis à jour avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du statut");
      console.error('Error updating delay status:', error);
    }
  });

  const handleSubmit = (data: any) => {
    const scheduledTime = "09:00";
    const newDelay = {
      employee_id: data.employee_id,
      date: data.date,
      scheduled_time: scheduledTime,
      actual_time: data.time,
      duration: `${data.time}`,
      reason: data.reason,
      status: 'pending'
    };

    console.log('Submitting new delay:', newDelay);
    addDelayMutation.mutate(newDelay);
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
            <DelayForm 
              employees={employees}
              onSubmit={handleSubmit}
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
            isUpdating={updateDelayMutation.isPending}
            formatDuration={formatDuration}
          />
        ))}
      </div>
    </Card>
  );
};