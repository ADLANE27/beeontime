import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export const DelayStatistics = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const { data: delayStats, isLoading } = useQuery({
    queryKey: ['delay-statistics', selectedMonth],
    queryFn: async () => {
      const now = new Date();
      const year = now.getFullYear();
      const monthStart = format(startOfMonth(new Date(year, selectedMonth - 1)), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date(year, selectedMonth - 1)), 'yyyy-MM-dd');

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
        .eq('status', 'approved')
        .gte('date', monthStart)
        .lte('date', monthEnd);

      if (error) throw error;

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
        monthlyAverage: delays.length / new Date(year, selectedMonth, 0).getDate(),
        byEmployee,
        total: delays.length
      };
    }
  });

  const months = [
    { value: "1", label: "Janvier" },
    { value: "2", label: "Février" },
    { value: "3", label: "Mars" },
    { value: "4", label: "Avril" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juin" },
    { value: "7", label: "Juillet" },
    { value: "8", label: "Août" },
    { value: "9", label: "Septembre" },
    { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" },
    { value: "12", label: "Décembre" }
  ];

  if (isLoading) return <div>Chargement des statistiques...</div>;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Statistiques des retards</h3>
        <Select
          value={selectedMonth.toString()}
          onValueChange={(value) => setSelectedMonth(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sélectionner un mois" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-600">Moyenne mensuelle</p>
            <p className="text-2xl font-bold">
              {delayStats?.monthlyAverage.toFixed(1)} retards/jour
            </p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-gray-600">Total du mois</p>
            <p className="text-2xl font-bold">{delayStats?.total || 0} retards</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Statistiques par employé</h4>
          <div className="space-y-2">
            {delayStats && Object.entries(delayStats.byEmployee).map(([id, data]: [string, any]) => (
              <div key={id} className="p-4 border rounded-lg">
                <p className="font-medium">{data.name}</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <p className="text-sm text-gray-600">
                    Nombre de retards : <span className="font-medium">{data.count}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Durée moyenne : <span className="font-medium">
                      {Math.round(data.totalDuration / data.count)} min
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Durée totale : <span className="font-medium">
                      {Math.floor(data.totalDuration / 60)}h{String(data.totalDuration % 60).padStart(2, '0')}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};