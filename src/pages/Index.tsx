import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AttendanceCalendar } from "@/components/attendance/AttendanceCalendar";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { PayslipList } from "@/components/payslip/PayslipList";
import { OvertimeList } from "@/components/overtime/OvertimeList";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 gap-6">
        <AttendanceCalendar />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LeaveRequestForm />
          <PayslipList />
        </div>
        <OvertimeList />
      </div>
    </DashboardLayout>
  );
};

export default Index;