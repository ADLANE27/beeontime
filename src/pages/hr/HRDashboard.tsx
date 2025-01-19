import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  AlertTriangle, 
  Clock4, 
  FileText, 
  Calendar, 
  Download, 
  Users, 
  BarChart,
  ClipboardList 
} from "lucide-react";
import { PayslipManagement } from "@/components/payslip/PayslipManagement";
import { AdminPlanning } from "@/components/planning/AdminPlanning";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { DelayList } from "@/components/delays/DelayList";
import { ExportDataTab } from "@/components/export/ExportDataTab";
import { LeaveRequestsList } from "@/components/leave/LeaveRequestsList";
import { EmployeesList } from "@/components/employee/EmployeesList";
import { StatisticsTab } from "@/components/statistics/StatisticsTab";
import { HREventsList } from "@/components/hr-events/HREventsList";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const HRDashboard = () => {
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingOvertimes, setPendingOvertimes] = useState(0);
  const [pendingDelays, setPendingDelays] = useState(0);

  useEffect(() => {
    const fetchPendingCounts = async () => {
      console.log('Fetching pending counts...');
      
      const [leaveRes, overtimeRes, delayRes] = await Promise.all([
        supabase
          .from('leave_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        supabase
          .from('overtime_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        supabase
          .from('delays')
          .select('id', { count: 'exact' })
          .eq('status', 'pending')
      ]);

      if (leaveRes.count !== null) setPendingLeaves(leaveRes.count);
      if (overtimeRes.count !== null) setPendingOvertimes(overtimeRes.count);
      if (delayRes.count !== null) setPendingDelays(delayRes.count);
      
      console.log('Pending counts:', {
        leaves: leaveRes.count,
        overtimes: overtimeRes.count,
        delays: delayRes.count
      });
    };

    fetchPendingCounts();

    // Subscribe to real-time updates
    const leaveChannel = supabase
      .channel('leave-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        () => fetchPendingCounts()
      )
      .subscribe();

    const overtimeChannel = supabase
      .channel('overtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'overtime_requests' },
        () => fetchPendingCounts()
      )
      .subscribe();

    const delayChannel = supabase
      .channel('delay-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delays' },
        () => fetchPendingCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leaveChannel);
      supabase.removeChannel(overtimeChannel);
      supabase.removeChannel(delayChannel);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="flex flex-wrap items-center gap-2">
            <TabsTrigger value="employees">
              <Users className="mr-2 h-4 w-4" />
              Employés
            </TabsTrigger>
            <TabsTrigger value="planning">
              <Calendar className="mr-2 h-4 w-4" />
              Planning
            </TabsTrigger>
            <TabsTrigger value="events">
              <ClipboardList className="mr-2 h-4 w-4" />
              Événements RH
            </TabsTrigger>
            <TabsTrigger value="leave" className="relative">
              <Clock className="mr-2 h-4 w-4" />
              Demandes de congés
              {pendingLeaves > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {pendingLeaves}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overtime" className="relative">
              <Clock4 className="mr-2 h-4 w-4" />
              Heures supplémentaires
              {pendingOvertimes > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {pendingOvertimes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="lateness" className="relative">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Retards
              {pendingDelays > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {pendingDelays}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payslips">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <BarChart className="mr-2 h-4 w-4" />
              Statistiques
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="mr-2 h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeesList />
          </TabsContent>

          <TabsContent value="planning">
            <AdminPlanning />
          </TabsContent>

          <TabsContent value="events">
            <HREventsList />
          </TabsContent>

          <TabsContent value="leave">
            <LeaveRequestsList />
          </TabsContent>

          <TabsContent value="overtime">
            <OvertimeList />
          </TabsContent>

          <TabsContent value="lateness">
            <DelayList />
          </TabsContent>

          <TabsContent value="payslips">
            <PayslipManagement />
          </TabsContent>

          <TabsContent value="statistics">
            <StatisticsTab />
          </TabsContent>

          <TabsContent value="export">
            <ExportDataTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
