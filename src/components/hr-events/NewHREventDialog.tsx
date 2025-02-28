
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
import { Loader2, User, FileText, ListFilter, AlertTriangle } from "lucide-react";

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

  const getSeverityColor = (sev: EventSeverity) => {
    switch (sev) {
      case "minor":
        return "text-green-600 bg-green-50 border-green-200";
      case "standard":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentFullScreen className="bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-bold text-center text-gray-800">
              Nouvel événement RH
            </DialogTitle>
            <p className="text-center text-gray-600 mt-2">
              Enregistrez un nouvel événement RH associé à un employé
            </p>
          </DialogHeader>
          
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createEvent();
              }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-indigo-500" />
                  <Label htmlFor="employee" className="text-lg font-medium text-gray-700">
                    Employé concerné
                  </Label>
                </div>
                <Select value={employeeId} onValueChange={setEmployeeId} required>
                  <SelectTrigger className="h-12 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
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
                {!employeeId && (
                  <p className="text-sm text-gray-500 ml-2">Veuillez sélectionner l'employé concerné par cet événement</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <Label htmlFor="title" className="text-lg font-medium text-gray-700">
                    Titre de l'événement
                  </Label>
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Entrez un titre descriptif"
                  className="h-12 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-indigo-500" />
                  <Label htmlFor="description" className="text-lg font-medium text-gray-700">
                    Description détaillée
                  </Label>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Décrivez en détail l'événement, son contexte et ses implications"
                  className="min-h-32 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ListFilter className="h-5 w-5 text-indigo-500" />
                    <Label htmlFor="category" className="text-lg font-medium text-gray-700">
                      Catégorie
                    </Label>
                  </div>
                  <Select 
                    value={category} 
                    onValueChange={(value: EventCategory) => {
                      setCategory(value);
                      setSubcategory("");
                    }}
                    required
                  >
                    <SelectTrigger className="h-12 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
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
                    <div className="flex items-center gap-2 mb-2">
                      <ListFilter className="h-5 w-5 text-indigo-500" />
                      <Label htmlFor="subcategory" className="text-lg font-medium text-gray-700">
                        Sous-catégorie
                      </Label>
                    </div>
                    <Select 
                      value={subcategory} 
                      onValueChange={(value: EventSubcategory) => setSubcategory(value)}
                      required
                    >
                      <SelectTrigger className="h-12 text-base border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
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
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-indigo-500" />
                  <Label htmlFor="severity" className="text-lg font-medium text-gray-700">
                    Gravité
                  </Label>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setSeverity("minor")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                      severity === "minor" 
                        ? "border-green-500 ring-2 ring-green-200" 
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full mb-2 ${severity === "minor" ? "bg-green-500" : "bg-green-200"}`}></div>
                    <span className="font-medium text-green-700">Mineure</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity("standard")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                      severity === "standard" 
                        ? "border-blue-500 ring-2 ring-blue-200" 
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full mb-2 ${severity === "standard" ? "bg-blue-500" : "bg-blue-200"}`}></div>
                    <span className="font-medium text-blue-700">Standard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity("critical")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center ${
                      severity === "critical" 
                        ? "border-red-500 ring-2 ring-red-200" 
                        : "border-gray-200 hover:border-red-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full mb-2 ${severity === "critical" ? "bg-red-500" : "bg-red-200"}`}></div>
                    <span className="font-medium text-red-700">Critique</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t">
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
                  className="h-12 px-6 text-lg bg-indigo-600 hover:bg-indigo-700"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer l'événement"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContentFullScreen>
    </Dialog>
  );
};
