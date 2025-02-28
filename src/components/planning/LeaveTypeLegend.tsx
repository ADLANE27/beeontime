
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const leaveTypeColors = {
  vacation: {
    label: "Congés payés (48h à l'avance)",
    color: "#D3E4FD" // Soft blue
  },
  annual: {
    label: "Congé annuel (2 mois à l'avance)",
    color: "#E5DEFF" // Soft purple
  },
  paternity: {
    label: "Congé paternité",
    color: "#D946EF" // Magenta pink
  },
  maternity: {
    label: "Congé maternité",
    color: "#FFDEE2" // Soft pink
  },
  sickChild: {
    label: "Congé enfant malade",
    color: "#FEC6A1" // Soft orange
  },
  sick: {
    label: "Arrêt maladie",
    color: "#0EA5E9" // Ocean blue
  },
  unpaidUnexcused: {
    label: "Absence injustifiée non rémunérée",
    color: "#F97316" // Bright orange
  },
  unpaidExcused: {
    label: "Absence justifiée non rémunérée",
    color: "#FEF7CD" // Soft yellow
  },
  unpaid: {
    label: "Absence non rémunérée",
    color: "#FDE1D3" // Soft peach
  },
  rtt: {
    label: "RTT",
    color: "#F2FCE2" // Soft green
  },
  familyEvent: {
    label: "Absences pour événements familiaux",
    color: "#8B5CF6" // Vivid purple
  },
  other: {
    label: "Autres congés",
    color: "#E0E0E0" // Light gray
  }
} as const;

// Mapping between database values and our keys
export const leaveTypeMapping: Record<string, keyof typeof leaveTypeColors> = {
  // French terms (as in your image)
  "congés payés": "vacation",
  "congé annuel": "annual",
  "congé paternité": "paternity",
  "congé maternité": "maternity",
  "congé enfant malade": "sickChild",
  "arrêt maladie": "sick",
  "absence injustifiée non rémunérée": "unpaidUnexcused",
  "absence justifiée non rémunérée": "unpaidExcused",
  "absence non rémunérée": "unpaid",
  "rtt": "rtt",
  "absences pour événements familiaux": "familyEvent",
  
  // English terms (for backward compatibility)
  "vacation": "vacation",
  "annual": "annual",
  "paternity": "paternity",
  "maternity": "maternity",
  "sickchild": "sickChild",
  "sick": "sick",
  "unpaidunexcused": "unpaidUnexcused",
  "unpaidexcused": "unpaidExcused",
  "unpaid": "unpaid",
  "familyevent": "familyEvent",
  
  // Common variations
  "arret maladie": "sick",
  "arrêt": "sick",
  "arret": "sick",
  "maladie": "sick"
};

export const LeaveTypeLegend = () => {
  return (
    <Card className="p-4 mb-4 bg-white/90 shadow-sm border border-gray-100 backdrop-blur-sm overflow-hidden">
      <h3 className="text-sm font-medium mb-3">Légende des congés</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {Object.entries(leaveTypeColors).map(([key, { label, color }], index) => (
          <div 
            key={key} 
            className={cn(
              "flex items-center gap-2 group py-1 px-2 rounded-md transition-all duration-300",
              "hover:bg-gray-50/80 hover:shadow-sm"
            )}
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            <div
              className="w-4 h-4 rounded transition-all duration-200 group-hover:scale-110 group-hover:rotate-12"
              style={{ 
                background: `linear-gradient(135deg, ${color} 0%, ${color}90 100%)`,
                boxShadow: `0 1px 2px ${color}50`
              }}
            />
            <span className="text-sm group-hover:text-gray-800 transition-colors duration-200">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export { leaveTypeColors };
