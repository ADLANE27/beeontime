import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['employee-leave-requests'],
    queryFn: async () => {
      console.log('Fetching leave requests...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

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
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', leaveId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Demande de congé annulée avec succès");
      queryClient.invalidateQueries({ queryKey: ['employee-leave-requests'] });
    },
    onError: (error) => {
      console.error('Error canceling leave request:', error);
      toast.error("Erreur lors de l'annulation de la demande");
    }
  });

  const handleCancel = (leaveId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler cette demande de congé ?")) {
      cancelMutation.mutate(leaveId);
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
      <h2 className="text-2xl font-bold mb-6">Mes demandes de congés</h2>
      <div className="space-y-4">
        {leaveRequests?.map((request) => {
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
                      <span> ({request.period === "morning" ? "Matin" : "Après-midi"})</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    Soumis le {format(new Date(request.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusText(request.status)}
                  </Badge>
                  {request.status === 'pending' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleCancel(request.id)}
                      className="mt-2"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {(!leaveRequests || leaveRequests.length === 0) && (
          <p className="text-center text-gray-500">Aucune demande de congés</p>
        )}
      </div>
    </Card>
  );
};