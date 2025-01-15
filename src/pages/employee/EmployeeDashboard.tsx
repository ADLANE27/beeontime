import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, Clock4, CalendarDays } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { PayslipList } from "@/components/payslip/PayslipList";
import { EmployeeLeaveList } from "@/components/leave/EmployeeLeaveList";
import { TimeClock } from "@/components/attendance/TimeClock";
import { Card } from "@/components/ui/card";

const EmployeeDashboard = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Bienvenue sur votre espace personnel
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Gérez vos congés, documents et heures supplémentaires en toute simplicité
          </p>
        </div>

        {/* Time Clock Card */}
        <Card className="p-6 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-none">
          <TimeClock />
        </Card>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="inline-flex h-14 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full sm:w-auto">
            <TabsTrigger 
              value="documents" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50"
            >
              <FileText className="mr-2 h-5 w-5" />
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="leave"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50"
            >
              <CalendarDays className="mr-2 h-5 w-5" />
              Congés
            </TabsTrigger>
            <TabsTrigger 
              value="overtime"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50"
            >
              <Clock4 className="mr-2 h-5 w-5" />
              Heures Supp.
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-6">
            <Card className="p-6">
              <PayslipList />
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <Card className="p-6">
              <Tabs defaultValue="request" className="space-y-6">
                <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                  <TabsTrigger value="request" className="rounded-md px-4 py-2">
                    Nouvelle demande
                  </TabsTrigger>
                  <TabsTrigger value="list" className="rounded-md px-4 py-2">
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