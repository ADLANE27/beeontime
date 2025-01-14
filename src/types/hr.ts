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
  status: 'pending' | 'approved' | 'rejected';
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
  status: 'pending' | 'approved' | 'rejected';
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

export interface NewEmployee {
  firstName: string;
  lastName: string;
  birthDate: Date;
  birthPlace: string;
  birthCountry: string;
  socialSecurityNumber: string;
  contractType: ContractType;
  startDate: Date;
  position: Position;
  workSchedule: string;
  previousYearVacationDays: number;
  usedVacationDays: number;
  remainingVacationDays: number;
}
