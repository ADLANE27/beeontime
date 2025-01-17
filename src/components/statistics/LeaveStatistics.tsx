import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const LEAVE_TYPES_FR = {
  vacation: "Congés payés",
  annual: "Congés annuels",
  paternity: "Congé paternité",
  maternity: "Congé maternité",
  sickChild: "Enfant malade",
  unpaidUnexcused: "Sans solde non excusé",
  unpaidExcused: "Sans solde excusé",
  unpaid: "Sans solde",
  rtt: "RTT",
  familyEvent: "Événement familial"
};

export const LeaveStatistics = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const { data: leaveStats, isLoading } = useQuery({
    queryKey: ['leave-statistics', selectedMonth],
    queryFn: async () => {
      const year = new Date().getFullYear();
      const firstDay = new Date(year, selectedMonth - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, selectedMonth, 0).toISOString().split('T')[0];

      console.log('Période sélectionnée:', firstDay, 'à', lastDay);

      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'approved')
        .gte('start_date', firstDay)
        .lte('end_date', lastDay);

      if (error) {
        console.error('Error fetching leave stats:', error);
        throw error;
      }

      console.log('Toutes les demandes de congés approuvées:', data);

      const statsByType: { [key: string]: number } = {};
      let total = 0;

      data?.forEach(request => {
        console.log('\nAnalyse de la demande de congé:', {
          start_date: request.start_date,
          end_date: request.end_date,
          type: request.type,
          day_type: request.day_type,
          status: request.status
        });
        
        // Pour une journée complète, on compte 1, pour une demi-journée 0.5
        const daysCount = request.day_type === 'half' ? 0.5 : 1;
        console.log('Nombre de jours pour cette demande:', daysCount);

        // Ajouter au total par type
        statsByType[request.type] = (statsByType[request.type] || 0) + daysCount;
        total += daysCount;

        console.log(`Total pour le type ${request.type}:`, statsByType[request.type]);
        console.log('Total général:', total);
      });

      return { statsByType, total };
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
        <h3 className="text-lg font-semibold">Statistiques des congés</h3>
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
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {leaveStats && Object.entries(leaveStats.statsByType).map(([type, count]) => (
            <div key={type} className="p-4 border rounded-lg">
              <p className="text-sm text-gray-600">{LEAVE_TYPES_FR[type as keyof typeof LEAVE_TYPES_FR]}</p>
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