
import { useState } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calculateWorkingDays, leaveTypeTranslations, applyExcelStyling } from "../utils/exportHelpers";

export const useSalaryElementsExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleSalaryElementsExport = async (selectedMonth: string) => {
    setIsExporting(true);
    const startDate = startOfMonth(new Date(selectedMonth));
    const endDate = endOfMonth(new Date(selectedMonth));
    const formattedMonth = format(startDate, 'MMMM yyyy', { locale: fr });
    const monthYear = format(startDate, 'MM-yyyy');

    try {
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email')
        .order('last_name');

      if (employeesError) throw employeesError;
      if (!employees?.length) {
        toast.warning("Aucun employé trouvé");
        setIsExporting(false);
        return;
      }

      const { data: absences, error: absencesError } = await supabase
        .from('leave_requests')
        .select(`
          id, employee_id, start_date, end_date, type, day_type, period,
          employees (first_name, last_name)
        `)
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('end_date', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'approved');

      if (absencesError) throw absencesError;

      const { data: delays, error: delaysError } = await supabase
        .from('delays')
        .select(`
          id, employee_id, date, scheduled_time, actual_time, duration,
          employees (first_name, last_name)
        `)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'approved');

      if (delaysError) throw delaysError;

      const { data: overtimes, error: overtimesError } = await supabase
        .from('overtime_requests')
        .select(`
          id, employee_id, date, start_time, end_time, hours,
          employees (first_name, last_name)
        `)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .eq('status', 'approved');

      if (overtimesError) throw overtimesError;

      const workingDays = calculateWorkingDays(startDate, endDate);

      const wb = XLSX.utils.book_new();

      wb.Props = {
        Title: `Éléments de salaires ${formattedMonth}`,
        Subject: "Données pour le comptable",
        Author: "HR Portal",
        CreatedDate: new Date()
      };

      const summaryData = employees.map(employee => {
        const employeeAbsences = absences?.filter(a => a.employee_id === employee.id) || [];
        let totalAbsenceDays = 0;
        
        employeeAbsences.forEach(absence => {
          const absenceStartDate = new Date(absence.start_date);
          const absenceEndDate = new Date(absence.end_date);
          
          let absenceDays = calculateWorkingDays(
            absenceStartDate > startDate ? absenceStartDate : startDate,
            absenceEndDate < endDate ? absenceEndDate : endDate
          );
          
          if (absence.day_type === 'half') {
            absenceDays = absenceDays / 2;
          }
          
          totalAbsenceDays += absenceDays;
        });

        const employeeDelays = delays?.filter(d => d.employee_id === employee.id) || [];
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

        const employeeOvertimes = overtimes?.filter(o => o.employee_id === employee.id) || [];
        let totalOvertimeHours = 0;
        
        employeeOvertimes.forEach(overtime => {
          totalOvertimeHours += parseFloat(String(overtime.hours));
        });

        const ticketsRestaurant = Math.max(0, workingDays - Math.ceil(totalAbsenceDays));

        return {
          "Nom": employee.last_name,
          "Prénom": employee.first_name,
          "Email": employee.email,
          "Jours ouvrés du mois": workingDays,
          "Jours d'absence": totalAbsenceDays,
          "Jours travaillés": workingDays - totalAbsenceDays,
          "Titres restaurant": ticketsRestaurant,
          "Retards cumulés (minutes)": totalDelayMinutes,
          "Heures supplémentaires": totalOvertimeHours
        };
      });

      if (summaryData.length > 0) {
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        
        const summaryColWidths = Object.keys(summaryData[0]).map(key => ({
          wch: Math.max(
            key.length + 2,
            ...summaryData.map(row => {
              // Convert any value to string safely before getting length
              return String(row[key] || '').length + 2;
            })
          )
        }));
        summarySheet['!cols'] = summaryColWidths;

        applyExcelStyling(summarySheet, summaryData);
        
        XLSX.utils.book_append_sheet(wb, summarySheet, "Résumé");
      }

      if (absences && absences.length > 0) {
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
          wch: Math.max(
            key.length + 2,
            ...absenceData.map(row => {
              // Convert any value to string safely before getting length
              return String(row[key] || '').length + 2;
            })
          )
        }));
        absenceSheet['!cols'] = absenceColWidths;
        
        applyExcelStyling(absenceSheet, absenceData);
        
        XLSX.utils.book_append_sheet(wb, absenceSheet, "Absences");
      }

      if (delays && delays.length > 0) {
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
          wch: Math.max(
            key.length + 2,
            ...delayData.map(row => {
              // Convert any value to string safely before getting length
              return String(row[key] || '').length + 2;
            })
          )
        }));
        delaySheet['!cols'] = delayColWidths;
        
        applyExcelStyling(delaySheet, delayData);
        
        XLSX.utils.book_append_sheet(wb, delaySheet, "Retards");
      }

      if (overtimes && overtimes.length > 0) {
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
          wch: Math.max(
            key.length + 2,
            ...overtimeData.map(row => {
              // Convert any value to string safely before getting length
              return String(row[key] || '').length + 2;
            })
          )
        }));
        overtimeSheet['!cols'] = overtimeColWidths;
        
        applyExcelStyling(overtimeSheet, overtimeData);
        
        XLSX.utils.book_append_sheet(wb, overtimeSheet, "Heures supplémentaires");
      }

      XLSX.writeFile(wb, `elements_salaires_${monthYear}.xlsx`);
      toast.success(`Export des éléments de salaires pour ${formattedMonth} effectué avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export des éléments de salaires:', error);
      toast.error("Une erreur est survenue lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, handleSalaryElementsExport };
};
