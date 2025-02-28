
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { LoadingScreen } from "@/components/ui/loading-screen";

export const OvertimeStatistics = () => {
  const { data: overtimeStats, isLoading } = useQuery({
    queryKey: ['overtime-statistics'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('overtime_requests')
        .select('hours')
        .eq('status', 'approved')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (error) throw error;

      const totalHours = data.reduce((sum, record) => sum + Number(record.hours), 0);

      return { totalHours };
    }
  });

  if (isLoading) return (
    <Card className="p-6">
      <LoadingScreen size="sm" message="Chargement des statistiques..." />
    </Card>
  );

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Statistiques des heures supplémentaires</h3>
      <div className="p-4 border rounded-lg">
        <p className="text-sm text-gray-600">Total du mois en cours</p>
        <p className="text-2xl font-bold">{overtimeStats?.totalHours.toFixed(1)} heures</p>
      </div>
    </Card>
  );
};
