
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Trash2, Edit, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useErrorHandler } from "@/hooks/use-error-handler";

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
    case "sickLeave":
      return "Arrêt maladie";
    default:
      return type;
  }
};

export const EmployeeLeaveList = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentLeave, setCurrentLeave] = useState<any>(null);
  const [reason, setReason] = useState("");
  const { handleError } = useErrorHandler();

  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['employee-leave-requests'],
    queryFn: async () => {
      try {
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
      } catch (error) {
        handleError(error, "Erreur lors de la récupération des demandes de congés");
        return [];
      }
    },
    retry: 1
  });

  const cancelMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', leaveId)
        .eq('employee_id', user.id)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Demande de congé annulée avec succès");
      queryClient.invalidateQueries({ 
        queryKey: ['employee-leave-requests']
      });
    },
    onError: (error) => {
      handleError(error, "Erreur lors de l'annulation de la demande");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('leave_requests')
        .update({ reason })
        .eq('id', id)
        .eq('employee_id', user.id)
        .eq('status', 'pending');

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
      setCurrentLeave(null);
    },
    onError: (error) => {
      handleError(error, "Erreur lors de la mise à jour de la demande");
    }
  });

  const handleCancel = async (leaveId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler cette demande de congé ?")) {
      await cancelMutation.mutateAsync(leaveId);
    }
  };

  const handleEdit = (leave: any) => {
    setCurrentLeave(leave);
    setReason(leave.reason || "");
    setEditDialogOpen(true);
  };

  const handleUpdateLeave = async () => {
    if (currentLeave) {
      await updateMutation.mutateAsync({ id: currentLeave.id, reason });
    }
  };

  const filteredLeaveRequests = useMemo(() => {
    if (!leaveRequests) return [];
    
    return leaveRequests.filter(request => {
      const typeMatches = filterType ? request.type === filterType : true;
      const searchMatches = searchTerm 
        ? (request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) || 
           format(new Date(request.start_date), "dd/MM/yyyy").includes(searchTerm))
        : true;
      
      return typeMatches && searchMatches;
    });
  }, [leaveRequests, searchTerm, filterType]);

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
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Type de congé" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les types</SelectItem>
            <SelectItem value="vacation">Congés payés</SelectItem>
            <SelectItem value="annual">Congé annuel</SelectItem>
            <SelectItem value="paternity">Congé paternité</SelectItem>
            <SelectItem value="maternity">Congé maternité</SelectItem>
            <SelectItem value="sickChild">Congé enfant malade</SelectItem>
            <SelectItem value="sickLeave">Arrêt maladie</SelectItem>
            <SelectItem value="rtt">RTT</SelectItem>
            <SelectItem value="familyEvent">Événements familiaux</SelectItem>
            <SelectItem value="unpaid">Absence non rémunérée</SelectItem>
            <SelectItem value="unpaidExcused">Absence justifiée non rémunérée</SelectItem>
            <SelectItem value="unpaidUnexcused">Absence injustifiée non rémunérée</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-4">
        {filteredLeaveRequests.length > 0 ? (
          filteredLeaveRequests.map((request) => {
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
                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
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
                          onClick={() => handleCancel(request.id)}
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Supprimer
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <p className="text-center text-gray-500">Aucune demande de congés</p>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la demande de congé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Motif
              </label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motif de la demande"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateLeave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
