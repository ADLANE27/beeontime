import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock4, CalendarDays } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { PayslipList } from "@/components/payslip/PayslipList";
import { EmployeeLeaveList } from "@/components/leave/EmployeeLeaveList";
import { TimeClock } from "@/components/attendance/TimeClock";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EmployeeDashboard = () => {
  // Vérifier les nouveaux documents
  const { data: newDocuments = 0 } = useQuery({
    queryKey: ['new-documents'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .or(`employee_id.eq.${user.id},employee_id.is.null`)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;
      return data.length;
    }
  });

  // Vérifier les demandes de congés en attente de validation
  const { data: pendingLeaves = 0 } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('employee_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      return data.length;
    }
  });

  // Vérifier les demandes d'heures supplémentaires en attente
  const { data: pendingOvertimes = 0 } = useQuery({
    queryKey: ['pending-overtimes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('overtime_requests')
        .select('id')
        .eq('employee_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      return data.length;
    }
  });

  // Vérifier les retards en attente
  const { data: pendingDelays = 0 } = useQuery({
    queryKey: ['pending-delays'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('delays')
        .select('id')
        .eq('employee_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      return data.length;
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Time Clock Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <TimeClock />
        </div>

        {/* Main Navigation Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 gap-4 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="documents" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors relative"
            >
              <FileText className="h-5 w-5" />
              Documents
              {newDocuments > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2">
                  {newDocuments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="leave"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors relative"
            >
              <CalendarDays className="h-5 w-5" />
              Congés
              {pendingLeaves > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2">
                  {pendingLeaves}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="overtime"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors relative"
            >
              <Clock4 className="h-5 w-5" />
              Heures Supp.
              {pendingOvertimes > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2">
                  {pendingOvertimes}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="m-0">
            <div className="bg-white rounded-lg shadow p-6">
              <PayslipList />
            </div>
          </TabsContent>

          <TabsContent value="leave" className="m-0">
            <div className="bg-white rounded-lg shadow p-6">
              <Tabs defaultValue="request" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 gap-4 bg-transparent h-auto p-0">
                  <TabsTrigger 
                    value="request" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Nouvelle demande
                  </TabsTrigger>
                  <TabsTrigger 
                    value="list" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Historique
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="request" className="m-0">
                  <LeaveRequestForm />
                </TabsContent>

                <TabsContent value="list" className="m-0">
                  <EmployeeLeaveList />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="overtime" className="m-0">
            <div className="bg-white rounded-lg shadow p-6">
              <OvertimeList />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;