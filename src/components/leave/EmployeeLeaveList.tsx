import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2 } from "lucide-react";

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

export const EmployeeLeaveList = () => {
  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['employee-leave-requests'],
    queryFn: async () => {
      console.log('Fetching leave requests...');
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
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
          <Card key={request.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    Du {format(new Date(request.start_date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                  <p className="font-semibold">
                    au {format(new Date(request.end_date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <p className="text-sm text-gray-600">Type: {request.type}</p>
                {request.reason && (
                  <p className="text-sm text-gray-600">Motif: {request.reason}</p>
                )}
                <p className="text-sm text-gray-600">
                  Type de journée: {request.day_type === "complete" ? "Journée complète" : "Demi-journée"}
                </p>
              </div>
              <Badge className={getStatusColor(request.status)}>
                {getStatusText(request.status)}
              </Badge>
            </div>
          </Card>
        ))}
        {leaveRequests?.length === 0 && (
          <p className="text-center text-gray-500">Aucune demande de congés</p>
        )}
      </div>
    </Card>
  );
};