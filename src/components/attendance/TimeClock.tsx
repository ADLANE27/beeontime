import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const TimeClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [checkInId, setCheckInId] = useState<string | null>(null);
  const [clockEvents, setClockEvents] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Load today's clock events
    const loadTodayClockEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: events } = await supabase
        .from("delays")
        .select("*")
        .eq("employee_id", user.id)
        .eq("date", today)
        .order('created_at', { ascending: true });

      if (events && events.length > 0) {
        setClockEvents(events);
        // If last event is not completed (no checkout), set check-in state
        const lastEvent = events[events.length - 1];
        if (!lastEvent.reason.includes('sortie')) {
          setHasCheckedIn(true);
          setCheckInId(lastEvent.id);
        }
      }
    };

    loadTodayClockEvents();
    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(currentTime, "EEEE d MMMM yyyy", { locale: fr });
  const formattedTime = format(currentTime, "HH:mm:ss");

  const handleCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté pour pointer");
        return;
      }

      const { data, error } = await supabase
        .from("delays")
        .insert({
          employee_id: user.id,
          date: format(currentTime, "yyyy-MM-dd"),
          scheduled_time: "09:00",
          actual_time: format(currentTime, "HH:mm"),
          duration: "0",
          reason: "Pointage arrivée"
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Erreur lors de l'enregistrement du pointage");
        return;
      }

      setCheckInId(data.id);
      setHasCheckedIn(true);
      setClockEvents([...clockEvents, data]);
      toast.success("Arrivée enregistrée avec succès");
    } catch (error) {
      console.error("Erreur lors du pointage:", error);
      toast.error("Erreur lors de l'enregistrement du pointage");
    }
  };

  const handleCheckOut = async () => {
    if (!checkInId) {
      toast.error("Aucun pointage d'entrée trouvé");
      return;
    }

    try {
      const checkOutTime = format(currentTime, "HH:mm");
      const { data, error } = await supabase
        .from("delays")
        .update({
          reason: `Pointage arrivée-sortie (${checkOutTime})`,
          status: 'approved'
        })
        .eq('id', checkInId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Erreur lors de la mise à jour du pointage");
        return;
      }

      setHasCheckedIn(false);
      setCheckInId(null);
      setClockEvents(clockEvents.map(event => 
        event.id === checkInId ? data : event
      ));
      toast.success("Départ enregistré avec succès");
    } catch (error) {
      console.error("Erreur lors du pointage de sortie:", error);
      toast.error("Erreur lors de l'enregistrement du pointage de sortie");
    }
  };

  const formatEventTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), "HH:mm");
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <p className="text-lg text-gray-600">{formattedDate}</p>
            <p className="text-4xl font-bold tracking-tight">{formattedTime}</p>
          </div>
          
          <div className="flex gap-4">
            {!hasCheckedIn ? (
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleCheckIn}
              >
                <ArrowRight className="mr-2 h-5 w-5" />
                Pointer arrivée
              </Button>
            ) : (
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleCheckOut}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Pointer sortie
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Historique des pointages du jour</h3>
        <div className="space-y-2">
          {clockEvents.map((event, index) => (
            <div 
              key={event.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">#{index + 1}</span>
                <span>{formatEventTime(event.actual_time)}</span>
              </div>
              <span className="text-sm text-gray-600">
                {event.reason.includes('sortie') 
                  ? 'Sortie' 
                  : 'Arrivée'}
              </span>
            </div>
          ))}
          {clockEvents.length === 0 && (
            <p className="text-gray-500 text-center">Aucun pointage aujourd'hui</p>
          )}
        </div>
      </Card>
    </div>
  );
};