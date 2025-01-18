import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock4, CalendarDays } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { PayslipList } from "@/components/payslip/PayslipList";
import { EmployeeLeaveList } from "@/components/leave/EmployeeLeaveList";
import { TimeClock } from "@/components/attendance/TimeClock";

const EmployeeDashboard = () => {
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
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="leave"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              <CalendarDays className="h-5 w-5" />
              Congés
            </TabsTrigger>
            <TabsTrigger 
              value="overtime"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Clock4 className="h-5 w-5" />
              Heures Supp.
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