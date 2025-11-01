
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
      <div className="space-y-8 w-full animate-fade-in">
        {/* Welcome Header */}
        <div className="gradient-card rounded-2xl p-8 card-highlight hover-lift">
          <h1 className="text-3xl font-bold text-gradient mb-2">Bienvenue</h1>
          <p className="text-muted-foreground">Gérez votre temps et vos demandes en toute simplicité</p>
        </div>

        {/* Time Clock Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-8 hover-lift card-highlight border border-primary/10">
          <TimeClock />
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
          {isMobile ? (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                {menuItems.find(item => item.value === selectedTab)?.label}
              </h2>
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon" className="hover-scale">
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
                        className="w-full justify-start gap-2 hover-scale"
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
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elevation flex items-center gap-3 h-14 bg-white/80 backdrop-blur-sm shadow-soft hover:shadow-card hover-lift transition-all rounded-xl border border-transparent data-[state=active]:border-primary/20"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          <TabsContent value="documents" className="m-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-8 hover-lift border border-primary/5">
              <PayslipList />
            </div>
          </TabsContent>

          <TabsContent value="leave" className="m-0">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-8 hover-lift border border-primary/5">
              <Tabs defaultValue="request" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 gap-4 bg-transparent h-auto p-0">
                  <TabsTrigger 
                    value="request" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elevation h-12 bg-muted/50 hover:bg-muted transition-all rounded-lg font-medium"
                  >
                    Nouvelle demande
                  </TabsTrigger>
                  <TabsTrigger 
                    value="list" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-elevation h-12 bg-muted/50 hover:bg-muted transition-all rounded-lg font-medium"
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
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-8 hover-lift border border-primary/5">
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
