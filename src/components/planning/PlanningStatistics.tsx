import { Card } from "@/components/ui/card";
import { Users, Calendar, Clock, TrendingUp } from "lucide-react";

interface PlanningStatisticsProps {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  totalLeaveHours: number;
  averagePresenceRate: number;
}

export const PlanningStatistics = ({
  totalEmployees,
  presentToday,
  absentToday,
  totalLeaveHours,
  averagePresenceRate,
}: PlanningStatisticsProps) => {
  const stats = [
    {
      label: "Total Employés",
      value: totalEmployees,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Présents Aujourd'hui",
      value: presentToday,
      icon: Calendar,
      color: "text-green-500",
    },
    {
      label: "Absents Aujourd'hui",
      value: absentToday,
      icon: Calendar,
      color: "text-orange-500",
    },
    {
      label: "Heures d'absence",
      value: totalLeaveHours,
      icon: Clock,
      color: "text-purple-500",
    },
    {
      label: "Taux de présence",
      value: `${averagePresenceRate}%`,
      icon: TrendingUp,
      color: "text-teal-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 hover-scale gradient-card">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-background/50 ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
