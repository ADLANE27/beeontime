import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Trash, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getSubcategories, uploadDocument, deleteDocument, downloadDocument } from "./utils";

interface HREventDetailsProps {
  eventId: string | null;
  onClose: () => void;
}

export const HREventDetails = ({ eventId, onClose }: HREventDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["hr-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("hr_events")
        .select(`
          *,
          employees (
            first_name,
            last_name
          ),
          documents:hr_event_documents (*)
        `)
        .eq("id", eventId)
        .single();

      if (error) throw error;
      
      // Initialize selectedCategory with the event's category
      if (data) {
        setSelectedCategory(data.category);
      }
      
      return data;
    },
    enabled: !!eventId,
  });

  const { mutate: updateEvent } = useMutation({
    mutationFn: async (updatedData: any) => {
      if (!eventId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("hr_events")
        .update({ 
          ...updatedData, 
          updated_by: user.id,
          status: updatedData.status || 'open'
        })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-events"] });
      queryClient.invalidateQueries({ queryKey: ["hr-event", eventId] });
      toast.success("Événement mis à jour avec succès");
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast.error("Erreur lors de la mise à jour de l'événement");
    },
  });

  const { mutate: deleteEvent } = useMutation({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase
        .from("hr_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-events"] });
      toast.success("Événement supprimé avec succès");
      onClose();
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast.error("Erreur lors de la suppression de l'événement");
    },
  });

  if (!eventId) return null;

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

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
    <Dialog open={!!eventId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Détails de l'événement</span>
            <div className="flex gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (event) {
                      updateEvent({
                        status: event.status === 'open' ? 'closed' : 'open'
                      });
                    }
                  }}
                >
                  {event?.status === 'open' ? 'Clôturer' : 'Réouvrir'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (event && !isEditing) {
                    setSelectedCategory(event.category);
                  }
                }}
              >
                {isEditing ? "Annuler" : "Modifier"}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
                    deleteEvent();
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div>Chargement...</div>
        ) : event ? (
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

            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  updateEvent({
                    title: formData.get("title"),
                    description: formData.get("description"),
                    category: formData.get("category"),
                    subcategory: formData.get("subcategory"),
                    severity: formData.get("severity"),
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={event.title}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={event.description || ""}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select 
                    name="category" 
                    defaultValue={event.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disciplinary">Disciplinaire</SelectItem>
                      <SelectItem value="evaluation">Évaluation</SelectItem>
                      <SelectItem value="administrative">Administratif</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory">Sous-catégorie</Label>
                  <Select 
                    name="subcategory" 
                    defaultValue={event.subcategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getSubcategories(selectedCategory || event.category).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Gravité</Label>
                  <Select name="severity" defaultValue={event.severity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Mineure</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Enregistrer</Button>
                </div>
              </form>
            ) : (
              <>
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
                    {getSubcategories(event.category).find(([value]) => value === event.subcategory)?.[1] || event.subcategory}
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

                <div className="space-y-2">
                  <Label>Documents</Label>
                  <div className="space-y-2">
                    {event.documents?.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span>{doc.file_name}</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteDocument(doc.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadDocument(file, eventId);
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};