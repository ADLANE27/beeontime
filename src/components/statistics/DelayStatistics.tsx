import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { fr } from "date-fns/locale";

export const DelayStatistics = () => {
  const { data: delayStats, isLoading } = useQuery({
    queryKey: ['delay-statistics'],
    queryFn: async () => {
      const now = new Date();
      const weekStart = format(startOfWeek(now, { locale: fr }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(now, { locale: fr }), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      // Récupérer tous les retards
      const { data: delays, error } = await supabase
        .from('delays')
        .select(`
          *,
          employees (
            first_name,
            last_name
          )
        `)
        .eq('status', 'approved');

      if (error) throw error;

      // Calculer les moyennes
      const weeklyDelays = delays.filter(d => d.date >= weekStart && d.date <= weekEnd);
      const monthlyDelays = delays.filter(d => d.date >= monthStart && d.date <= monthEnd);

      // Grouper par employé
      const byEmployee = delays.reduce((acc: any, delay) => {
        const employeeId = delay.employee_id;
        if (!acc[employeeId]) {
          acc[employeeId] = {
            name: `${delay.employees.first_name} ${delay.employees.last_name}`,
            count: 0,
            totalDuration: 0
          };
        }
        acc[employeeId].count += 1;
        // Convertir la durée (format interval) en minutes
        const durationMatch = delay.duration.toString().match(/(\d+):(\d+):(\d+)/);
        if (durationMatch) {
          const [_, hours, minutes] = durationMatch;
          acc[employeeId].totalDuration += parseInt(hours) * 60 + parseInt(minutes);
        }
        return acc;
      }, {});

      return {
        weeklyAverage: weeklyDelays.length / 7,
        monthlyAverage: monthlyDelays.length / 30,
        byEmployee,
        total: delays.length
      };
    }
  });

  if (isLoading) return <div>Chargement des statistiques...</div>;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Statistiques des retards</h3>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-600">Moyenne hebdomadaire</p>
            <p className="text-2xl font-bold">
              {delayStats?.weeklyAverage.toFixed(1)} retards/jour
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-600">Moyenne mensuelle</p>
            <p className="text-2xl font-bold">
              {delayStats?.monthlyAverage.toFixed(1)} retards/jour
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Par employé</h4>
          <div className="space-y-2">
            {delayStats && Object.entries(delayStats.byEmployee).map(([id, data]: [string, any]) => (
              <div key={id} className="p-4 border rounded-lg">
                <p className="font-medium">{data.name}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <p className="text-sm text-gray-600">
                    Nombre total : <span className="font-medium">{data.count}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Durée moyenne : <span className="font-medium">
                      {Math.round(data.totalDuration / data.count)} min
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-sm text-gray-600">Total des retards</p>
          <p className="text-2xl font-bold">{delayStats?.total || 0}</p>
        </div>
      </div>
    </Card>
  );
};