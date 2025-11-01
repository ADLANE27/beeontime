import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Calendar, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle, 
  FileText,
  Flame,
  Clock4,
  CalendarDays
} from "lucide-react";
import { differenceInDays, startOfMonth, endOfMonth, parseISO, format } from "date-fns";

export const EmployeeAnalytics = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['employee-analytics'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Fetch this month's time records
      const { data: timeRecords } = await supabase
        .from('time_records')
        .select('*')
        .eq('employee_id', user.id)
        .gte('date', monthStart.toISOString().split('T')[0])
        .lte('date', monthEnd.toISOString().split('T')[0]);

      // Fetch overtime requests
      const { data: overtimeRequests } = await supabase
        .from('overtime_requests')
        .select('*')
        .eq('employee_id', user.id);

      // Fetch leave requests
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', user.id);

      // Fetch delays
      const { data: delays } = await supabase
        .from('delays')
        .select('*')
        .eq('employee_id', user.id);

      // Fetch employee info for vacation days
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch recent payslips
      const { data: recentPayslips } = await supabase
        .from('documents')
        .select('*')
        .eq('employee_id', user.id)
        .eq('type', 'payslip')
        .eq('viewed', false)
        .order('created_at', { ascending: false })
        .limit(1);

      // Calculate total hours worked this month
      let totalHours = 0;
      let daysPresent = 0;
      const arrivalTimes: number[] = [];

      timeRecords?.forEach(record => {
        if (record.morning_in && record.evening_out) {
          daysPresent++;
          
          // Calculate hours for the day
          const morningIn = parseISO(`2000-01-01T${record.morning_in}`);
          const lunchOut = record.lunch_out ? parseISO(`2000-01-01T${record.lunch_out}`) : null;
          const lunchIn = record.lunch_in ? parseISO(`2000-01-01T${record.lunch_in}`) : null;
          const eveningOut = parseISO(`2000-01-01T${record.evening_out}`);

          let dayHours = 0;
          if (lunchOut && lunchIn) {
            const morningHours = (lunchOut.getTime() - morningIn.getTime()) / (1000 * 60 * 60);
            const afternoonHours = (eveningOut.getTime() - lunchIn.getTime()) / (1000 * 60 * 60);
            dayHours = morningHours + afternoonHours;
          } else {
            dayHours = (eveningOut.getTime() - morningIn.getTime()) / (1000 * 60 * 60);
          }
          totalHours += dayHours;

          // Track arrival time (in minutes from midnight)
          const arrivalMinutes = morningIn.getHours() * 60 + morningIn.getMinutes();
          arrivalTimes.push(arrivalMinutes);
        }
      });

      // Calculate average arrival time
      const avgArrivalMinutes = arrivalTimes.length > 0
        ? arrivalTimes.reduce((a, b) => a + b, 0) / arrivalTimes.length
        : 0;
      const avgArrivalHours = Math.floor(avgArrivalMinutes / 60);
      const avgArrivalMins = Math.round(avgArrivalMinutes % 60);

      // Calculate on-time streak (assuming 9:00 AM is on-time)
      let onTimeStreak = 0;
      const sortedRecords = [...(timeRecords || [])].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      for (const record of sortedRecords) {
        if (record.morning_in) {
          const arrival = parseISO(`2000-01-01T${record.morning_in}`);
          const onTimeThreshold = parseISO('2000-01-01T09:00:00');
          if (arrival <= onTimeThreshold) {
            onTimeStreak++;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      // Calculate working days in month (excluding weekends)
      let workingDays = 0;
      const current = new Date(monthStart);
      while (current <= monthEnd && current <= now) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          workingDays++;
        }
        current.setDate(current.getDate() + 1);
      }

      // Overtime stats
      const pendingOvertime = overtimeRequests?.filter(r => r.status === 'pending').length || 0;
      const approvedOvertime = overtimeRequests?.filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + Number(r.hours), 0) || 0;

      // Pending requests
      const pendingLeave = leaveRequests?.filter(r => r.status === 'pending').length || 0;
      const pendingDelays = delays?.filter(d => d.status === 'pending').length || 0;

      // Vacation insights
      const previousYearDaysRemaining = (employee?.previous_year_vacation_days || 0) - 
        (employee?.previous_year_used_days || 0);
      const daysUntilExpiration = differenceInDays(new Date('2025-05-31'), now);

      return {
        totalHours: Math.round(totalHours * 10) / 10,
        daysPresent,
        workingDays,
        avgArrival: `${String(avgArrivalHours).padStart(2, '0')}:${String(avgArrivalMins).padStart(2, '0')}`,
        onTimeStreak,
        pendingOvertime,
        approvedOvertime: Math.round(approvedOvertime * 10) / 10,
        pendingLeave,
        pendingDelays,
        previousYearDaysRemaining,
        daysUntilExpiration,
        hasNewPayslip: (recentPayslips?.length || 0) > 0
      };
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* This Month's Summary */}
      <Card className="p-4 sm:p-6 hover-lift glass-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 sm:p-3 rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-base sm:text-lg">Ce mois-ci</h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Heures travaillées</span>
            <span className="font-bold text-base sm:text-lg text-primary">{stats?.totalHours}h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Heures supp. validées</span>
            <span className="font-bold text-base sm:text-lg text-accent">{stats?.approvedOvertime}h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Jours présents</span>
            <span className="font-semibold text-sm sm:text-base">
              {stats?.daysPresent}/{stats?.workingDays}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-muted-foreground">Arrivée moyenne</span>
            <span className="font-semibold text-sm sm:text-base">{stats?.avgArrival}</span>
          </div>
          {stats?.onTimeStreak && stats.onTimeStreak > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <span className="text-xs sm:text-sm font-medium">
                Série à l'heure: {stats.onTimeStreak} jour{stats.onTimeStreak > 1 ? 's' : ''} 🔥
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Pending Requests Status */}
      <Card className="p-4 sm:p-6 hover-lift glass-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 sm:p-3 rounded-xl bg-accent/10">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
          </div>
          <h3 className="font-semibold text-base sm:text-lg">Demandes en attente</h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">Congés</span>
            </div>
            <Badge variant={stats?.pendingLeave ? "default" : "secondary"} className="text-xs sm:text-sm">
              {stats?.pendingLeave || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Clock4 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">Heures supp.</span>
            </div>
            <Badge variant={stats?.pendingOvertime ? "default" : "secondary"} className="text-xs sm:text-sm">
              {stats?.pendingOvertime || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm text-muted-foreground">Retards</span>
            </div>
            <Badge variant={stats?.pendingDelays ? "default" : "secondary"} className="text-xs sm:text-sm">
              {stats?.pendingDelays || 0}
            </Badge>
          </div>
          {!stats?.pendingLeave && !stats?.pendingOvertime && !stats?.pendingDelays && (
            <div className="flex items-center gap-2 pt-2 text-xs sm:text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Tout est à jour! ✨</span>
            </div>
          )}
        </div>
      </Card>

      {/* Smart Insights */}
      <Card className="p-4 sm:p-6 hover-lift glass-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <h3 className="font-semibold text-base sm:text-lg">Notifications</h3>
        </div>
        <div className="space-y-3">
          {stats?.previousYearDaysRemaining && stats.previousYearDaysRemaining > 0 && (
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-orange-900 dark:text-orange-100">
                    ⚠️ Utilisez {stats.previousYearDaysRemaining} jour{stats.previousYearDaysRemaining > 1 ? 's' : ''} de congé 2024 avant le 31 mai!
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Plus que {stats.daysUntilExpiration} jours
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {stats?.onTimeStreak && stats.onTimeStreak >= 5 && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-2">
                <Flame className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-green-900 dark:text-green-100">
                  🎉 Vous êtes à l'heure depuis {stats.onTimeStreak} jours! Continuez comme ça!
                </p>
              </div>
            </div>
          )}

          {stats?.hasNewPayslip && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                  📄 Nouveau bulletin de paie disponible au téléchargement
                </p>
              </div>
            </div>
          )}

          {!stats?.previousYearDaysRemaining && !stats?.hasNewPayslip && (!stats?.onTimeStreak || stats.onTimeStreak < 5) && (
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Aucune notification pour le moment ✨
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
