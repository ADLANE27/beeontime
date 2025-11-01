import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  Clock4,
  FileText
} from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";

export const HRAnalytics = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['hr-analytics'],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Total employees
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Pending requests
      const { count: pendingLeave } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingOvertime } = await supabase
        .from('overtime_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingDelays } = await supabase
        .from('delays')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // This month stats
      const { data: overtimeThisMonth } = await supabase
        .from('overtime_requests')
        .select('hours')
        .eq('status', 'approved')
        .gte('date', monthStart.toISOString().split('T')[0])
        .lte('date', monthEnd.toISOString().split('T')[0]);

      const totalOvertimeHours = overtimeThisMonth?.reduce((sum, r) => sum + Number(r.hours), 0) || 0;

      // Active leaves today
      const today = now.toISOString().split('T')[0];
      const { count: activeLeaves } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);

      return {
        totalEmployees: totalEmployees || 0,
        pendingLeave: pendingLeave || 0,
        pendingOvertime: pendingOvertime || 0,
        pendingDelays: pendingDelays || 0,
        totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
        activeLeaves: activeLeaves || 0,
        totalPending: (pendingLeave || 0) + (pendingOvertime || 0) + (pendingDelays || 0)
      };
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Employés actifs",
      value: analytics?.totalEmployees || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      iconColor: "text-blue-600"
    },
    {
      title: "Demandes en attente",
      value: analytics?.totalPending || 0,
      icon: AlertTriangle,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      iconColor: "text-orange-600",
      highlight: (analytics?.totalPending || 0) > 0
    },
    {
      title: "Absents aujourd'hui",
      value: analytics?.activeLeaves || 0,
      icon: CalendarDays,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      iconColor: "text-purple-600"
    },
    {
      title: "Heures supp. ce mois",
      value: `${analytics?.totalOvertimeHours}h`,
      icon: Clock4,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      iconColor: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, index) => (
        <Card 
          key={index}
          className={`p-4 sm:p-6 hover-lift glass-card ${stat.highlight ? 'ring-2 ring-orange-500/20' : ''}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1 sm:mb-2">
                {stat.title}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {stat.value}
              </p>
            </div>
            <div className={`p-2 sm:p-3 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
            </div>
          </div>
          
          {stat.highlight && (analytics?.totalPending || 0) > 0 && (
            <div className="mt-3 sm:mt-4 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-orange-600">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-medium">Action requise</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
