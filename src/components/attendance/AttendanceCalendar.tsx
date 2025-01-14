import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { AttendanceRecord } from "@/types/hr";

export const AttendanceCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Exemple de données de présence
  const attendanceData: AttendanceRecord[] = [
    {
      id: 1,
      employeeId: 1,
      date: "2024-03-20",
      clockIn: "09:00",
      clockOut: "17:00",
      status: "present"
    }
  ];

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Calendrier des présences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Détails du jour</h3>
            {selectedDate && (
              <div className="space-y-2">
                <p>Heure d'arrivée : 09:00</p>
                <p>Heure de départ : 17:00</p>
                <p>Statut : Présent</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};