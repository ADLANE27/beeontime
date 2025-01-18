import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock4, CalendarDays } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { PayslipList } from "@/components/payslip/PayslipList";
import { EmployeeLeaveList } from "@/components/leave/EmployeeLeaveList";
import { TimeClock } from "@/components/attendance/TimeClock";
import { NotificationsListener, unreadDocumentsAtom, unreadLeavesAtom, unreadOvertimeAtom } from "@/components/notifications/NotificationsListener";
import { useAtom } from "jotai";
import { Badge } from "@/components/ui/badge";

const EmployeeDashboard = () => {
  const [unreadDocuments] = useAtom(unreadDocumentsAtom);
  const [unreadLeaves] = useAtom(unreadLeavesAtom);
  const [unreadOvertime] = useAtom(unreadOvertimeAtom);

  return (
    <DashboardLayout>
      <NotificationsListener />
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
              {unreadDocuments > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2">
                  {unreadDocuments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="leave"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors relative"
            >
              <CalendarDays className="h-5 w-5" />
              Congés
              {unreadLeaves > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2">
                  {unreadLeaves}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="overtime"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors relative"
            >
              <Clock4 className="h-5 w-5" />
              Heures Supp.
              {unreadOvertime > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2">
                  {unreadOvertime}
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
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors relative"
                  >
                    Historique
                    {unreadLeaves > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2">
                        {unreadLeaves}
                      </Badge>
                    )}
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