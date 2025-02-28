
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { AddressInfoForm } from "./AddressInfoForm";
import { WorkInfoForm } from "./WorkInfoForm";
import { ScheduleInfoForm } from "./ScheduleInfoForm";
import { VacationInfoForm } from "./VacationInfoForm";
import { useEmployeeSubmit } from "./hooks/useEmployeeSubmit";
import { NewEmployee, WorkSchedule } from "@/types/hr";
import { Loader2, User, MapPin, Briefcase, Clock, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const NewEmployeeForm = ({ 
  onSuccess, 
  initialData,
  isEditing = false 
}: { 
  onSuccess: () => void;
  initialData?: NewEmployee;
  isEditing?: boolean;
}) => {
  const [formData, setFormData] = useState<NewEmployee>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    birthDate: initialData?.birthDate || '',
    birthPlace: initialData?.birthPlace || '',
    birthCountry: initialData?.birthCountry || '',
    socialSecurityNumber: initialData?.socialSecurityNumber || '',
    contractType: initialData?.contractType || 'CDI',
    startDate: initialData?.startDate || '',
    position: initialData?.position || 'Traducteur',
    workSchedule: initialData?.workSchedule || {
      startTime: '09:00',
      endTime: '17:00',
      breakStartTime: '12:30',
      breakEndTime: '13:30'
    },
    currentYearVacationDays: initialData?.currentYearVacationDays || 17.5,
    currentYearUsedDays: initialData?.currentYearUsedDays || 6,
    previousYearVacationDays: initialData?.previousYearVacationDays || 28,
    previousYearUsedDays: initialData?.previousYearUsedDays || 28,
    initialPassword: initialData?.initialPassword || '',
    streetAddress: initialData?.streetAddress || '',
    city: initialData?.city || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || 'France'
  });

  const { handleSubmit, isSubmitting } = useEmployeeSubmit(onSuccess, isEditing);

  const handleFieldChange = (field: keyof NewEmployee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScheduleChange = (schedule: WorkSchedule) => {
    setFormData(prev => ({ ...prev, workSchedule: schedule }));
  };

  const currentYearBalance = formData.currentYearVacationDays - formData.currentYearUsedDays;
  const previousYearBalance = formData.previousYearVacationDays - formData.previousYearUsedDays;

  return (
    <div className="p-6">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(formData);
        }}
        className="space-y-6"
      >
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Personnel</span>
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Adresse</span>
            </TabsTrigger>
            <TabsTrigger value="work" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span>Travail</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Horaires</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4 bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-medium mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFieldChange("firstName", e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleFieldChange("lastName", e.target.value)}
                  className="h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3 mt-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-3 mt-4">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-3 mt-4">
              <Label htmlFor="initialPassword">Mot de passe initial</Label>
              <Input
                id="initialPassword"
                type="text"
                value={formData.initialPassword}
                onChange={(e) => handleFieldChange("initialPassword", e.target.value)}
                className="h-12"
                required={!isEditing}
              />
            </div>
            
            <div className="space-y-3 mt-4">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleFieldChange("birthDate", e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-3 mt-4">
              <Label htmlFor="birthPlace">Lieu de naissance</Label>
              <Input
                id="birthPlace"
                value={formData.birthPlace}
                onChange={(e) => handleFieldChange("birthPlace", e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-3 mt-4">
              <Label htmlFor="birthCountry">Pays de naissance</Label>
              <Input
                id="birthCountry"
                value={formData.birthCountry}
                onChange={(e) => handleFieldChange("birthCountry", e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-3 mt-4">
              <Label htmlFor="socialSecurityNumber">Numéro de sécurité sociale</Label>
              <Input
                id="socialSecurityNumber"
                value={formData.socialSecurityNumber}
                onChange={(e) => handleFieldChange("socialSecurityNumber", e.target.value)}
                className="h-12"
                required
              />
            </div>
          </TabsContent>
          
          <TabsContent value="address" className="space-y-4 bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-medium mb-4">Adresse</h2>
            <div className="space-y-3">
              <Label htmlFor="streetAddress">Rue</Label>
              <Input
                id="streetAddress"
                value={formData.streetAddress}
                onChange={(e) => handleFieldChange("streetAddress", e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-3">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="postalCode">Code postal</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                  className="h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3 mt-4">
              <Label htmlFor="country">Pays</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleFieldChange("country", e.target.value)}
                className="h-12"
                required
              />
            </div>
          </TabsContent>
          
          <TabsContent value="work" className="space-y-4 bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-medium mb-4">Informations professionnelles</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="position">Poste</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleFieldChange("position", e.target.value)}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="contractType">Type de contrat</Label>
                <Input
                  id="contractType"
                  value={formData.contractType}
                  onChange={(e) => handleFieldChange("contractType", e.target.value)}
                  className="h-12"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3 mt-4">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleFieldChange("startDate", e.target.value)}
                className="h-12"
                required
              />
            </div>
            
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-medium">Congés</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="currentYearVacationDays">Congés année en cours (acquis)</Label>
                  <Input
                    id="currentYearVacationDays"
                    type="number"
                    step="0.5"
                    value={formData.currentYearVacationDays}
                    onChange={(e) => handleFieldChange("currentYearVacationDays", parseFloat(e.target.value))}
                    className="h-12"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="currentYearUsedDays">Congés année en cours (pris)</Label>
                  <Input
                    id="currentYearUsedDays"
                    type="number"
                    step="0.5"
                    value={formData.currentYearUsedDays}
                    onChange={(e) => handleFieldChange("currentYearUsedDays", parseFloat(e.target.value))}
                    className="h-12"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div className="space-y-3">
                  <Label htmlFor="previousYearVacationDays">Congés année précédente (acquis)</Label>
                  <Input
                    id="previousYearVacationDays"
                    type="number"
                    step="0.5"
                    value={formData.previousYearVacationDays}
                    onChange={(e) => handleFieldChange("previousYearVacationDays", parseFloat(e.target.value))}
                    className="h-12"
                    required
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="previousYearUsedDays">Congés année précédente (pris)</Label>
                  <Input
                    id="previousYearUsedDays"
                    type="number"
                    step="0.5"
                    value={formData.previousYearUsedDays}
                    onChange={(e) => handleFieldChange("previousYearUsedDays", parseFloat(e.target.value))}
                    className="h-12"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">Solde année en cours: </span>
                  <span className="font-bold text-blue-800">{currentYearBalance.toFixed(1)} jours</span>
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">Solde année précédente: </span>
                  <span className="font-bold text-blue-800">{previousYearBalance.toFixed(1)} jours</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-4 bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-medium mb-4">Horaires de travail</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="startTime">Début journée</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.workSchedule.startTime}
                  onChange={(e) => handleScheduleChange({...formData.workSchedule, startTime: e.target.value})}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="endTime">Fin journée</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.workSchedule.endTime}
                  onChange={(e) => handleScheduleChange({...formData.workSchedule, endTime: e.target.value})}
                  className="h-12"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-3">
                <Label htmlFor="breakStartTime">Début pause déjeuner</Label>
                <Input
                  id="breakStartTime"
                  type="time"
                  value={formData.workSchedule.breakStartTime}
                  onChange={(e) => handleScheduleChange({...formData.workSchedule, breakStartTime: e.target.value})}
                  className="h-12"
                  required
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="breakEndTime">Fin pause déjeuner</Label>
                <Input
                  id="breakEndTime"
                  type="time"
                  value={formData.workSchedule.breakEndTime}
                  onChange={(e) => handleScheduleChange({...formData.workSchedule, breakEndTime: e.target.value})}
                  className="h-12"
                  required
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => window.history.back()}
            className="px-6 h-12"
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 h-12 bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isEditing ? "Modification en cours..." : "Création en cours..."}
              </>
            ) : (
              isEditing ? "Mettre à jour" : "Créer l'employé"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
