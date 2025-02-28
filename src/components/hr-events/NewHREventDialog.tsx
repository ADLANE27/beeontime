
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogContentFullScreen,
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
import { toast } from "sonner";
import { useEmployeesList } from "../employee/hooks/useEmployeesList";
import { Database } from "@/integrations/supabase/types";

type EventCategory = Database["public"]["Enums"]["event_category"];
type EventSubcategory = Database["public"]["Enums"]["event_subcategory"];
type EventSeverity = Database["public"]["Enums"]["event_severity"];

interface NewHREventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewHREventDialog = ({
  open,
  onOpenChange,
}: NewHREventDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [subcategory, setSubcategory] = useState<EventSubcategory | "">("");
  const [severity, setSeverity] = useState<EventSeverity>("standard");
  const queryClient = useQueryClient();
  const { data: employees } = useEmployeesList();

  const { mutate: createEvent, isPending } = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("hr_events").insert({
        title,
        description,
        employee_id: employeeId,
        category: category as EventCategory,
        subcategory: subcategory as EventSubcategory,
        severity,
        created_by: user.id,
        updated_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-events"] });
      toast.success("Événement créé avec succès");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Error creating event:", error);
      toast.error("Erreur lors de la création de l'événement");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEmployeeId("");
    setCategory("");
    setSubcategory("");
    setSeverity("standard");
  };

  const getSubcategories = () => {
    switch (category) {
      case "disciplinary":
        return [
          ["verbal_warning", "Avertissement oral"],
          ["written_warning", "Avertissement écrit"],
          ["reminder", "Rappel"],
          ["suspension", "Mise à pied"],
          ["dismissal", "Licenciement"],
        ];
      case "evaluation":
        return [
          ["annual_review", "Entretien annuel"],
          ["quarterly_review", "Évaluation trimestrielle"],
          ["pdp", "Plan de développement personnel"],
        ];
      case "administrative":
        return [
          ["promotion", "Promotion"],
          ["position_change", "Changement de poste"],
          ["training", "Formation"],
          ["certification", "Certification"],
        ];
      case "other":
        return [
          ["extended_leave", "Absence prolongée"],
          ["specific_meeting", "Réunion spécifique"],
          ["feedback", "Feedback exceptionnel"],
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentFullScreen className="p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl">Nouvel événement RH</DialogTitle>
        </DialogHeader>
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createEvent();
            }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label htmlFor="employee" className="text-lg">Employé</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label htmlFor="title" className="text-lg">Titre</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="description" className="text-lg">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="min-h-32"
              />
            </div>

            <div className="space-y-4">
              <Label htmlFor="category" className="text-lg">Catégorie</Label>
              <Select 
                value={category} 
                onValueChange={(value: EventCategory) => {
                  setCategory(value);
                  setSubcategory("");
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disciplinary">Disciplinaire</SelectItem>
                  <SelectItem value="evaluation">Évaluation</SelectItem>
                  <SelectItem value="administrative">Administratif</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {category && (
              <div className="space-y-4">
                <Label htmlFor="subcategory" className="text-lg">Sous-catégorie</Label>
                <Select 
                  value={subcategory} 
                  onValueChange={(value: EventSubcategory) => setSubcategory(value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionner une sous-catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubcategories().map(([value, label]) => (
                      <SelectItem key={value} value={value as EventSubcategory}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-4">
              <Label htmlFor="severity" className="text-lg">Gravité</Label>
              <Select 
                value={severity} 
                onValueChange={(value: EventSeverity) => setSeverity(value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sélectionner la gravité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Mineure</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 justify-end pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-12 px-6 text-lg"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isPending}
                className="h-12 px-6 text-lg"
              >
                {isPending ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContentFullScreen>
    </Dialog>
  );
};
