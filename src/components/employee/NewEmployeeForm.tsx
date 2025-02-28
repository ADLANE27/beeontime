
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="flex justify-center items-start w-full h-full">
      <ScrollArea className="w-full max-w-3xl h-[calc(100vh-8rem)] px-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(formData);
          }} 
          className="space-y-4 py-4"
        >
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="bg-blue-50 py-3 px-4 border-b border-slate-200">
              <div className="flex items-center">
                <User className="h-4 w-4 text-blue-600 mr-2" />
                <h3 className="text-base font-medium text-blue-800">Informations personnelles</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <PersonalInfoForm
                firstName={formData.firstName}
                lastName={formData.lastName}
                email={formData.email}
                phone={formData.phone}
                birthDate={formData.birthDate}
                birthPlace={formData.birthPlace}
                birthCountry={formData.birthCountry}
                socialSecurityNumber={formData.socialSecurityNumber}
                initialPassword={formData.initialPassword}
                onFieldChange={handleFieldChange}
              />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="bg-indigo-50 py-3 px-4 border-b border-slate-200">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-indigo-600 mr-2" />
                <h3 className="text-base font-medium text-indigo-800">Adresse</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <AddressInfoForm
                streetAddress={formData.streetAddress}
                city={formData.city}
                postalCode={formData.postalCode}
                country={formData.country}
                onFieldChange={handleFieldChange}
              />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="bg-green-50 py-3 px-4 border-b border-slate-200">
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 text-green-600 mr-2" />
                <h3 className="text-base font-medium text-green-800">Informations professionnelles</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <WorkInfoForm
                contractType={formData.contractType}
                startDate={formData.startDate}
                position={formData.position}
                onFieldChange={handleFieldChange}
              />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="bg-amber-50 py-3 px-4 border-b border-slate-200">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-amber-600 mr-2" />
                <h3 className="text-base font-medium text-amber-800">Horaires de travail</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <ScheduleInfoForm
                workSchedule={formData.workSchedule}
                onScheduleChange={handleScheduleChange}
              />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="bg-purple-50 py-3 px-4 border-b border-slate-200">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                <h3 className="text-base font-medium text-purple-800">Congés</h3>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <VacationInfoForm
                currentYearVacationDays={formData.currentYearVacationDays.toString()}
                currentYearUsedDays={formData.currentYearUsedDays.toString()}
                previousYearVacationDays={formData.previousYearVacationDays.toString()}
                previousYearUsedDays={formData.previousYearUsedDays.toString()}
                onFieldChange={(field, value) => handleFieldChange(field, Number(value))}
              />
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="bg-blue-50 py-3 px-4 border-b border-slate-200">
              <div className="flex items-center">
                <KeyRound className="h-4 w-4 text-blue-600 mr-2" />
                <h3 className="text-base font-medium text-blue-800">
                  {isEditing ? "Nouveau mot de passe (optionnel)" : "Mot de passe initial"}
                </h3>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <PasswordField
                value={formData.initialPassword}
                onChange={(value) => handleFieldChange('initialPassword', value)}
                isRequired={!isEditing}
                label={isEditing ? "Nouveau mot de passe (optionnel)" : "Mot de passe initial"}
              />
            </CardContent>
          </Card>

          <div className="sticky bottom-0 bg-white pt-4 pb-6 z-10">
            <Separator className="mb-4" />
            
            <div className="flex justify-end">
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
          </div>
        </form>
      </ScrollArea>
    </div>
  );
};
