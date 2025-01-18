import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NewEmployee } from "@/types/hr";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { WorkInfoForm } from "./WorkInfoForm";
import { ScheduleInfoForm } from "./ScheduleInfoForm";
import { VacationInfoForm } from "./VacationInfoForm";
import { useEmployeeSubmit } from "./hooks/useEmployeeSubmit";

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
  const [contractType, setContractType] = useState(employeeToEdit?.contractType || 'CDI');
  const [startDate, setStartDate] = useState(employeeToEdit?.startDate ? new Date(employeeToEdit.startDate).toISOString().split('T')[0] : '');
  const [position, setPosition] = useState(employeeToEdit?.position || 'Traducteur');
  const [workSchedule, setWorkSchedule] = useState(employeeToEdit?.workSchedule || {
    startTime: '09:00',
    endTime: '17:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00'
  });
  const [currentYearVacationDays, setCurrentYearVacationDays] = useState(employeeToEdit?.currentYearVacationDays?.toString() || '0');
  const [currentYearUsedDays, setCurrentYearUsedDays] = useState(employeeToEdit?.currentYearUsedDays?.toString() || '0');
  const [previousYearVacationDays, setPreviousYearVacationDays] = useState(employeeToEdit?.previousYearVacationDays?.toString() || '0');
  const [previousYearUsedDays, setPreviousYearUsedDays] = useState(employeeToEdit?.previousYearUsedDays?.toString() || '0');
  const [initialPassword, setInitialPassword] = useState(employeeToEdit?.initialPassword || '');

  const { handleSubmit: submitEmployee, isSubmitting } = useEmployeeSubmit(() => {
    resetForm();
    onSubmit({
      id: employeeToEdit?.id,
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
      workSchedule,
      currentYearVacationDays: Number(currentYearVacationDays),
      currentYearUsedDays: Number(currentYearUsedDays),
      previousYearVacationDays: Number(previousYearVacationDays),
      previousYearUsedDays: Number(previousYearUsedDays),
      initialPassword
    });
    onClose();
  });

  const handleFieldChange = (field: keyof NewEmployee, value: string) => {
    switch (field) {
      case "firstName":
        setFirstName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "phone":
        setPhone(value);
        break;
      case "birthDate":
        setBirthDate(value);
        break;
      case "birthPlace":
        setBirthPlace(value);
        break;
      case "birthCountry":
        setBirthCountry(value);
        break;
      case "socialSecurityNumber":
        setSocialSecurityNumber(value);
        break;
      case "contractType":
        setContractType(value as any);
        break;
      case "startDate":
        setStartDate(value);
        break;
      case "position":
        setPosition(value as any);
        break;
      case "currentYearVacationDays":
        setCurrentYearVacationDays(value);
        break;
      case "currentYearUsedDays":
        setCurrentYearUsedDays(value);
        break;
      case "previousYearVacationDays":
        setPreviousYearVacationDays(value);
        break;
      case "previousYearUsedDays":
        setPreviousYearUsedDays(value);
        break;
      case "initialPassword":
        setInitialPassword(value);
        break;
    }
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
    setWorkSchedule({
      startTime: '09:00',
      endTime: '17:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00'
    });
    setCurrentYearVacationDays('0');
    setCurrentYearUsedDays('0');
    setPreviousYearVacationDays('0');
    setPreviousYearUsedDays('0');
    setInitialPassword('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData: NewEmployee = {
      id: employeeToEdit?.id,
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
      workSchedule,
      currentYearVacationDays: Number(currentYearVacationDays),
      currentYearUsedDays: Number(currentYearUsedDays),
      previousYearVacationDays: Number(previousYearVacationDays),
      previousYearUsedDays: Number(previousYearUsedDays),
      initialPassword
    };

    if (mode === 'create') {
      await submitEmployee(formData);
    } else {
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Ajouter un employé' : 'Modifier un employé'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)] pr-4">
          <form onSubmit={handleFormSubmit} className="space-y-8">
            <PersonalInfoForm
              firstName={firstName}
              lastName={lastName}
              email={email}
              phone={phone}
              birthDate={birthDate}
              birthPlace={birthPlace}
              birthCountry={birthCountry}
              socialSecurityNumber={socialSecurityNumber}
              initialPassword={initialPassword}
              onFieldChange={handleFieldChange}
            />

            <WorkInfoForm
              contractType={contractType}
              startDate={startDate}
              position={position}
              onFieldChange={handleFieldChange}
            />

            <ScheduleInfoForm
              workSchedule={workSchedule}
              onScheduleChange={setWorkSchedule}
            />

            <VacationInfoForm
              currentYearVacationDays={currentYearVacationDays}
              currentYearUsedDays={currentYearUsedDays}
              previousYearVacationDays={previousYearVacationDays}
              previousYearUsedDays={previousYearUsedDays}
              onFieldChange={handleFieldChange}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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