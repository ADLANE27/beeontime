import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Delay = Database['public']['Tables']['delays']['Row'] & {
  employees: {
    first_name: string;
    last_name: string;
  } | null;
};

interface DelayItemProps {
  delay: Delay;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isUpdating: boolean;
  formatDuration: (duration: unknown) => string;
}

export const DelayItem = ({ 
  delay, 
  onApprove, 
  onReject, 
  isUpdating,
  formatDuration 
}: DelayItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <p className="font-semibold">
          {delay.employees?.first_name} {delay.employees?.last_name}
        </p>
        <p className="text-sm text-gray-600">Date: {delay.date}</p>
        <p className="text-sm text-gray-600">
          Heure prévue: {delay.scheduled_time} - Arrivée: {delay.actual_time}
        </p>
        <p className="text-sm text-gray-600">Durée: {formatDuration(delay.duration)}</p>
        <p className="text-sm text-gray-600">Motif: {delay.reason}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Badge
          variant={
            delay.status === "approved"
              ? "secondary"
              : delay.status === "rejected"
              ? "destructive"
              : "outline"
          }
        >
          {delay.status}
        </Badge>
        {delay.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApprove(delay.id)}
              disabled={isUpdating}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onReject(delay.id)}
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};