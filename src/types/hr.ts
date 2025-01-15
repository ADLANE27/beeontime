export interface Employee {
  id: number;
  name: string;
  position: string;
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
  id: number;
  employeeId: number;
  month: string;
  year: number;
  fileUrl: string;
}

export interface OvertimeRequest {
  id: number;
  employeeId: number;
  date: string;
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
  startTime: string;
  endTime: string;
  breakStartTime: string;
  breakEndTime: string;
}

export interface NewEmployee {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: Date;
  birthPlace: string;
  birthCountry: string;
  socialSecurityNumber: string;
  contractType: ContractType;
  startDate: Date;
  position: Position;
  workSchedule: WorkSchedule;
  previousYearVacationDays: number;
  usedVacationDays: number;
  remainingVacationDays: number;
}