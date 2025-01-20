import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { AddressInfoForm } from "./AddressInfoForm";
import { WorkInfoForm } from "./WorkInfoForm";
import { ScheduleInfoForm } from "./ScheduleInfoForm";
import { VacationInfoForm } from "./VacationInfoForm";
import { PasswordField } from "./PasswordField";
import { useEmployeeSubmit } from "./hooks/useEmployeeSubmit";
import { NewEmployee } from "@/types/hr";

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
      breakStartTime: '12:00',
      breakEndTime: '13:00'
    },
    currentYearVacationDays: initialData?.currentYearVacationDays || 0,
    currentYearUsedDays: initialData?.currentYearUsedDays || 0,
    previousYearVacationDays: initialData?.previousYearVacationDays || 0,
    previousYearUsedDays: initialData?.previousYearUsedDays || 0,
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

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(formData);
    }} className="space-y-8">
      <PersonalInfoForm
        firstName={formData.firstName}
        lastName={formData.lastName}
        email={formData.email}
        phone={formData.phone}
        birthDate={formData.birthDate}
        birthPlace={formData.birthPlace}
        birthCountry={formData.birthCountry}
        socialSecurityNumber={formData.socialSecurityNumber}
        onFieldChange={handleFieldChange}
      />

      <AddressInfoForm
        streetAddress={formData.streetAddress}
        city={formData.city}
        postalCode={formData.postalCode}
        country={formData.country}
        onFieldChange={handleFieldChange}
      />

      <WorkInfoForm
        contractType={formData.contractType}
        startDate={formData.startDate}
        position={formData.position}
        onFieldChange={handleFieldChange}
      />

      <ScheduleInfoForm
        workSchedule={formData.workSchedule}
        onScheduleChange={handleScheduleChange}
      />

      <VacationInfoForm
        currentYearVacationDays={formData.currentYearVacationDays.toString()}
        currentYearUsedDays={formData.currentYearUsedDays.toString()}
        previousYearVacationDays={formData.previousYearVacationDays.toString()}
        previousYearUsedDays={formData.previousYearUsedDays.toString()}
        onFieldChange={(field, value) => handleFieldChange(field, Number(value))}
      />

      <PasswordField
        value={formData.initialPassword}
        onChange={(value) => handleFieldChange('initialPassword', value)}
        isRequired={!isEditing}
        label={isEditing ? "Nouveau mot de passe (optionnel)" : "Mot de passe initial"}
      />

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? "Modification en cours..." : "Création en cours..."}
          </>
        ) : (
          isEditing ? "Modifier l'employé" : "Créer l'employé"
        )}
      </Button>
    </form>
  );
};
