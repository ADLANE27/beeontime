
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
  Menu,
  UserCircle,
  CalendarCheck,
  CalendarDays,
  Clock3,
  BriefcaseIcon,
  FileBarChart,
  ChevronDown
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
  DrawerTrigger,
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

    // Subscribe to real-time updates
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
    { 
      value: "employees", 
      label: "Employés", 
      icon: UserCircle,
      gradient: "from-purple-600 to-indigo-700",
      lightGradient: "from-purple-100 to-indigo-200",
      bg: "bg-purple-50",
      border: "border-purple-200",
      iconColor: "text-purple-600"
    },
    { 
      value: "planning", 
      label: "Planning", 
      icon: CalendarDays,
      gradient: "from-blue-600 to-cyan-700",
      lightGradient: "from-blue-100 to-cyan-200",
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconColor: "text-blue-600"
    },
    { 
      value: "events", 
      label: "Événements", 
      icon: CalendarCheck,
      gradient: "from-teal-600 to-emerald-700",
      lightGradient: "from-teal-100 to-emerald-200",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconColor: "text-emerald-600"
    },
    { 
      value: "leave", 
      label: "Congés", 
      icon: Clock,
      gradient: "from-amber-600 to-orange-700",
      lightGradient: "from-amber-100 to-orange-200",
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
      badge: pendingLeaves > 0 ? pendingLeaves : null 
    },
    { 
      value: "overtime", 
      label: "Heures supp.", 
      icon: Clock3,
      gradient: "from-orange-600 to-pink-700",
      lightGradient: "from-orange-100 to-pink-200",
      bg: "bg-orange-50",
      border: "border-orange-200",
      iconColor: "text-orange-600",
      badge: pendingOvertimes > 0 ? pendingOvertimes : null
    },
    { 
      value: "lateness", 
      label: "Retards", 
      icon: AlertTriangle,
      gradient: "from-red-600 to-rose-700",
      lightGradient: "from-red-100 to-rose-200",
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-600",
      badge: pendingDelays > 0 ? pendingDelays : null
    },
    { 
      value: "payslips", 
      label: "Documents", 
      icon: FileText,
      gradient: "from-sky-600 to-blue-700",
      lightGradient: "from-sky-100 to-blue-200",
      bg: "bg-sky-50",
      border: "border-sky-200",
      iconColor: "text-sky-600"
    },
    { 
      value: "statistics", 
      label: "Stats", 
      icon: FileBarChart,
      gradient: "from-indigo-600 to-violet-700",
      lightGradient: "from-indigo-100 to-violet-200",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      iconColor: "text-indigo-600"
    },
    { 
      value: "export", 
      label: "Export", 
      icon: Download,
      gradient: "from-gray-700 to-gray-800",
      lightGradient: "from-gray-100 to-gray-300",
      bg: "bg-gray-50",
      border: "border-gray-200",
      iconColor: "text-gray-600"
    },
  ];

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setIsDrawerOpen(false);
  };

  const renderTabContent = () => (
    <div className="space-y-6">
      <TabsContent value="employees">
        <EmployeesList />
      </TabsContent>
      <TabsContent value="planning">
        <AdminPlanning />
      </TabsContent>
      <TabsContent value="events">
        <HREventsList />
      </TabsContent>
      <TabsContent value="leave">
        <LeaveRequestsList />
      </TabsContent>
      <TabsContent value="overtime">
        <OvertimeList />
      </TabsContent>
      <TabsContent value="lateness">
        <DelayList />
      </TabsContent>
      <TabsContent value="payslips">
        <PayslipManagement />
      </TabsContent>
      <TabsContent value="statistics">
        <StatisticsTab />
      </TabsContent>
      <TabsContent value="export">
        <ExportDataTab />
      </TabsContent>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
          {isMobile ? (
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">
                {menuItems.find(item => item.value === selectedTab)?.label}
              </h1>
              <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-gray-300 shadow-sm hover:bg-gray-100">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="w-[300px] p-4">
                  <DrawerHeader className="p-0">
                    <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 bg-clip-text text-transparent">Menu</DrawerTitle>
                  </DrawerHeader>
                  <div className="mt-4 flex flex-col gap-2">
                    {menuItems.map((item) => (
                      <Button
                        key={item.value}
                        variant={selectedTab === item.value ? "default" : "ghost"}
                        className={`w-full justify-start gap-2 rounded-md pl-3 ${
                          selectedTab === item.value 
                            ? `bg-gradient-to-r ${item.gradient} text-white font-medium shadow-sm hover:shadow-md transition-all` 
                            : `hover:bg-${item.bg} hover:${item.iconColor}`
                        }`}
                        onClick={() => handleTabChange(item.value)}
                      >
                        <item.icon className={`h-4 w-4 ${selectedTab === item.value ? "text-white" : item.iconColor}`} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            className={
                              selectedTab === item.value 
                                ? "bg-white/20 text-white hover:bg-white/30 ml-auto"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200 ml-auto"
                            }
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
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-xl border shadow-sm">
              <div className="flex justify-end items-center mb-3">
                <div className="flex items-center gap-2">
                  {(pendingLeaves > 0 || pendingOvertimes > 0 || pendingDelays > 0) && (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">
                      {pendingLeaves + pendingOvertimes + pendingDelays} demandes en attente
                    </Badge>
                  )}
                </div>
              </div>
              <TabsList className="grid grid-cols-9 gap-3 p-2 bg-white rounded-lg border shadow-sm">
                {menuItems.map((item) => {
                  const isActive = selectedTab === item.value;
                  return (
                    <TabsTrigger 
                      key={item.value} 
                      value={item.value} 
                      className={`
                        text-xs sm:text-sm relative group transition-all duration-300 rounded-md px-3 py-2.5
                        data-[state=active]:shadow-md data-[state=active]:font-semibold
                        ${isActive 
                          ? `bg-gradient-to-r ${item.gradient} text-white border-0` 
                          : `bg-white hover:bg-gradient-to-r hover:${item.lightGradient} hover:${item.border}`
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 justify-center flex-nowrap">
                        <item.icon className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? "text-white" : item.iconColor
                        }`} />
                        <span className={`${isActive ? "text-white drop-shadow-sm" : ""} truncate`}>{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary"
                            className={
                              isActive
                                ? "ml-1 bg-white text-black font-medium shadow-sm hover:bg-white/90 transition-colors"
                                : "ml-1 bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                            }
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          )}
          {renderTabContent()}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
