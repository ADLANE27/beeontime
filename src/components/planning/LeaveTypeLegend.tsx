
import { Card } from "@/components/ui/card";

const leaveTypeColors = {
  vacation: {
    label: "Congés payés",
    color: "#9b87f5" // Purple
  },
  rtt: {
    label: "RTT",
    color: "#4ADE80" // Green
  },
  paternity: {
    label: "Congé paternité",
    color: "#3B82F6" // Blue
  },
  maternity: {
    label: "Congé maternité",
    color: "#F472B6" // Pink
  },
  sickChild: {
    label: "Congé enfant malade",
    color: "#F97316" // Orange
  },
  sickLeave: {
    label: "Arrêt maladie",
    color: "#EF4444" // Red
  },
  unpaidUnexcused: {
    label: "Absence injustifiée non rémunérée",
    color: "#8B5CF6" // Purple-violet
  },
  unpaidExcused: {
    label: "Absence justifiée non rémunérée",
    color: "#EC4899" // Magenta
  },
  unpaid: {
    label: "Absence non rémunérée",
    color: "#6366F1" // Indigo
  },
  annual: {
    label: "Congé annuel",
    color: "#14B8A6" // Teal
  },
  familyEvent: {
    label: "Absences pour événements familiaux",
    color: "#FACC15" // Yellow
  }
} as const;

export const LeaveTypeLegend = () => {
  return (
    <Card className="p-6 mb-6">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Légende des congés</h3>
      <div className="flex flex-wrap gap-5">
        {Object.entries(leaveTypeColors).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-md"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export { leaveTypeColors };
