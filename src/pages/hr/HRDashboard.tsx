
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  AlertTriangle, 
  Clock4, 
  FileText, 
  Calendar, 
  Download, 
  Users, 
  BarChart,
  ClipboardList,
} from "lucide-react";
import { PayslipManagement } from "@/components/payslip/PayslipManagement";
import { AdminPlanning } from "@/components/planning/AdminPlanning";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { DelayList } from "@/components/delays/DelayList";
import { ExportDataTab } from "@/components/export/ExportDataTab";
import { LeaveRequestsList } from "@/components/leave/LeaveRequestsList";
import { EmployeesList } from "@/components/employee/EmployeesList";
import { StatisticsTab } from "@/components/statistics/StatisticsTab";
import { HREventsList } from "@/components/hr-events/HREventsList";
import { HRAnalytics } from "@/components/hr/HRAnalytics";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

const HRDashboard = () => {
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingOvertimes, setPendingOvertimes] = useState(0);
  const [pendingDelays, setPendingDelays] = useState(0);
  const [selectedTab, setSelectedTab] = useState("employees");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchPendingCounts = async () => {
      console.log('Fetching pending counts...');
      
      const [leaveRes, overtimeRes, delayRes] = await Promise.all([
        supabase
          .from('leave_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        supabase
          .from('overtime_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending'),
        supabase
          .from('delays')
          .select('id', { count: 'exact' })
          .eq('status', 'pending')
      ]);

      if (leaveRes.count !== null) setPendingLeaves(leaveRes.count);
      if (overtimeRes.count !== null) setPendingOvertimes(overtimeRes.count);
      if (delayRes.count !== null) setPendingDelays(delayRes.count);
      
      console.log('Pending counts:', {
        leaves: leaveRes.count,
        overtimes: overtimeRes.count,
        delays: delayRes.count
      });
    };

    fetchPendingCounts();

    const leaveChannel = supabase
      .channel('leave-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leave_requests' },
        () => fetchPendingCounts()
      )
      .subscribe();

    const overtimeChannel = supabase
      .channel('overtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'overtime_requests' },
        () => fetchPendingCounts()
      )
      .subscribe();

    const delayChannel = supabase
      .channel('delay-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delays' },
        () => fetchPendingCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(leaveChannel);
      supabase.removeChannel(overtimeChannel);
      supabase.removeChannel(delayChannel);
    };
  }, []);

  const menuItems = [
    { value: "employees", label: "Employés", icon: Users },
    { value: "planning", label: "Planning", icon: Calendar },
    { value: "events", label: "Événements RH", icon: ClipboardList },
    { 
      value: "leave", 
      label: "Congés", 
      icon: Clock,
      badge: pendingLeaves > 0 ? pendingLeaves : null 
    },
    { 
      value: "overtime", 
      label: "Heures supplémentaires", 
      icon: Clock4,
      badge: pendingOvertimes > 0 ? pendingOvertimes : null
    },
    { 
      value: "lateness", 
      label: "Retards", 
      icon: AlertTriangle,
      badge: pendingDelays > 0 ? pendingDelays : null
    },
    { value: "payslips", label: "Documents", icon: FileText },
    { value: "statistics", label: "Statistiques", icon: BarChart },
    { value: "export", label: "Export", icon: Download },
  ];

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setIsDrawerOpen(false);
  };

  const renderTabContent = () => (
    <div className="min-h-[600px]">
      <TabsContent value="employees" className="mt-0">
        <EmployeesList />
      </TabsContent>
      <TabsContent value="planning" className="mt-0">
        <AdminPlanning />
      </TabsContent>
      <TabsContent value="events" className="mt-0">
        <HREventsList />
      </TabsContent>
      <TabsContent value="leave" className="mt-0">
        <LeaveRequestsList />
      </TabsContent>
      <TabsContent value="overtime" className="mt-0">
        <OvertimeList />
      </TabsContent>
      <TabsContent value="lateness" className="mt-0">
        <DelayList />
      </TabsContent>
      <TabsContent value="payslips" className="mt-0">
        <PayslipManagement />
      </TabsContent>
      <TabsContent value="statistics" className="mt-0">
        <StatisticsTab />
      </TabsContent>
      <TabsContent value="export" className="mt-0">
        <ExportDataTab />
      </TabsContent>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 w-full">
        {/* Analytics Dashboard */}
        <HRAnalytics />

        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4 w-full">
          {isMobile ? (
            <div className="flex flex-col gap-3 mb-4 w-full">
              <h2 className="text-xl sm:text-2xl font-bold text-gradient">
                {menuItems.find(item => item.value === selectedTab)?.label}
              </h2>
              
              <div className="overflow-x-auto pb-2 -mx-4 px-4 sticky top-14 sm:top-16 glass-card z-20 py-2">
                <div className="flex space-x-2 min-w-max">
                  {menuItems.map((item) => (
                    <Button
                      key={item.value}
                      variant={selectedTab === item.value ? "default" : "outline"}
                      size="sm"
                      className={`flex items-center gap-1.5 whitespace-nowrap h-9 transition-all hover-scale ${
                        selectedTab === item.value 
                          ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-card' 
                          : 'glass-card text-foreground/80'
                      }`}
                      onClick={() => handleTabChange(item.value)}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className={`ml-1 px-1 min-w-4 h-4 text-[10px] ${
                            selectedTab === item.value 
                              ? 'bg-primary-foreground/20 text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent className="w-[300px] p-4">
                  <DrawerHeader className="p-0 mb-2">
                    <DrawerTitle className="text-xl font-semibold text-primary">Menu</DrawerTitle>
                  </DrawerHeader>
                  <div className="mt-4 flex flex-col gap-2">
                    {menuItems.map((item) => (
                      <Button
                        key={item.value}
                        variant={selectedTab === item.value ? "default" : "ghost"}
                        className={`w-full justify-start gap-2 ${selectedTab === item.value ? 'shadow-md' : ''}`}
                        onClick={() => handleTabChange(item.value)}
                      >
                        <item.icon className={`h-4 w-4 ${selectedTab === item.value ? 'text-primary-foreground' : 'text-primary/60'}`} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className={`${selectedTab === item.value ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted/50 text-muted-foreground'} text-xs px-1.5`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          ) : (
            <div className="glass-card rounded-xl sm:rounded-2xl p-2 shadow-card mb-4 sticky top-14 sm:top-16 md:top-20 z-20">
              <TabsList className="flex flex-wrap items-center gap-1 bg-transparent">
                {menuItems.map((item) => (
                  <TabsTrigger 
                    key={item.value} 
                    value={item.value} 
                    className={`text-xs sm:text-sm gap-1.5 transition-all hover-scale ${
                      selectedTab === item.value 
                        ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-card' 
                        : 'bg-transparent hover:bg-muted'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="secondary"
                        className={`ml-1 ${selectedTab === item.value ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted/50 text-muted-foreground'} text-xs px-1.5 min-w-[1.25rem] h-5`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          )}
          <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-card">
            {renderTabContent()}
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
