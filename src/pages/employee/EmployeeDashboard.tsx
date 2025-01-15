import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, Clock4 } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { PayslipList } from "@/components/payslip/PayslipList";
import { EmployeeLeaveList } from "@/components/leave/EmployeeLeaveList";
import { TimeClock } from "@/components/attendance/TimeClock";

const EmployeeDashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <TimeClock />
        
        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="leave">
              <Clock className="mr-2 h-4 w-4" />
              Congés
            </TabsTrigger>
            <TabsTrigger value="overtime">
              <Clock4 className="mr-2 h-4 w-4" />
              Heures Supp.
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <PayslipList />
          </TabsContent>

          <TabsContent value="leave">
            <Tabs defaultValue="request" className="space-y-4">
              <TabsList>
                <TabsTrigger value="request">
                  Demande de congé
                </TabsTrigger>
                <TabsTrigger value="list">
                  Mes demandes de congés
                </TabsTrigger>
              </TabsList>

              <TabsContent value="request">
                <LeaveRequestForm />
              </TabsContent>

              <TabsContent value="list">
                <EmployeeLeaveList />
              </TabsContent>
            </Tabs>
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