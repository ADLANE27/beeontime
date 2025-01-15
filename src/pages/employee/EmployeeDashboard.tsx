import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FileText, Clock4 } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { PayslipList } from "@/components/payslip/PayslipList";
import { EmployeeLeaveList } from "@/components/leave/EmployeeLeaveList";

const EmployeeDashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="leave-request">
              <Clock className="mr-2 h-4 w-4" />
              Demande de congé
            </TabsTrigger>
            <TabsTrigger value="leave-list">
              <Clock className="mr-2 h-4 w-4" />
              Mes demandes de congés
            </TabsTrigger>
            <TabsTrigger value="overtime">
              <Clock4 className="mr-2 h-4 w-4" />
              Heures Supp.
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <PayslipList />
          </TabsContent>

          <TabsContent value="leave-request">
            <LeaveRequestForm />
          </TabsContent>

          <TabsContent value="leave-list">
            <EmployeeLeaveList />
          </TabsContent>

          <TabsContent value="overtime">
            <OvertimeList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;