
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { UserGuide } from "@/components/guides/UserGuide";

interface TimeClockDisplayProps {
  currentTime: Date;
  timeRecord: {
    id: string | null;
    morning_in: string | null;
    lunch_out: string | null;
    lunch_in: string | null;
    evening_out: string | null;
  };
}

export const TimeClockDisplay = ({ currentTime, timeRecord }: TimeClockDisplayProps) => {
  const formattedDate = format(currentTime, "EEEE d MMMM yyyy", { locale: fr });
  const formattedTime = format(currentTime, "HH:mm:ss");

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-full flex justify-between items-center">
          <div className="text-center flex-1">
            <p className="text-lg text-gray-600">{formattedDate}</p>
            <p className="text-4xl font-bold tracking-tight">{formattedTime}</p>
          </div>
          <UserGuide />
        </div>
        
        <div className="text-sm text-gray-500 space-y-1">
          {timeRecord.morning_in && (
            <p>Arrivée : {timeRecord.morning_in}</p>
          )}
          {timeRecord.lunch_out && (
            <p>Départ pause : {timeRecord.lunch_out}</p>
          )}
          {timeRecord.lunch_in && (
            <p>Retour pause : {timeRecord.lunch_in}</p>
          )}
          {timeRecord.evening_out && (
            <p>Départ : {timeRecord.evening_out}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
