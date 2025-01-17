import { LeaveStatistics } from "./LeaveStatistics";
import { DelayStatistics } from "./DelayStatistics";
import { OvertimeStatistics } from "./OvertimeStatistics";

export const StatisticsTab = () => {
  return (
    <div className="space-y-6">
      <LeaveStatistics />
      <DelayStatistics />
      <OvertimeStatistics />
    </div>
  );
};