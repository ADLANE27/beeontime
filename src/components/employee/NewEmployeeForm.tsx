
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
    <ScrollArea className="w-full h-full max-h-[calc(85vh-6rem)]">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(formData);
        }} 
        className="space-y-6 max-w-4xl mx-auto px-4 pb-8"
      >
        <Card className="border border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-base font-medium text-blue-800">Informations personnelles</h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
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

        <Card className="border border-slate-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="text-base font-medium text-indigo-800">Adresse</h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <AddressInfoForm
              streetAddress={formData.streetAddress}
              city={formData.city}
              postalCode={formData.postalCode}
              country={formData.country}
              onFieldChange={handleFieldChange}
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 border-b">
            <div className="flex items-center">
              <Briefcase className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-base font-medium text-green-800">Informations professionnelles</h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <WorkInfoForm
              contractType={formData.contractType}
              startDate={formData.startDate}
              position={formData.position}
              onFieldChange={handleFieldChange}
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-amber-600 mr-2" />
              <h3 className="text-base font-medium text-amber-800">Horaires de travail</h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <ScheduleInfoForm
              workSchedule={formData.workSchedule}
              onScheduleChange={handleScheduleChange}
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-base font-medium text-purple-800">Congés</h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <VacationInfoForm
              currentYearVacationDays={formData.currentYearVacationDays.toString()}
              currentYearUsedDays={formData.currentYearUsedDays.toString()}
              previousYearVacationDays={formData.previousYearVacationDays.toString()}
              previousYearUsedDays={formData.previousYearUsedDays.toString()}
              onFieldChange={(field, value) => handleFieldChange(field, Number(value))}
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 border-b">
            <div className="flex items-center">
              <KeyRound className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-base font-medium text-blue-800">
                {isEditing ? "Nouveau mot de passe (optionnel)" : "Mot de passe initial"}
              </h3>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <PasswordField
              value={formData.initialPassword}
              onChange={(value) => handleFieldChange('initialPassword', value)}
              isRequired={!isEditing}
              label={isEditing ? "Nouveau mot de passe (optionnel)" : "Mot de passe initial"}
            />
          </CardContent>
        </Card>

        <div className="sticky bottom-0 pt-4 bg-white pb-4 z-10">
          <Separator className="my-4" />
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2"
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
  );
};
