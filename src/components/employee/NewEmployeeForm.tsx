import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ContractType, Position, NewEmployee } from "@/types/hr";

interface NewEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employee: NewEmployee) => void;
}

export const NewEmployeeForm = ({ isOpen, onClose, onSubmit }: NewEmployeeFormProps) => {
  const [formData, setFormData] = useState<Partial<NewEmployee>>({});

  const positions: Position[] = [
    'Traducteur', 'Traductrice', 'Interprète', 'Coordinatrice',
    'Cheffe de projets', 'Chef de projets', 'Alternant', 'Alternante',
    'Stagiaire', 'Directeur', 'Assistante de direction'
  ];

  const contractTypes: ContractType[] = ['CDI', 'CDD', 'Alternance', 'Stage'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.position) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    onSubmit(formData as NewEmployee);
    onClose();
  };

  const handleInputChange = (field: keyof NewEmployee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel employé</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input
                id="birthDate"
                type="date"
                onChange={(e) => handleInputChange('birthDate', new Date(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthPlace">Lieu de naissance</Label>
              <Input
                id="birthPlace"
                value={formData.birthPlace || ''}
                onChange={(e) => handleInputChange('birthPlace', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthCountry">Pays de naissance</Label>
              <Input
                id="birthCountry"
                value={formData.birthCountry || ''}
                onChange={(e) => handleInputChange('birthCountry', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialSecurityNumber">Numéro de sécurité sociale</Label>
              <Input
                id="socialSecurityNumber"
                value={formData.socialSecurityNumber || ''}
                onChange={(e) => handleInputChange('socialSecurityNumber', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType">Type de contrat</Label>
              <Select
                onValueChange={(value: ContractType) => handleInputChange('contractType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type de contrat" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Date d'entrée</Label>
              <Input
                id="startDate"
                type="date"
                onChange={(e) => handleInputChange('startDate', new Date(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Poste</Label>
              <Select
                onValueChange={(value: Position) => handleInputChange('position', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un poste" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workSchedule">Horaires de travail</Label>
              <Input
                id="workSchedule"
                value={formData.workSchedule || ''}
                onChange={(e) => handleInputChange('workSchedule', e.target.value)}
                placeholder="ex: 9h-17h"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousYearVacationDays">Jours de congés N-1</Label>
              <Input
                id="previousYearVacationDays"
                type="number"
                min="0"
                value={formData.previousYearVacationDays || ''}
                onChange={(e) => handleInputChange('previousYearVacationDays', parseInt(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usedVacationDays">Jours de congés pris</Label>
              <Input
                id="usedVacationDays"
                type="number"
                min="0"
                value={formData.usedVacationDays || ''}
                onChange={(e) => handleInputChange('usedVacationDays', parseInt(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remainingVacationDays">Solde de congés</Label>
              <Input
                id="remainingVacationDays"
                type="number"
                min="0"
                value={formData.remainingVacationDays || ''}
                onChange={(e) => handleInputChange('remainingVacationDays', parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              Ajouter l'employé
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};