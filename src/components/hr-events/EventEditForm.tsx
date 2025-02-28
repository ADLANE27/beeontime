
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getSubcategories } from "./utils";
import { FormEvent, useState } from "react";

interface EventEditFormProps {
  event: any;
  onSubmit: (formData: any) => void;
}

export const EventEditForm = ({ event, onSubmit }: EventEditFormProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(event.category);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      subcategory: formData.get("subcategory"),
      severity: formData.get("severity"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" defaultValue={event.title} required />
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
        <Select name="subcategory" defaultValue={event.subcategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getSubcategories(selectedCategory || event.category).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
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
  );
};
