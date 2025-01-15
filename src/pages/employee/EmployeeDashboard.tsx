import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock4, CalendarDays } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { PayslipList } from "@/components/payslip/PayslipList";
import { EmployeeLeaveList } from "@/components/leave/EmployeeLeaveList";
import { TimeClock } from "@/components/attendance/TimeClock";
import { Card } from "@/components/ui/card";

const EmployeeDashboard = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Time Clock Card */}
        <Card className="mb-6 p-6 shadow-md bg-white dark:bg-gray-800">
          <TimeClock />
        </Card>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList className="w-full flex space-x-2 bg-transparent p-0">
            <TabsTrigger 
              value="documents" 
              className="flex-1 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FileText className="mr-2 h-5 w-5" />
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="leave"
              className="flex-1 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <CalendarDays className="mr-2 h-5 w-5" />
              Congés
            </TabsTrigger>
            <TabsTrigger 
              value="overtime"
              className="flex-1 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Clock4 className="mr-2 h-5 w-5" />
              Heures Supp.
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <Card className="p-6">
              <PayslipList />
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <Card className="p-6">
              <Tabs defaultValue="request" className="space-y-4">
                <TabsList className="w-full flex space-x-2 bg-transparent p-0">
                  <TabsTrigger 
                    value="request" 
                    className="flex-1 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Nouvelle demande
                  </TabsTrigger>
                  <TabsTrigger 
                    value="list" 
                    className="flex-1 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Historique
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="request">
                  <LeaveRequestForm />
                </TabsContent>

                <TabsContent value="list">
                  <EmployeeLeaveList />
                </TabsContent>
              </Tabs>
            </Card>
          </TabsContent>

          <TabsContent value="overtime">
            <Card className="p-6">
              <OvertimeList />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;