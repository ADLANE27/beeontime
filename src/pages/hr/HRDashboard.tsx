import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, AlertTriangle, Clock4, FileText, Calendar, Download, Users } from "lucide-react";
import { PayslipManagement } from "@/components/payslip/PayslipManagement";
import { AdminPlanning } from "@/components/planning/AdminPlanning";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { DelayList } from "@/components/delays/DelayList";
import { ExportDataTab } from "@/components/export/ExportDataTab";
import { LeaveRequestsList } from "@/components/leave/LeaveRequestsList";
import { EmployeesList } from "@/components/employee/EmployeesList";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const HRDashboard = () => {
  useEffect(() => {
    const checkAccess = async () => {
      console.log('Checking HR access...');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);

      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }

        console.log('User profile:', profile);

        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('*');

        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          return;
        }

        console.log('Fetched employees:', employees);
      }
    };

    checkAccess();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="employees">
              <Users className="mr-2 h-4 w-4" />
              Employés
            </TabsTrigger>
            <TabsTrigger value="planning">
              <Calendar className="mr-2 h-4 w-4" />
              Planning
            </TabsTrigger>
            <TabsTrigger value="leave">
              <Clock className="mr-2 h-4 w-4" />
              Demandes de congés
            </TabsTrigger>
            <TabsTrigger value="overtime">
              <Clock4 className="mr-2 h-4 w-4" />
              Heures supplémentaires
            </TabsTrigger>
            <TabsTrigger value="lateness">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Retards
            </TabsTrigger>
            <TabsTrigger value="payslips">
              <FileText className="mr-2 h-4 w-4" />
              Documents
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

          <TabsContent value="export">
            <ExportDataTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;