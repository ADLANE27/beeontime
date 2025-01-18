import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getStatusLabel = (status: string) => {
  switch (status) {
    case "approved":
      return "Approuvé";
    case "rejected":
      return "Rejeté";
    case "pending":
      return "En attente";
    default:
      return status;
  }
};

export const EmployeeDelayList = () => {
  const { data: delays, isLoading } = useQuery({
    queryKey: ['employee-delays'],
    queryFn: async () => {
      console.log('Fetching employee delays...');
      const { data, error } = await supabase
        .from('delays')
        .select(`
          *,
          employees (
            first_name,
            last_name
          )
        `)
        .not('status', 'eq', 'pending');
      
      if (error) {
        console.error('Error fetching delays:', error);
        throw error;
      }
      console.log('Delays fetched:', data);
      return data;
    }
  });

  const formatDuration = (duration: unknown): string => {
    if (!duration || typeof duration !== 'string') return 'N/A';
    return duration.split('.')[0];
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
      <h2 className="text-2xl font-bold mb-6">Historique des retards</h2>
      <div className="space-y-4">
        {delays?.map((delay) => (
          <div key={delay.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Date: {delay.date}</p>
              <p className="text-sm text-gray-600">
                Heure prévue: {delay.scheduled_time} - Arrivée: {delay.actual_time}
              </p>
              <p className="text-sm text-gray-600">Durée: {formatDuration(delay.duration)}</p>
              <p className="text-sm text-gray-600">Motif: {delay.reason}</p>
            </div>
            <Badge
              variant={
                delay.status === "approved"
                  ? "secondary"
                  : delay.status === "rejected"
                  ? "destructive"
                  : "outline"
              }
            >
              {getStatusLabel(delay.status)}
            </Badge>
          </div>
        ))}
        {delays?.length === 0 && (
          <p className="text-center text-gray-500">Aucun retard à afficher</p>
        )}
      </div>
    </Card>
  );
};