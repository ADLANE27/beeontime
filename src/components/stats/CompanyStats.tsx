import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export const CompanyStats = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#666'];

  const { data: totalEmployees = 0, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['total-employees'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  const { data: currentLeaves = 0, isLoading: isLoadingLeaves } = useQuery({
    queryKey: ['current-leaves', selectedMonth, selectedYear],
    queryFn: async () => {
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0);
      
      console.log('Fetching leaves between:', startDate.toISOString(), 'and', endDate.toISOString());
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select('start_date, end_date')
        .eq('status', 'approved')
        .gte('start_date', startDate.toISOString().split('T')[0])
        .lte('end_date', endDate.toISOString().split('T')[0]);
      
      if (error) {
        console.error('Error fetching leaves:', error);
        throw error;
      }

      // Compter le nombre total de jours de congés
      let totalDays = 0;
      data?.forEach(leave => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de début
        totalDays += diffDays;
      });
      
      console.log('Total leave days:', totalDays);
      return totalDays;
    }
  });

  const { data: totalOvertime = 0, isLoading: isLoadingOvertime } = useQuery({
    queryKey: ['total-overtime', selectedMonth, selectedYear],
    queryFn: async () => {
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0);
      
      const { data, error } = await supabase
        .from('overtime_requests')
        .select('hours')
        .eq('status', 'approved')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
      
      if (error) throw error;
      return data.reduce((acc, curr) => acc + Number(curr.hours), 0);
    }
  });

  const { data: positionData = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ['position-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('position, id');
      
      if (error) throw error;

      // Créer un objet pour compter les employés par poste
      const positions = data.reduce((acc: { [key: string]: number }, curr) => {
        if (curr.position) {
          acc[curr.position] = (acc[curr.position] || 0) + 1;
        }
        return acc;
      }, {});

      // Calculer le total des employés
      const totalEmployees = Object.values(positions).reduce((sum, count) => sum + count, 0);

      // Convertir en pourcentages
      return Object.entries(positions).map(([name, count]) => ({
        name,
        value: (count / totalEmployees) * 100
      }));
    }
  });

  const { data: monthlyStats = [], isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['monthly-stats', selectedMonth, selectedYear],
    queryFn: async () => {
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0);

      const { data: timeRecords, error: timeError } = await supabase
        .from('time_records')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (timeError) throw timeError;

      const { data: leaveRecords, error: leaveError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'approved')
        .gte('start_date', startDate.toISOString().split('T')[0])
        .lte('end_date', endDate.toISOString().split('T')[0]);

      if (leaveError) throw leaveError;

      const stats = Array.from({ length: endDate.getDate() }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(i + 1);
        const timeRecord = timeRecords?.filter(r => new Date(r.date).getDate() === (i + 1));
        const leaveRecord = leaveRecords?.filter(r => {
          const start = new Date(r.start_date);
          const end = new Date(r.end_date);
          return date >= start && date <= end;
        });

        return {
          month: date.toLocaleDateString('fr-FR', { day: 'numeric' }),
          presence: timeRecord?.length ? 100 : 0,
          absences: leaveRecord?.length ? 100 : 0
        };
      });

      return stats;
    }
  });

  const isLoading = isLoadingEmployees || isLoadingLeaves || isLoadingOvertime || 
                    isLoadingPositions || isLoadingMonthly;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <div className="space-y-2">
          <Label>Mois</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {new Date(2024, i).toLocaleString('fr-FR', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Année</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Effectif total</h3>
          <p className="text-3xl font-bold text-primary">{totalEmployees}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Taux de présence moyen</h3>
          <p className="text-3xl font-bold text-green-600">{averagePresence}%</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Congés en cours</h3>
          <p className="text-3xl font-bold text-blue-600">{currentLeaves}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Total heures supp.</h3>
          <p className="text-3xl font-bold text-purple-600">{totalOvertime}h</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Répartition par poste</h3>
          <div className="w-full h-[400px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={positionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {positionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Évolution mensuelle présence/absence</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="presence" fill="#4F46E5" name="Présence %" />
                <Bar dataKey="absences" fill="#EF4444" name="Absence %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
