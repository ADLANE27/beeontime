import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ContractType, Position, NewEmployee, WorkSchedule } from "@/types/hr";
import { supabase } from "@/integrations/supabase/client";

interface NewEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employee: NewEmployee) => void;
  employeeToEdit?: NewEmployee;
  mode?: 'create' | 'edit';
}

export const NewEmployeeForm = ({ isOpen, onClose, onSubmit, employeeToEdit, mode = 'create' }: NewEmployeeFormProps) => {
  const [formData, setFormData] = useState<Partial<NewEmployee>>({
    workSchedule: {
      startTime: '',
      endTime: '',
      breakStartTime: '',
      breakEndTime: ''
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && employeeToEdit) {
      setFormData(employeeToEdit);
    }
  }, [mode, employeeToEdit]);

  const positions: Position[] = [
    'Traducteur', 'Traductrice', 'Interprète', 'Coordinatrice',
    'Cheffe de projets', 'Chef de projets', 'Alternant', 'Alternante',
    'Stagiaire', 'Directeur', 'Assistante de direction'
  ];

  const contractTypes: ContractType[] = ['CDI', 'CDD', 'Alternance', 'Stage'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.firstName || !formData.lastName || !formData.position || !formData.email || !formData.phone) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Format d'email invalide");
        return;
      }

      // Validate phone format (French format)
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      if (!phoneRegex.test(formData.phone)) {
        toast.error("Format de téléphone invalide");
        return;
      }

      // Validate work schedule
      const { workSchedule } = formData;
      if (!workSchedule?.startTime || !workSchedule?.endTime || !workSchedule?.breakStartTime || !workSchedule?.breakEndTime) {
        toast.error("Veuillez remplir tous les horaires de travail");
        return;
      }

      if (mode === 'create') {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: 'Welcome123!', // Temporary password
          email_confirm: true
        });

        if (authError) {
          console.error('Auth Error:', authError);
          toast.error("Erreur lors de la création du compte: " + authError.message);
          return;
        }

        if (!authData.user) {
          toast.error("Erreur lors de la création du compte utilisateur");
          return;
        }

        // Update profile with name
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile Error:', profileError);
          toast.error("Erreur lors de la mise à jour du profil");
          return;
        }

        // Format dates as ISO strings for Supabase
        const formattedData = {
          id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          birth_date: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
          birth_place: formData.birthPlace,
          birth_country: formData.birthCountry,
          social_security_number: formData.socialSecurityNumber,
          contract_type: formData.contractType,
          start_date: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          position: formData.position,
          work_schedule: formData.workSchedule,
          previous_year_vacation_days: formData.previousYearVacationDays,
          used_vacation_days: formData.usedVacationDays,
          remaining_vacation_days: formData.remainingVacationDays
        };

        // Create employee record
        const { error: employeeError } = await supabase
          .from('employees')
          .insert(formattedData);

        if (employeeError) {
          console.error('Employee Error:', employeeError);
          toast.error("Erreur lors de la création de l'employé");
          return;
        }

        toast.success("Employé créé avec succès");
      }

      onSubmit(formData as NewEmployee);
      onClose();
      
      // Reset form if it's create mode
      if (mode === 'create') {
        setFormData({
          workSchedule: {
            startTime: '',
            endTime: '',
            breakStartTime: '',
            breakEndTime: ''
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Une erreur est survenue lors de la création de l'employé");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof NewEmployee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleWorkScheduleChange = (field: keyof WorkSchedule, value: string) => {
    setFormData(prev => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        [field]: value
      } as WorkSchedule
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Ajouter un nouvel employé' : 'Modifier les informations de l\'employé'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Remplissez les informations du nouvel employé. Tous les champs marqués d\'un * sont obligatoires.'
              : 'Modifiez les informations de l\'employé. Tous les champs marqués d\'un * sont obligatoires.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="06 12 34 56 78"
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

            <div className="col-span-2 grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workScheduleStart">Heure d'arrivée</Label>
                <Input
                  id="workScheduleStart"
                  type="time"
                  onChange={(e) => handleWorkScheduleChange('startTime', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workScheduleBreakStart">Début pause</Label>
                <Input
                  id="workScheduleBreakStart"
                  type="time"
                  onChange={(e) => handleWorkScheduleChange('breakStartTime', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workScheduleBreakEnd">Fin pause</Label>
                <Input
                  id="workScheduleBreakEnd"
                  type="time"
                  onChange={(e) => handleWorkScheduleChange('breakEndTime', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workScheduleEnd">Heure de départ</Label>
                <Input
                  id="workScheduleEnd"
                  type="time"
                  onChange={(e) => handleWorkScheduleChange('endTime', e.target.value)}
                  required
                />
              </div>
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
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? 'Création en cours...' 
                : mode === 'create' 
                  ? 'Ajouter l\'employé' 
                  : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};