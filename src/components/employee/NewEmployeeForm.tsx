
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { AddressInfoForm } from "./AddressInfoForm";
import { WorkInfoForm } from "./WorkInfoForm";
import { ScheduleInfoForm } from "./ScheduleInfoForm";
import { VacationInfoForm } from "./VacationInfoForm";
import { PasswordField } from "./PasswordField";
import { useEmployeeSubmit } from "./hooks/useEmployeeSubmit";
import { NewEmployee, WorkSchedule } from "@/types/hr";
import { Loader2, User, MapPin, Briefcase, Clock, Calendar, KeyRound } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="space-y-6 py-4">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(formData);
        }}
        className="space-y-6"
      >
        {/* Horaires de travail */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
            <Clock className="h-5 w-5 text-gray-700 mr-2" />
            <h2 className="font-medium">Horaires de travail</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <Label htmlFor="startTime" className="block mb-2">Début journée</Label>
                <div className="relative">
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.workSchedule.startTime}
                    onChange={(e) => handleScheduleChange({...formData.workSchedule, startTime: e.target.value})}
                    className="pl-3 pr-9"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div>
                <Label htmlFor="endTime" className="block mb-2">Fin journée</Label>
                <div className="relative">
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.workSchedule.endTime}
                    onChange={(e) => handleScheduleChange({...formData.workSchedule, endTime: e.target.value})}
                    className="pl-3 pr-9"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="breakStartTime" className="block mb-2">Début pause déjeuner</Label>
                <div className="relative">
                  <Input
                    id="breakStartTime"
                    type="time"
                    value={formData.workSchedule.breakStartTime}
                    onChange={(e) => handleScheduleChange({...formData.workSchedule, breakStartTime: e.target.value})}
                    className="pl-3 pr-9"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
              <div>
                <Label htmlFor="breakEndTime" className="block mb-2">Fin pause déjeuner</Label>
                <div className="relative">
                  <Input
                    id="breakEndTime"
                    type="time"
                    value={formData.workSchedule.breakEndTime}
                    onChange={(e) => handleScheduleChange({...formData.workSchedule, breakEndTime: e.target.value})}
                    className="pl-3 pr-9"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Congés */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center bg-purple-50 px-4 py-3 border-b border-gray-200">
            <Calendar className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="font-medium text-purple-900">Congés</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-gray-700 mr-2" />
              <h3 className="font-medium">Congés</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Année en cours</h4>
                
                <div>
                  <Label htmlFor="currentYearVacationDays" className="block mb-2">Congés acquis</Label>
                  <Input
                    id="currentYearVacationDays"
                    type="number"
                    step="0.5"
                    value={formData.currentYearVacationDays}
                    onChange={(e) => handleFieldChange("currentYearVacationDays", parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="currentYearUsedDays" className="block mb-2">Congés pris</Label>
                  <Input
                    id="currentYearUsedDays"
                    type="number"
                    step="0.5"
                    value={formData.currentYearUsedDays}
                    onChange={(e) => handleFieldChange("currentYearUsedDays", parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  Solde: {currentYearBalance.toFixed(1)} jours
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Année précédente (N-1)</h4>
                
                <div>
                  <Label htmlFor="previousYearVacationDays" className="block mb-2">Congés acquis</Label>
                  <Input
                    id="previousYearVacationDays"
                    type="number"
                    step="0.5"
                    value={formData.previousYearVacationDays}
                    onChange={(e) => handleFieldChange("previousYearVacationDays", parseFloat(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="previousYearUsedDays" className="block mb-2">Congés pris</Label>
                  <Input
                    id="previousYearUsedDays"
                    type="number"
                    step="0.5"
                    value={formData.previousYearUsedDays}
                    onChange={(e) => handleFieldChange("previousYearUsedDays", parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  Solde: {previousYearBalance.toFixed(1)} jours
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bouton d'action */}
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Modification en cours..." : "Création en cours..."}
              </>
            ) : (
              isEditing ? "Mettre à jour l'employé" : "Créer l'employé"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
