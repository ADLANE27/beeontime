
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
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
  return (
    <Card 
      className={`
        p-4 sm:p-6 cursor-pointer transition-all hover-lift
        ${variant === 'highlight' 
          ? 'glass-card ring-2 ring-primary/20 glow-border' 
          : 'glass-card hover:shadow-elevation'
        }
        ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={!isExporting ? onClick : undefined}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`
          p-2 sm:p-3 rounded-xl flex-shrink-0
          ${variant === 'highlight' 
            ? 'bg-gradient-to-br from-primary to-accent' 
            : 'bg-muted'
          }
        `}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 text-foreground">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
            {description}
          </p>
          {variant === 'highlight' && (
            <div className="mt-3 sm:mt-4">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                Recommandé pour la comptabilité
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      {isExporting && (
        <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          <span>Export en cours...</span>
        </div>
      )}
    </Card>
  );
};
