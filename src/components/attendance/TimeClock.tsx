
import { useState, useEffect } from "react";
import { TimeClockDisplay } from "./TimeClockDisplay";
import { TimeClockButton } from "./TimeClockButton";
import { useTimeRecord } from "@/hooks/use-time-record";

export const TimeClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { timeRecord, getNextAction, getButtonLabel, handleTimeRecord } = useTimeRecord();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <TimeClockDisplay 
        currentTime={currentTime} 
        timeRecord={timeRecord} 
      />
      
      <TimeClockButton 
        nextAction={getNextAction()} 
        buttonLabel={getButtonLabel()} 
        onTimeRecord={handleTimeRecord} 
      />
    </div>
  );
};
