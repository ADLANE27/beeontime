
export interface Employee {
  id: number;
  name: string;
  poste: Position;
  department: string;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  clockIn: string;
  clockOut: string;
  status: 'present' | 'absent' | 'late';
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'other';
  status: 'En attente de confirmation' | 'approuvé' | 'rejeté';
  reason: string;
  comment?: string;
}

export interface Payslip {
  id: string;
  employee_id: string;
  month: string;
  year: string;
  file_url: string;
  created_at?: string;
}

export interface OvertimeRequest {
  id: number;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: 'En attente de confirmation' | 'approuvé' | 'rejeté';
}

export type ContractType = 'CDI' | 'CDD' | 'Alternance' | 'Stage';

export type Position = 
  | 'Traducteur' 
  | 'Traductrice' 
  | 'Interprète'
  | 'Coordinatrice'
  | 'Cheffe de projets'
  | 'Chef de projets'
  | 'Alternant'
  | 'Alternante'
  | 'Stagiaire'
  | 'Directeur'
  | 'Assistante de direction';

export interface WorkSchedule {
  [key: string]: string;
  startTime: string;
  endTime: string;
  breakStartTime: string;
  breakEndTime: string;
}

export interface NewEmployee {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace: string;
  birthCountry: string;
  socialSecurityNumber: string;
  contractType: ContractType;
  startDate: string;
  position: Position;
  workSchedule: WorkSchedule;
  currentYearVacationDays: number;
  currentYearUsedDays: number;
  previousYearVacationDays: number;
  previousYearUsedDays: number;
  initialPassword: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface VacationBalance {
  currentYearVacationDays: number;
  currentYearUsedDays: number;
  previousYearVacationDays: number;
  previousYearUsedDays: number;
}
