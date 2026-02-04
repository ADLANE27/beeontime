/**
 * Helpers pour la validation et le contrôle des données d'export
 */

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export interface ValidationAlert {
  type: 'error' | 'warning' | 'info';
  employee: string;
  message: string;
  details?: string;
}

export interface EmployeeSummary {
  id: string;
  name: string;
  position: string | null;
  workingDays: number;
  absenceDays: number;
  workedDays: number;
  mealVouchers: number;
  delayMinutes: number;
  delayCount: number;
  overtimeHours: number;
  overtimeCount: number;
  hasIncompleteTimeRecords: boolean;
  missingJustifications: number;
}

export interface ValidationReport {
  generatedAt: Date;
  generatedBy: string;
  period: string;
  workingDaysInMonth: number;
  holidaysInMonth: number;
  alerts: ValidationAlert[];
  totals: {
    totalEmployees: number;
    totalAbsenceDays: number;
    totalMealVouchers: number;
    totalDelayMinutes: number;
    totalOvertimeHours: number;
    employeesWithAbsences: number;
    employeesWithDelays: number;
    employeesWithOvertime: number;
  };
  employeeSummaries: EmployeeSummary[];
}

/**
 * Génère des alertes de validation basées sur les données
 */
export const generateValidationAlerts = (
  employees: any[],
  absences: any[],
  delays: any[],
  overtimes: any[],
  timeRecords: any[],
  workingDaysInMonth: number
): ValidationAlert[] => {
  const alerts: ValidationAlert[] = [];

  employees.forEach(employee => {
    const employeeName = `${employee.first_name} ${employee.last_name}`;
    
    // Vérifier les absences sans justificatif pour certains types
    const employeeAbsences = absences.filter(a => a.employee_id === employee.id);
    const sickLeaves = employeeAbsences.filter(a => a.type === 'sickLeave' && !a.has_document);
    if (sickLeaves.length > 0) {
      alerts.push({
        type: 'warning',
        employee: employeeName,
        message: `${sickLeaves.length} arrêt(s) maladie sans justificatif`,
        details: 'Un justificatif médical est requis pour les arrêts maladie'
      });
    }

    // Vérifier les retards excessifs
    const employeeDelays = delays.filter(d => d.employee_id === employee.id);
    const totalDelayMinutes = employeeDelays.reduce((sum, d) => {
      if (!d.duration) return sum;
      const parts = String(d.duration).split(':');
      if (parts.length >= 2) {
        return sum + (parseInt(parts[0]) * 60) + parseInt(parts[1]);
      }
      return sum;
    }, 0);

    if (totalDelayMinutes > 60) {
      alerts.push({
        type: 'warning',
        employee: employeeName,
        message: `Retards cumulés importants: ${Math.floor(totalDelayMinutes / 60)}h${totalDelayMinutes % 60}min`,
        details: `${employeeDelays.length} retard(s) sur le mois`
      });
    }

    // Vérifier les heures supplémentaires importantes
    const employeeOvertimes = overtimes.filter(o => o.employee_id === employee.id);
    const totalOvertimeHours = employeeOvertimes.reduce((sum, o) => sum + parseFloat(String(o.hours)), 0);
    
    if (totalOvertimeHours > 20) {
      alerts.push({
        type: 'info',
        employee: employeeName,
        message: `Heures supplémentaires élevées: ${totalOvertimeHours.toFixed(1)}h`,
        details: `${employeeOvertimes.length} demande(s) ce mois`
      });
    }

    // Vérifier les pointages incomplets
    const employeeTimeRecords = timeRecords.filter(t => t.employee_id === employee.id);
    const incompleteRecords = employeeTimeRecords.filter(
      t => !t.morning_in || !t.evening_out
    );
    
    if (incompleteRecords.length > 3) {
      alerts.push({
        type: 'warning',
        employee: employeeName,
        message: `${incompleteRecords.length} pointage(s) incomplet(s)`,
        details: 'Arrivée ou départ non enregistré'
      });
    }

    // Vérifier cohérence absences vs jours travaillés
    const employeeAbsenceDays = employeeAbsences.reduce((sum, a) => {
      // Calcul simplifié
      const start = new Date(a.start_date);
      const end = new Date(a.end_date);
      let days = 0;
      const current = new Date(start);
      while (current <= end) {
        if (current.getDay() !== 0 && current.getDay() !== 6) days++;
        current.setDate(current.getDate() + 1);
      }
      return sum + (a.day_type === 'half' ? days * 0.5 : days);
    }, 0);

    if (employeeAbsenceDays > workingDaysInMonth) {
      alerts.push({
        type: 'error',
        employee: employeeName,
        message: `Incohérence: ${employeeAbsenceDays} jours d'absence > ${workingDaysInMonth} jours ouvrés`,
        details: 'Vérifier les dates des absences'
      });
    }
  });

  return alerts;
};

/**
 * Calcule les totaux pour le rapport de contrôle
 */
export const calculateTotals = (summaries: EmployeeSummary[]) => {
  return {
    totalEmployees: summaries.length,
    totalAbsenceDays: summaries.reduce((sum, s) => sum + s.absenceDays, 0),
    totalMealVouchers: summaries.reduce((sum, s) => sum + s.mealVouchers, 0),
    totalDelayMinutes: summaries.reduce((sum, s) => sum + s.delayMinutes, 0),
    totalOvertimeHours: summaries.reduce((sum, s) => sum + s.overtimeHours, 0),
    employeesWithAbsences: summaries.filter(s => s.absenceDays > 0).length,
    employeesWithDelays: summaries.filter(s => s.delayCount > 0).length,
    employeesWithOvertime: summaries.filter(s => s.overtimeCount > 0).length,
  };
};

/**
 * Formate les données pour la feuille de contrôle Excel
 */
export const formatControlSheetData = (
  report: ValidationReport
): any[] => {
  const data: any[] = [];

  // En-tête du rapport
  data.push({
    "Section": "📊 RAPPORT DE CONTRÔLE",
    "Valeur": "",
    "Détails": ""
  });
  data.push({
    "Section": "Période",
    "Valeur": report.period,
    "Détails": ""
  });
  data.push({
    "Section": "Généré le",
    "Valeur": format(report.generatedAt, 'dd/MM/yyyy à HH:mm', { locale: fr }),
    "Détails": ""
  });
  data.push({
    "Section": "Jours ouvrés du mois",
    "Valeur": report.workingDaysInMonth,
    "Détails": `dont ${report.holidaysInMonth} jour(s) férié(s) exclu(s)`
  });
  
  // Ligne vide
  data.push({ "Section": "", "Valeur": "", "Détails": "" });
  
  // Totaux
  data.push({
    "Section": "📈 TOTAUX",
    "Valeur": "",
    "Détails": ""
  });
  data.push({
    "Section": "Nombre d'employés",
    "Valeur": report.totals.totalEmployees,
    "Détails": ""
  });
  data.push({
    "Section": "Total jours d'absence",
    "Valeur": report.totals.totalAbsenceDays.toFixed(1),
    "Détails": `${report.totals.employeesWithAbsences} employé(s) concerné(s)`
  });
  data.push({
    "Section": "Total titres restaurant",
    "Valeur": report.totals.totalMealVouchers,
    "Détails": ""
  });
  data.push({
    "Section": "Total retards",
    "Valeur": `${Math.floor(report.totals.totalDelayMinutes / 60)}h${report.totals.totalDelayMinutes % 60}min`,
    "Détails": `${report.totals.employeesWithDelays} employé(s) concerné(s)`
  });
  data.push({
    "Section": "Total heures supplémentaires",
    "Valeur": report.totals.totalOvertimeHours.toFixed(1) + "h",
    "Détails": `${report.totals.employeesWithOvertime} employé(s) concerné(s)`
  });

  // Ligne vide
  data.push({ "Section": "", "Valeur": "", "Détails": "" });

  // Alertes
  if (report.alerts.length > 0) {
    data.push({
      "Section": "⚠️ ALERTES ET VÉRIFICATIONS",
      "Valeur": "",
      "Détails": ""
    });
    
    const errorAlerts = report.alerts.filter(a => a.type === 'error');
    const warningAlerts = report.alerts.filter(a => a.type === 'warning');
    const infoAlerts = report.alerts.filter(a => a.type === 'info');
    
    [...errorAlerts, ...warningAlerts, ...infoAlerts].forEach(alert => {
      const icon = alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
      data.push({
        "Section": `${icon} ${alert.employee}`,
        "Valeur": alert.message,
        "Détails": alert.details || ""
      });
    });
  } else {
    data.push({
      "Section": "✅ AUCUNE ALERTE",
      "Valeur": "Toutes les données semblent cohérentes",
      "Détails": ""
    });
  }

  return data;
};
