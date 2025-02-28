
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronUp, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCategoryLabel, getSeverityColor, getSeverityLabel } from "./utils";
import { useSorting, SortField } from "./hooks/useSorting";

interface EventsTableProps {
  events: any[];
  onEventSelect: (eventId: string) => void;
  onDelete: (eventId: string, e: React.MouseEvent) => void;
  onDownload: (event: any, e: React.MouseEvent) => void;
  sortField: SortField;
  sortOrder: "asc" | "desc";
  handleSort: (field: SortField) => void;
}

export const EventsTable = ({ 
  events, 
  onEventSelect, 
  onDelete, 
  onDownload,
  sortField,
  sortOrder,
  handleSort
}: EventsTableProps) => {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employé</TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("event_date")}
            >
              Date
              <SortIcon field="event_date" />
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("category")}
            >
              Type
              <SortIcon field="category" />
            </TableHead>
            <TableHead>Titre</TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("severity")}
            >
              Gravité
              <SortIcon field="severity" />
            </TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow
              key={event.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onEventSelect(event.id)}
            >
              <TableCell>
                {event.employees?.first_name} {event.employees?.last_name}
              </TableCell>
              <TableCell>
                {format(new Date(event.event_date), "Pp", { locale: fr })}
              </TableCell>
              <TableCell>
                {getCategoryLabel(event.category)}
              </TableCell>
              <TableCell>{event.title}</TableCell>
              <TableCell>
                <Badge variant={getSeverityColor(event.severity)}>
                  {getSeverityLabel(event.severity)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={event.status === 'open' ? 'default' : 'secondary'}
                >
                  {event.status === 'open' ? 'Ouvert' : 'Clôturé'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => onDownload(event, e)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => onDelete(event.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
