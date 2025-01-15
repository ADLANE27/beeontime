import { ContractType, NewEmployee, Position, WorkSchedule } from "@/types/hr";

export interface PersonalInfoFormProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace: string;
  birthCountry: string;
  socialSecurityNumber: string;
  onFieldChange: (field: keyof NewEmployee, value: string) => void;
}

export interface WorkInfoFormProps {
  contractType: ContractType;
  startDate: string;
  position: Position;
  onFieldChange: (field: keyof NewEmployee, value: string) => void;
}

export interface ScheduleInfoFormProps {
  workSchedule: WorkSchedule;
  onScheduleChange: (schedule: WorkSchedule) => void;
}

export interface VacationInfoFormProps {
  previousYearVacationDays: string;
  usedVacationDays: string;
  remainingVacationDays: string;
  onFieldChange: (field: keyof NewEmployee, value: string) => void;
}