
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getSubcategories } from "./utils";
import { EventDocuments } from "./EventDocuments";

interface EventDetailsViewProps {
  event: any;
}

export const EventDetailsView = ({ event }: EventDetailsViewProps) => {
  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "minor":
        return "Mineure";
      case "standard":
        return "Standard";
      case "critical":
        return "Critique";
      default:
        return severity;
    }
  };

  const getStatusLabel = (status: string) => {
    return status === 'open' ? 'Ouvert' : 'Clôturé';
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Employé</Label>
        <div className="font-medium">
          {event.employees?.first_name} {event.employees?.last_name}
        </div>
      </div>

      <div>
        <Label>Date</Label>
        <div className="font-medium">
          {format(new Date(event.event_date), "Pp", { locale: fr })}
        </div>
      </div>

      <div>
        <Label>Titre</Label>
        <div className="font-medium">{event.title}</div>
      </div>

      <div>
        <Label>Description</Label>
        <div className="font-medium">{event.description}</div>
      </div>

      <div>
        <Label>Catégorie</Label>
        <div className="font-medium">{event.category}</div>
      </div>

      <div>
        <Label>Gravité</Label>
        <div>
          <Badge
            variant={
              event.severity === "critical"
                ? "destructive"
                : event.severity === "minor"
                ? "secondary"
                : "default"
            }
          >
            {getSeverityLabel(event.severity)}
          </Badge>
        </div>
      </div>

      <div>
        <Label>Sous-catégorie</Label>
        <div className="font-medium">
          {getSubcategories(event.category).find(
            ([value]) => value === event.subcategory
          )?.[1] || event.subcategory}
        </div>
      </div>

      <div>
        <Label>Statut</Label>
        <div>
          <Badge
            variant={event.status === 'open' ? 'default' : 'secondary'}
          >
            {getStatusLabel(event.status)}
          </Badge>
        </div>
      </div>

      <EventDocuments documents={event.documents} eventId={event.id} />
    </div>
  );
};
