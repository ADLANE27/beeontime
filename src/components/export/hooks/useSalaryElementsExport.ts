
import { useState } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { leaveTypeTranslations, applyExcelStyling, getWorkingDaysInMonth } from "../utils/exportHelpers";
import { 
  generateValidationAlerts, 
  calculateTotals, 
  formatControlSheetData,
  type EmployeeSummary,
  type ValidationReport 
} from "../utils/validationHelpers";
import { generateSalaryPDF } from "../utils/pdfExport";
import { calculateWorkingDaysExcludingHolidays } from "@/utils/frenchHolidays";

export const useSalaryElementsExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleSalaryElementsExport = async (selectedMonth: string, exportPDF: boolean = false) => {
    setIsExporting(true);
    const startDate = startOfMonth(new Date(selectedMonth));
    const endDate = endOfMonth(new Date(selectedMonth));
    const formattedMonth = format(startDate, 'MMMM yyyy', { locale: fr });
    const monthYear = format(startDate, 'MM-yyyy');

    try {
      // Fetch all required data in parallel
      const [employeesResult, absencesResult, delaysResult, overtimesResult, timeRecordsResult] = await Promise.all([
        supabase.from('employees').select('id, first_name, last_name, email, position').order('last_name'),
        supabase.from('leave_requests')
          .select('id, employee_id, start_date, end_date, type, day_type, period, employees (first_name, last_name)')
          .gte('start_date', format(startDate, 'yyyy-MM-dd'))
          .lte('end_date', format(endDate, 'yyyy-MM-dd'))
          .eq('status', 'approved'),
        supabase.from('delays')
          .select('id, employee_id, date, scheduled_time, actual_time, duration, employees (first_name, last_name)')
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .eq('status', 'approved'),
        supabase.from('overtime_requests')
          .select('id, employee_id, date, start_time, end_time, hours, employees (first_name, last_name)')
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .eq('status', 'approved'),
        supabase.from('time_records')
          .select('id, employee_id, date, morning_in, evening_out')
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (absencesResult.error) throw absencesResult.error;
      if (delaysResult.error) throw delaysResult.error;
      if (overtimesResult.error) throw overtimesResult.error;

      const employees = employeesResult.data || [];
      const absences = absencesResult.data || [];
      const delays = delaysResult.data || [];
      const overtimes = overtimesResult.data || [];
      const timeRecords = timeRecordsResult.data || [];

      if (!employees.length) {
        toast.warning("Aucun employé trouvé");
        setIsExporting(false);
        return;
      }

      // Calcul des jours ouvrés avec exclusion des jours fériés
      const { workingDays, holidays } = getWorkingDaysInMonth(startDate.getFullYear(), startDate.getMonth());

      const wb = XLSX.utils.book_new();
      wb.Props = {
        Title: `Éléments de salaires ${formattedMonth}`,
        Subject: "Données pour le comptable",
        Author: "HR Portal",
        CreatedDate: new Date()
      };

      // Calculer les données par employé
      const employeeSummaries: EmployeeSummary[] = employees.map(employee => {
        const employeeAbsences = absences.filter(a => a.employee_id === employee.id);
        let totalAbsenceDays = 0;
        
        employeeAbsences.forEach(absence => {
          const absenceStartDate = new Date(absence.start_date);
          const absenceEndDate = new Date(absence.end_date);
          
          // Utiliser la nouvelle fonction avec jours fériés
          let absenceDays = calculateWorkingDaysExcludingHolidays(
            absenceStartDate > startDate ? absenceStartDate : startDate,
            absenceEndDate < endDate ? absenceEndDate : endDate
          );
          
          if (absence.day_type === 'half') {
            absenceDays = absenceDays / 2;
          }
          
          totalAbsenceDays += absenceDays;
        });

        const employeeDelays = delays.filter(d => d.employee_id === employee.id);
        let totalDelayMinutes = 0;
        
        employeeDelays.forEach(delay => {
          if (delay.duration) {
            const durationParts = String(delay.duration).split(':');
            if (durationParts.length >= 2) {
              const hours = parseInt(durationParts[0], 10);
              const minutes = parseInt(durationParts[1], 10);
              totalDelayMinutes += (hours * 60) + minutes;
            }
          }
        });

        const employeeOvertimes = overtimes.filter(o => o.employee_id === employee.id);
        let totalOvertimeHours = 0;
        
        employeeOvertimes.forEach(overtime => {
          totalOvertimeHours += parseFloat(String(overtime.hours));
        });

        const ticketsRestaurant = Math.max(0, workingDays - Math.ceil(totalAbsenceDays));
        const employeeTimeRecords = timeRecords.filter(t => t.employee_id === employee.id);
        const incompleteRecords = employeeTimeRecords.filter(t => !t.morning_in || !t.evening_out);

        return {
          id: employee.id,
          name: `${employee.first_name} ${employee.last_name}`,
          position: employee.position,
          workingDays,
          absenceDays: totalAbsenceDays,
          workedDays: workingDays - totalAbsenceDays,
          mealVouchers: ticketsRestaurant,
          delayMinutes: totalDelayMinutes,
          delayCount: employeeDelays.length,
          overtimeHours: totalOvertimeHours,
          overtimeCount: employeeOvertimes.length,
          hasIncompleteTimeRecords: incompleteRecords.length > 0,
          missingJustifications: 0
        };
      });

      // Générer les alertes de validation
      const alerts = generateValidationAlerts(employees, absences, delays, overtimes, timeRecords, workingDays);
      const totals = calculateTotals(employeeSummaries);

      // Créer le rapport de validation
      const validationReport: ValidationReport = {
        generatedAt: new Date(),
        generatedBy: "HR Portal",
        period: formattedMonth,
        workingDaysInMonth: workingDays,
        holidaysInMonth: holidays,
        alerts,
        totals,
        employeeSummaries
      };

      // ===== FEUILLE 1: CONTRÔLE =====
      const controlData = formatControlSheetData(validationReport);
      const controlSheet = XLSX.utils.json_to_sheet(controlData);
      controlSheet['!cols'] = [
        { wch: 35 },
        { wch: 25 },
        { wch: 40 }
      ];
      XLSX.utils.book_append_sheet(wb, controlSheet, "🔍 Contrôle");

      // ===== FEUILLE 2: RÉSUMÉ =====
      const summaryData = employeeSummaries.map(emp => ({
        "Nom": emp.name.split(' ').slice(1).join(' '),
        "Prénom": emp.name.split(' ')[0],
        "Poste": emp.position || 'N/A',
        "Jours ouvrés du mois": emp.workingDays,
        "Jours fériés exclus": holidays,
        "Jours d'absence": emp.absenceDays,
        "Jours travaillés": emp.workedDays,
        "Titres restaurant": emp.mealVouchers,
        "Retards cumulés (minutes)": emp.delayMinutes,
        "Heures supplémentaires": emp.overtimeHours
      }));

      if (summaryData.length > 0) {
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        const summaryColWidths = Object.keys(summaryData[0]).map(key => ({
          wch: Math.max(key.length + 2, ...summaryData.map(row => String(row[key as keyof typeof row] || '').length + 2))
        }));
        summarySheet['!cols'] = summaryColWidths;
        applyExcelStyling(summarySheet, summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, "Résumé");
      }

      // ===== FEUILLE 3: ABSENCES =====
      if (absences.length > 0) {
        const absenceData = absences.map(absence => ({
          "Nom": absence.employees?.last_name || 'N/A',
          "Prénom": absence.employees?.first_name || 'N/A',
          "Date de début": format(parseISO(absence.start_date), 'dd/MM/yyyy'),
          "Date de fin": format(parseISO(absence.end_date), 'dd/MM/yyyy'),
          "Type d'absence": leaveTypeTranslations[absence.type] || absence.type,
          "Journée/Demi-journée": absence.day_type === 'full' ? 'Journée complète' : 
                                (absence.period === 'morning' ? 'Matin' : 'Après-midi')
        }));

        const absenceSheet = XLSX.utils.json_to_sheet(absenceData);
        const absenceColWidths = Object.keys(absenceData[0]).map(key => ({
          wch: Math.max(key.length + 2, ...absenceData.map(row => String(row[key as keyof typeof row] || '').length + 2))
        }));
        absenceSheet['!cols'] = absenceColWidths;
        applyExcelStyling(absenceSheet, absenceData);
        XLSX.utils.book_append_sheet(wb, absenceSheet, "Absences");
      }

      // ===== FEUILLE 4: RETARDS =====
      if (delays.length > 0) {
        const delayData = delays.map(delay => ({
          "Nom": delay.employees?.last_name || 'N/A',
          "Prénom": delay.employees?.first_name || 'N/A',
          "Date": format(parseISO(delay.date), 'dd/MM/yyyy'),
          "Heure prévue": delay.scheduled_time,
          "Heure réelle": delay.actual_time,
          "Durée": delay.duration ? String(delay.duration).split('.')[0] : 'N/A'
        }));

        const delaySheet = XLSX.utils.json_to_sheet(delayData);
        const delayColWidths = Object.keys(delayData[0]).map(key => ({
          wch: Math.max(key.length + 2, ...delayData.map(row => String(row[key as keyof typeof row] || '').length + 2))
        }));
        delaySheet['!cols'] = delayColWidths;
        applyExcelStyling(delaySheet, delayData);
        XLSX.utils.book_append_sheet(wb, delaySheet, "Retards");
      }

      // ===== FEUILLE 5: HEURES SUPPLÉMENTAIRES =====
      if (overtimes.length > 0) {
        const overtimeData = overtimes.map(overtime => ({
          "Nom": overtime.employees?.last_name || 'N/A',
          "Prénom": overtime.employees?.first_name || 'N/A',
          "Date": format(parseISO(overtime.date), 'dd/MM/yyyy'),
          "Heure de début": overtime.start_time,
          "Heure de fin": overtime.end_time,
          "Heures": parseFloat(String(overtime.hours)).toFixed(2)
        }));

        const overtimeSheet = XLSX.utils.json_to_sheet(overtimeData);
        const overtimeColWidths = Object.keys(overtimeData[0]).map(key => ({
          wch: Math.max(key.length + 2, ...overtimeData.map(row => String(row[key as keyof typeof row] || '').length + 2))
        }));
        overtimeSheet['!cols'] = overtimeColWidths;
        applyExcelStyling(overtimeSheet, overtimeData);
        XLSX.utils.book_append_sheet(wb, overtimeSheet, "Heures supplémentaires");
      }

      // Sauvegarder l'Excel
      XLSX.writeFile(wb, `elements_salaires_${monthYear}.xlsx`);

      // Générer également le PDF si demandé
      if (exportPDF) {
        generateSalaryPDF(validationReport);
        toast.success(`Export Excel + PDF pour ${formattedMonth} effectué avec succès`);
      } else {
        toast.success(`Export des éléments de salaires pour ${formattedMonth} effectué avec succès`);
      }

      // Afficher un résumé des alertes
      if (alerts.length > 0) {
        const errorCount = alerts.filter(a => a.type === 'error').length;
        const warningCount = alerts.filter(a => a.type === 'warning').length;
        if (errorCount > 0) {
          toast.warning(`${errorCount} erreur(s) et ${warningCount} avertissement(s) détectés. Consultez l'onglet Contrôle.`);
        } else if (warningCount > 0) {
          toast.info(`${warningCount} point(s) d'attention. Consultez l'onglet Contrôle.`);
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'export des éléments de salaires:', error);
      toast.error("Une erreur est survenue lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  // Fonction pour exporter uniquement le PDF
  const handlePDFExport = async (selectedMonth: string) => {
    await handleSalaryElementsExport(selectedMonth, true);
  };

  return { isExporting, handleSalaryElementsExport, handlePDFExport };
};
