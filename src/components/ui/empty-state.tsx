
import { cn } from "@/lib/utils";
import {
  CalendarOff,
  Clock,
  FileText,
  Inbox,
  Search,
  Users,
  Timer,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "./button";

type EmptyStateVariant =
  | "leave"
  | "overtime"
  | "delay"
  | "payslip"
  | "document"
  | "employee"
  | "event"
  | "planning"
  | "search"
  | "generic";

const variantConfig: Record<
  EmptyStateVariant,
  { icon: LucideIcon; color: string; bg: string }
> = {
  leave: { icon: CalendarOff, color: "text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30" },
  overtime: { icon: Timer, color: "text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30" },
  delay: { icon: Clock, color: "text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  payslip: { icon: FileText, color: "text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30" },
  document: { icon: FileText, color: "text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/30" },
  employee: { icon: Users, color: "text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  event: { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
  planning: { icon: CalendarOff, color: "text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/30" },
  search: { icon: Search, color: "text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/30" },
  generic: { icon: Inbox, color: "text-gray-400", bg: "bg-gray-50 dark:bg-gray-800/30" },
};

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  variant = "generic",
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center animate-fade-in",
        compact ? "py-8" : "py-12 sm:py-16",
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl flex items-center justify-center mb-4 transition-transform",
          config.bg,
          compact ? "w-12 h-12" : "w-16 h-16 sm:w-20 sm:h-20"
        )}
      >
        <Icon
          className={cn(
            config.color,
            compact ? "w-6 h-6" : "w-8 h-8 sm:w-10 sm:h-10"
          )}
          strokeWidth={1.5}
        />
      </div>
      <p
        className={cn(
          "font-medium text-foreground/80",
          compact ? "text-sm" : "text-base sm:text-lg"
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-1 max-w-xs",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={action.onClick}
          className="mt-4 rounded-xl"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
