
import { Card } from "@/components/ui/card";

const leaveTypeColors = {
  vacation: {
    label: "Congés payés",
    color: "#D3E4FD"
  },
  rtt: {
    label: "RTT",
    color: "#F2FCE2"
  },
  paternity: {
    label: "Congé paternité",
    color: "#FFDEE2"
  },
  maternity: {
    label: "Congé maternité",
    color: "#FFDEE2"
  },
  sickChild: {
    label: "Congé enfant malade",
    color: "#FEC6A1"
  },
  sickLeave: {
    label: "Arrêt maladie",
    color: "#FFD6A5"
  },
  unpaidUnexcused: {
    label: "Absence injustifiée non rémunérée",
    color: "#FFB7B7"
  },
  unpaidExcused: {
    label: "Absence justifiée non rémunérée",
    color: "#FFCCCC"
  },
  unpaid: {
    label: "Absence non rémunérée",
    color: "#FFE0E0"
  },
  annual: {
    label: "Congé annuel",
    color: "#BFEFFF"
  },
  familyEvent: {
    label: "Absences pour événements familiaux",
    color: "#E5DEFF"
  }
} as const;

export const LeaveTypeLegend = () => {
  return (
    <Card className="p-4 mb-4">
      <h3 className="text-sm font-medium mb-2">Légende des congés</h3>
      <div className="flex flex-wrap gap-4">
        {Object.entries(leaveTypeColors).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export { leaveTypeColors };
