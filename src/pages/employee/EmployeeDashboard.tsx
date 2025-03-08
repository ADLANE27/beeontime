import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock4, CalendarDays, AlertTriangle, Menu } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { PayslipList } from "@/components/payslip/PayslipList";
import { EmployeeLeaveList } from "@/components/leave/EmployeeLeaveList";
import { TimeClock } from "@/components/attendance/TimeClock";
import { EmployeeDelayList } from "@/components/delays/EmployeeDelayList";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const EmployeeDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("documents");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const menuItems = [
    { value: "documents", label: "Documents", icon: FileText },
    { value: "leave", label: "Congés", icon: CalendarDays },
    { value: "overtime", label: "Heures Supp.", icon: Clock4 },
    { value: "delays", label: "Retards", icon: AlertTriangle },
  ];

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setIsDrawerOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Time Clock Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <TimeClock />
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
          {isMobile ? (
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">
                {menuItems.find(item => item.value === selectedTab)?.label}
              </h1>
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="w-[300px] p-4">
                  <DrawerHeader className="p-0">
                    <DrawerTitle>Menu</DrawerTitle>
                  </DrawerHeader>
                  <div className="mt-4 flex flex-col gap-2">
                    {menuItems.map((item) => (
                      <Button
                        key={item.value}
                        variant={selectedTab === item.value ? "default" : "ghost"}
                        className="w-full justify-start gap-2"
                        onClick={() => handleTabChange(item.value)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          ) : (
            <TabsList className="grid w-full grid-cols-4 gap-4 bg-transparent h-auto p-0">
              {menuItems.map((item) => (
                <TabsTrigger 
                  key={item.value}
                  value={item.value} 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 h-12 bg-white shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

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
