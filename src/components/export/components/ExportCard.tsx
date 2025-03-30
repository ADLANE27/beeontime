
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { ReactNode } from "react";

interface ExportCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  isExporting: boolean;
  variant?: "default" | "highlight";
}

export const ExportCard = ({
  title,
  description,
  icon,
  onClick,
  isExporting,
  variant = "default"
}: ExportCardProps) => {
  const isHighlight = variant === "highlight";
  const cardClasses = isHighlight
    ? "p-4 hover:bg-accent/50 transition-colors col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
    : "p-4 hover:bg-accent/50 transition-colors";

  const buttonClasses = isHighlight
    ? "w-full bg-blue-600 hover:bg-blue-700"
    : "w-full";

  const buttonVariant = isHighlight ? "default" : "outline";

  return (
    <Card className={cardClasses}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold ${isHighlight ? 'text-lg text-blue-700' : ''}`}>{title}</h3>
          {icon}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button 
          className={buttonClasses} 
          variant={buttonVariant}
          onClick={onClick}
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          {isHighlight ? "Exporter les éléments de salaires" : "Exporter"}
        </Button>
      </div>
    </Card>
  );
};
