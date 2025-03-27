
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface TimeClockButtonProps {
  onTimeRecord: () => Promise<void>;
  nextAction: string | null;
  buttonLabel: string;
}

export const TimeClockButton = ({ onTimeRecord, nextAction, buttonLabel }: TimeClockButtonProps) => {
  return (
    <div className="flex gap-4">
      {nextAction ? (
        <Button
          size="lg"
          className={nextAction === "evening_out" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          onClick={onTimeRecord}
        >
          {nextAction === "evening_out" ? (
            <ArrowLeft className="mr-2 h-5 w-5" />
          ) : (
            <ArrowRight className="mr-2 h-5 w-5" />
          )}
          {buttonLabel}
        </Button>
      ) : (
        <Button size="lg" disabled>
          Journée terminée
        </Button>
      )}
    </div>
  );
};
