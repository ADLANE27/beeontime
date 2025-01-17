import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const LeaveStatistics = () => {
  const { data: leaveStats, isLoading } = useQuery({
    queryKey: ['leave-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('type, status')
        .eq('status', 'approved');

      if (error) throw error;

      const statsByType = data.reduce((acc: { [key: string]: number }, request) => {
        acc[request.type] = (acc[request.type] || 0) + 1;
        return acc;
      }, {});

      const total = data.length;

      return { statsByType, total };
    }
  });

  if (isLoading) return <div>Chargement des statistiques...</div>;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Statistiques des congés</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {leaveStats && Object.entries(leaveStats.statsByType).map(([type, count]) => (
            <div key={type} className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">{type}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600">Total tous types confondus</p>
          <p className="text-2xl font-bold">{leaveStats?.total || 0}</p>
        </div>
      </div>
    </Card>
  );
};