import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, Clock4, CalendarDays, User2 } from "lucide-react";
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
        {/* Welcome Section with enhanced visual hierarchy */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-8 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900">
          <div className="flex items-center gap-3 mb-3">
            <User2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Votre espace personnel
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Gérez facilement vos congés, documents et heures supplémentaires. Tout ce dont vous avez besoin est à portée de main.
          </p>
        </div>

        {/* Time Clock Card with improved visual feedback */}
        <Card className="p-6 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-none transition-all duration-300 hover:shadow-xl">
          <TimeClock />
        </Card>
        
        {/* Main Content Tabs with enhanced accessibility and visual feedback */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="inline-flex h-16 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full sm:w-auto gap-2">
            <TabsTrigger 
              value="documents" 
              className="flex-1 sm:flex-initial inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-4 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50 group"
            >
              <FileText className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="leave"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-4 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50 group"
            >
              <CalendarDays className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Congés
            </TabsTrigger>
            <TabsTrigger 
              value="overtime"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center whitespace-nowrap rounded-md px-6 py-4 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-background/50 group"
            >
              <Clock4 className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Heures Supp.
            </TabsTrigger>
          </TabsList>

          {/* Content sections with consistent styling and improved visual hierarchy */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <PayslipList />
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <Tabs defaultValue="request" className="space-y-6">
                <TabsList className="inline-flex h-12 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                  <TabsTrigger 
                    value="request" 
                    className="rounded-md px-6 py-3 transition-all duration-200 hover:bg-background/80"
                  >
                    Nouvelle demande
                  </TabsTrigger>
                  <TabsTrigger 
                    value="list" 
                    className="rounded-md px-6 py-3 transition-all duration-200 hover:bg-background/80"
                  >
                    Historique
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="request" className="animate-fade-in">
                  <LeaveRequestForm />
                </TabsContent>

                <TabsContent value="list" className="animate-fade-in">
                  <EmployeeLeaveList />
                </TabsContent>
              </Tabs>
            </Card>
          </TabsContent>

          <TabsContent value="overtime">
            <Card className="p-6 shadow-md hover:shadow-lg transition-shadow duration-300">
              <OvertimeList />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;