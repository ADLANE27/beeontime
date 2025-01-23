import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock4, CalendarDays, AlertTriangle, Menu } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { PayslipList } from "@/components/payslip/PayslipList";
import { EmployeeLeaveList } from "@/components/leave/EmployeeLeaveList";
import { TimeClock } from "@/components/attendance/TimeClock";
import { EmployeeDelayList } from "@/components/delays/EmployeeDelayList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const EmployeeDashboard = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("documents");

  const navigationItems = [
    { value: "documents", label: "Documents", icon: FileText },
    { value: "leave", label: "Congés", icon: CalendarDays },
    { value: "overtime", label: "Heures Supp.", icon: Clock4 },
    { value: "delays", label: "Retards", icon: AlertTriangle },
  ];

  const renderMobileNavigation = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden fixed top-4 right-4 z-50">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[80%] sm:w-[385px]">
        <nav className="flex flex-col gap-2 mt-8">
          {navigationItems.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={activeTab === value ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => {
                setActiveTab(value);
              }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );

  const renderDesktopNavigation = () => (
    <TabsList className="hidden lg:grid w-full grid-cols-4 gap-4 bg-transparent h-auto p-0">
      {navigationItems.map(({ value, label, icon: Icon }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Icon className="h-5 w-5" />
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Time Clock Section - Fixed on mobile */}
        <div className="bg-white rounded-lg shadow p-6 sticky top-0 z-40">
          <TimeClock />
        </div>

        {/* Mobile Menu */}
        {isMobile && renderMobileNavigation()}

        {/* Main Navigation Tabs */}
        <Tabs 
          defaultValue="documents" 
          className="space-y-6"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          {/* Desktop Navigation */}
          {!isMobile && renderDesktopNavigation()}

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

          <TabsContent value="delays" className="m-0">
            <EmployeeDelayList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;