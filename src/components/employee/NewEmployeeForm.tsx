import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NewEmployee } from "@/types/hr";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { WorkInfoForm } from "./WorkInfoForm";
import { ScheduleInfoForm } from "./ScheduleInfoForm";
import { VacationInfoForm } from "./VacationInfoForm";
import { AddressInfoForm } from "./AddressInfoForm";
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
  // En mode création, on force des valeurs vides
  // En mode édition, on utilise les valeurs de l'employé à éditer
  const [firstName, setFirstName] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.firstName : '');
  const [lastName, setLastName] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.lastName : '');
  const [email, setEmail] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.email : '');
  const [phone, setPhone] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.phone : '');
  const [birthDate, setBirthDate] = useState(mode === 'edit' && employeeToEdit?.birthDate ? 
    new Date(employeeToEdit.birthDate).toISOString().split('T')[0] : '');
  const [birthPlace, setBirthPlace] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.birthPlace : '');
  const [birthCountry, setBirthCountry] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.birthCountry : '');
  const [socialSecurityNumber, setSocialSecurityNumber] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.socialSecurityNumber : '');
  const [contractType, setContractType] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.contractType : 'CDI');
  const [startDate, setStartDate] = useState(mode === 'edit' && employeeToEdit?.startDate ? 
    new Date(employeeToEdit.startDate).toISOString().split('T')[0] : '');
  const [position, setPosition] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.position : 'Traducteur');
  const [workSchedule, setWorkSchedule] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.workSchedule : {
    startTime: '09:00',
    endTime: '17:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00'
  });
  const [currentYearVacationDays, setCurrentYearVacationDays] = useState(mode === 'edit' && employeeToEdit ? 
    employeeToEdit.currentYearVacationDays?.toString() : '0');
  const [currentYearUsedDays, setCurrentYearUsedDays] = useState(mode === 'edit' && employeeToEdit ? 
    employeeToEdit.currentYearUsedDays?.toString() : '0');
  const [previousYearVacationDays, setPreviousYearVacationDays] = useState(mode === 'edit' && employeeToEdit ? 
    employeeToEdit.previousYearVacationDays?.toString() : '0');
  const [previousYearUsedDays, setPreviousYearUsedDays] = useState(mode === 'edit' && employeeToEdit ? 
    employeeToEdit.previousYearUsedDays?.toString() : '0');
  const [initialPassword, setInitialPassword] = useState('');
  const [streetAddress, setStreetAddress] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.streetAddress : '');
  const [city, setCity] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.city : '');
  const [postalCode, setPostalCode] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.postalCode : '');
  const [country, setCountry] = useState(mode === 'edit' && employeeToEdit ? employeeToEdit.country : 'France');

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
      initialPassword,
      streetAddress,
      city,
      postalCode,
      country
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
      case "streetAddress":
        setStreetAddress(value);
        break;
      case "city":
        setCity(value);
        break;
      case "postalCode":
        setPostalCode(value);
        break;
      case "country":
        setCountry(value);
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
    setStreetAddress('');
    setCity('');
    setPostalCode('');
    setCountry('France');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      await submitEmployee({
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
        initialPassword,
        streetAddress,
        city,
        postalCode,
        country
      });
    } else {
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
        initialPassword,
        streetAddress,
        city,
        postalCode,
        country
      });
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

            <AddressInfoForm
              streetAddress={streetAddress}
              city={city}
              postalCode={postalCode}
              country={country}
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
