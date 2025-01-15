import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ContractType, NewEmployee, Position, WorkSchedule } from "@/types/hr";
import { Json } from "@/integrations/supabase/types";

interface NewEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employee: NewEmployee) => void;
  employeeToEdit?: NewEmployee;
  mode?: 'create' | 'edit';
}

export const NewEmployeeForm = ({
  isOpen,
  onClose,
  onSubmit,
  employeeToEdit,
  mode = 'create'
}: NewEmployeeFormProps) => {
  const [firstName, setFirstName] = useState(employeeToEdit?.firstName || '');
  const [lastName, setLastName] = useState(employeeToEdit?.lastName || '');
  const [email, setEmail] = useState(employeeToEdit?.email || '');
  const [phone, setPhone] = useState(employeeToEdit?.phone || '');
  const [birthDate, setBirthDate] = useState(employeeToEdit?.birthDate ? new Date(employeeToEdit.birthDate).toISOString().split('T')[0] : '');
  const [birthPlace, setBirthPlace] = useState(employeeToEdit?.birthPlace || '');
  const [birthCountry, setBirthCountry] = useState(employeeToEdit?.birthCountry || '');
  const [socialSecurityNumber, setSocialSecurityNumber] = useState(employeeToEdit?.socialSecurityNumber || '');
  const [contractType, setContractType] = useState<ContractType>(employeeToEdit?.contractType || 'CDI');
  const [startDate, setStartDate] = useState(employeeToEdit?.startDate ? new Date(employeeToEdit.startDate).toISOString().split('T')[0] : '');
  const [position, setPosition] = useState<Position>(employeeToEdit?.position || 'Traducteur');
  const [startTime, setStartTime] = useState(employeeToEdit?.workSchedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(employeeToEdit?.workSchedule?.endTime || '17:00');
  const [breakStartTime, setBreakStartTime] = useState(employeeToEdit?.workSchedule?.breakStartTime || '12:00');
  const [breakEndTime, setBreakEndTime] = useState(employeeToEdit?.workSchedule?.breakEndTime || '13:00');
  const [previousYearVacationDays, setPreviousYearVacationDays] = useState(employeeToEdit?.previousYearVacationDays?.toString() || '0');
  const [usedVacationDays, setUsedVacationDays] = useState(employeeToEdit?.usedVacationDays?.toString() || '0');
  const [remainingVacationDays, setRemainingVacationDays] = useState(employeeToEdit?.remainingVacationDays?.toString() || '0');

  const validateForm = () => {
    if (!firstName || !lastName || !email || !phone || !birthDate || !birthPlace || 
        !birthCountry || !socialSecurityNumber || !startDate || !startTime || 
        !endTime || !breakStartTime || !breakEndTime) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setBirthDate('');
    setBirthPlace('');
    setBirthCountry('');
    setSocialSecurityNumber('');
    setContractType('CDI');
    setStartDate('');
    setPosition('Traducteur');
    setStartTime('09:00');
    setEndTime('17:00');
    setBreakStartTime('12:00');
    setBreakEndTime('13:00');
    setPreviousYearVacationDays('0');
    setUsedVacationDays('0');
    setRemainingVacationDays('0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData: NewEmployee = {
      firstName,
      lastName,
      email,
      phone,
      birthDate: new Date(birthDate).toISOString(),
      birthPlace,
      birthCountry,
      socialSecurityNumber,
      contractType,
      startDate: new Date(startDate).toISOString(),
      position,
      workSchedule: {
        startTime,
        endTime,
        breakStartTime,
        breakEndTime
      },
      previousYearVacationDays: Number(previousYearVacationDays),
      usedVacationDays: Number(usedVacationDays),
      remainingVacationDays: Number(remainingVacationDays)
    };

    try {
      if (mode === 'create') {
        console.log('Starting employee creation process...');
        
        // First check if user already exists
        const { data: existingUser, error: queryError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.email.toLowerCase())
          .maybeSingle();

        if (queryError) {
          console.error('Profile query error:', queryError);
          toast.error("Erreur lors de la vérification de l'utilisateur");
          return;
        }

        if (existingUser) {
          console.log('User already exists:', existingUser);
          toast.error("Un utilisateur avec cet email existe déjà");
          return;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.toLowerCase(),
          password: 'Welcome123!',
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName
            }
          }
        });

        if (authError) {
          console.error('Auth Error:', authError);
          if (authError.message.includes('rate_limit')) {
            toast.error("Veuillez patienter quelques secondes avant de réessayer");
          } else {
            toast.error("Erreur lors de la création du compte utilisateur");
          }
          return;
        }

        if (!authData.user) {
          console.error('No user data returned from auth signup');
          toast.error("Erreur lors de la création du compte utilisateur");
          return;
        }

        const userId = authData.user.id;
        console.log('Auth user created successfully:', userId);

        // Wait for profile creation
        let profile = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (profileError) {
            console.error('Profile check error:', profileError);
            break;
          }

          if (profileData) {
            profile = profileData;
            console.log('Profile created successfully:', profile);
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }

        if (!profile) {
          console.error('Profile creation failed after', maxAttempts, 'attempts');
          await supabase.auth.admin.deleteUser(userId);
          toast.error("Erreur lors de la création du profil utilisateur");
          return;
        }

        // Create employee record
        console.log('Creating employee record...');
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            id: userId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email.toLowerCase(),
            phone: formData.phone,
            birth_date: formData.birthDate,
            birth_place: formData.birthPlace,
            birth_country: formData.birthCountry,
            social_security_number: formData.socialSecurityNumber,
            contract_type: formData.contractType,
            start_date: formData.startDate,
            position: formData.position,
            work_schedule: formData.workSchedule as unknown as Json,
            previous_year_vacation_days: formData.previousYearVacationDays,
            used_vacation_days: formData.usedVacationDays,
            remaining_vacation_days: formData.remainingVacationDays
          });

        if (employeeError) {
          console.error('Employee creation error:', employeeError);
          await supabase.auth.admin.deleteUser(userId);
          
          if (employeeError.code === '23505') {
            toast.error("Un employé avec cet identifiant existe déjà");
          } else {
            toast.error("Erreur lors de la création de l'employé");
          }
          return;
        }

        console.log('Employee created successfully');
        toast.success("Employé créé avec succès");
        onSubmit(formData);
        resetForm();
        onClose();
      } else {
        if (!employeeToEdit?.id) {
          toast.error("ID de l'employé manquant pour la mise à jour");
          return;
        }

        console.log('Updating employee:', employeeToEdit.id);
        
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            birth_date: formData.birthDate,
            birth_place: formData.birthPlace,
            birth_country: formData.birthCountry,
            social_security_number: formData.socialSecurityNumber,
            contract_type: formData.contractType,
            start_date: formData.startDate,
            position: formData.position,
            work_schedule: formData.workSchedule as unknown as Json,
            previous_year_vacation_days: formData.previousYearVacationDays,
            used_vacation_days: formData.usedVacationDays,
            remaining_vacation_days: formData.remainingVacationDays
          })
          .eq('id', employeeToEdit.id);

        if (updateError) {
          console.error('Update Error:', updateError);
          toast.error("Erreur lors de la mise à jour de l'employé");
          return;
        }

        console.log('Employee updated successfully');
        toast.success("Employé mis à jour avec succès");
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error("Une erreur inattendue est survenue");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Ajouter un employé' : 'Modifier un employé'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Date de naissance</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthPlace">Lieu de naissance</Label>
                <Input
                  id="birthPlace"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthCountry">Pays de naissance</Label>
                <Input
                  id="birthCountry"
                  value={birthCountry}
                  onChange={(e) => setBirthCountry(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="socialSecurityNumber">Numéro de sécurité sociale</Label>
                <Input
                  id="socialSecurityNumber"
                  value={socialSecurityNumber}
                  onChange={(e) => setSocialSecurityNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractType">Type de contrat</Label>
                <Select value={contractType} onValueChange={(value: ContractType) => setContractType(value)}>
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
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Poste</Label>
              <Select value={position} onValueChange={(value: Position) => setPosition(value)}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Heure d'arrivée</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Heure de départ</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breakStartTime">Début pause déjeuner</Label>
                <Input
                  id="breakStartTime"
                  type="time"
                  value={breakStartTime}
                  onChange={(e) => setBreakStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="breakEndTime">Fin pause déjeuner</Label>
                <Input
                  id="breakEndTime"
                  type="time"
                  value={breakEndTime}
                  onChange={(e) => setBreakEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="previousYearVacationDays">Congés N-1</Label>
                <Input
                  id="previousYearVacationDays"
                  type="number"
                  value={previousYearVacationDays}
                  onChange={(e) => setPreviousYearVacationDays(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usedVacationDays">Congés pris</Label>
                <Input
                  id="usedVacationDays"
                  type="number"
                  value={usedVacationDays}
                  onChange={(e) => setUsedVacationDays(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remainingVacationDays">Congés restants</Label>
                <Input
                  id="remainingVacationDays"
                  type="number"
                  value={remainingVacationDays}
                  onChange={(e) => setRemainingVacationDays(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit">
                {mode === 'create' ? 'Ajouter' : 'Mettre à jour'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default NewEmployeeForm;