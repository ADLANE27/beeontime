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
      // Calculer le premier et dernier jour du mois sélectionné
      const year = new Date().getFullYear();
      const firstDay = new Date(year, selectedMonth - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, selectedMonth, 0).toISOString().split('T')[0];

      console.log('Fetching leaves for period:', firstDay, 'to', lastDay);

      // Récupérer toutes les demandes qui chevauchent le mois sélectionné
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'approved')
        .or(`start_date.lte.${lastDay},end_date.gte.${firstDay}`);

      if (error) {
        console.error('Error fetching leave stats:', error);
        throw error;
      }

      console.log('Raw leave data:', data);

      const statsByType: { [key: string]: number } = {};
      let total = 0;

      data?.forEach(request => {
        // Calculer le nombre de jours pour cette demande
        const start = new Date(request.start_date);
        const end = new Date(request.end_date);
        const days = request.day_type === 'half' ? 0.5 : 1;

        // Si la demande chevauche plusieurs mois, ne compter que les jours du mois sélectionné
        const monthStart = new Date(year, selectedMonth - 1, 1);
        const monthEnd = new Date(year, selectedMonth, 0);

        const effectiveStart = start < monthStart ? monthStart : start;
        const effectiveEnd = end > monthEnd ? monthEnd : end;

        // Calculer le nombre de jours entre les dates (inclus)
        const daysDiff = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Multiplier par 1 pour journée complète ou 0.5 pour demi-journée
        const adjustedDays = daysDiff * days;

        console.log(`Analyzing request:`, {
          startDate: request.start_date,
          endDate: request.end_date,
          dayType: request.day_type,
          period: request.period,
          type: request.type,
          calculatedDays: {
            daysDiff,
            days,
            adjustedDays
          }
        });

        statsByType[request.type] = (statsByType[request.type] || 0) + adjustedDays;
        total += adjustedDays;
      });

      console.log('Final calculated stats:', { statsByType, total });

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