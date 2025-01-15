import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Calendar, Clock, AlertCircle } from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 border-green-800";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-800";
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-800";
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
    case "rtt":
      return "RTT";
    case "unpaid":
      return "Congé sans solde";
    case "familyEvent":
      return "Événement familial";
    default:
      return type;
  }
};

export const EmployeeLeaveList = () => {
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
        {leaveRequests?.map((request) => (
          <Card key={request.id} className="p-4 border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: request.status === 'approved' ? '#22c55e' : request.status === 'rejected' ? '#ef4444' : '#eab308' }}>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="font-semibold">
                    Du {format(new Date(request.start_date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                  <p className="font-semibold">
                    au {format(new Date(request.end_date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{getLeaveTypeText(request.type)}</span>
                </div>
                {request.reason && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Motif : {request.reason}</span>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Soumis le {format(new Date(request.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
              <Badge className={`${getStatusColor(request.status)} px-3 py-1`}>
                {getStatusText(request.status)}
              </Badge>
            </div>
            {request.status === 'rejected' && request.rejection_reason && (
              <div className="mt-3 p-3 bg-red-50 rounded-md">
                <p className="text-sm text-red-800">
                  Motif du refus : {request.rejection_reason}
                </p>
              </div>
            )}
          </Card>
        ))}
        {(!leaveRequests || leaveRequests.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune demande de congés</p>
          </div>
        )}
      </div>
    </Card>
  );
};