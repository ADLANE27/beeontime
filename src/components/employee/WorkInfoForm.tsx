import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkInfoFormProps } from "./types/employee-form";
import { FileText } from "lucide-react";

export const WorkInfoForm = ({
  contractType,
  startDate,
  position,
  onFieldChange,
}: WorkInfoFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Informations professionnelles</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contractType">Type de contrat</Label>
          <Select value={contractType} onValueChange={(value) => onFieldChange("contractType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type de contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CDI">CDI</SelectItem>
              <SelectItem value="CDD">CDD</SelectItem>
              <SelectItem value="Alternance">Alternance</SelectItem>
              <SelectItem value="Stage">Stage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="startDate">Date de début</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onFieldChange("startDate", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="position">Poste</Label>
        <Select value={position} onValueChange={(value) => onFieldChange("position", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un poste" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Traducteur">Traducteur</SelectItem>
            <SelectItem value="Traductrice">Traductrice</SelectItem>
            <SelectItem value="Interprète">Interprète</SelectItem>
            <SelectItem value="Coordinatrice">Coordinatrice</SelectItem>
            <SelectItem value="Cheffe de projets">Cheffe de projets</SelectItem>
            <SelectItem value="Chef de projets">Chef de projets</SelectItem>
            <SelectItem value="Alternant">Alternant</SelectItem>
            <SelectItem value="Alternante">Alternante</SelectItem>
            <SelectItem value="Stagiaire">Stagiaire</SelectItem>
            <SelectItem value="Directeur">Directeur</SelectItem>
            <SelectItem value="Assistante de direction">Assistante de direction</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};