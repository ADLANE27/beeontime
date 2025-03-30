
import { useState } from "react";
import { format, startOfMonth, endOfMonth, parseISO, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDuration } from "../utils/exportHelpers";

export const useTimeExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleTimeExport = async (selectedMonth: string) => {
    setIsExporting(true);
    const startDate = startOfMonth(new Date(selectedMonth));
    const endDate = endOfMonth(new Date(selectedMonth));
    const formattedMonth = format(startDate, 'MMMM yyyy', { locale: fr });

    try {
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, work_schedule');

      if (employeesError) throw employeesError;

      const wb = XLSX.utils.book_new();

      for (const employee of employees) {
        const { data: timeRecords, error: timeError } = await supabase
          .from('time_records')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .order('date');

        if (timeError) throw timeError;

        const data = timeRecords.map(record => {
          let totalHours = "Pointage incomplet";
          
          if (record.morning_in && record.evening_out) {
            const startTime = parseISO(`2000-01-01T${record.morning_in}`);
            const endTime = parseISO(`2000-01-01T${record.evening_out}`);
            
            let breakDuration = 60;
            if (record.lunch_out && record.lunch_in) {
              const breakStart = parseISO(`2000-01-01T${record.lunch_out}`);
              const breakEnd = parseISO(`2000-01-01T${record.lunch_in}`);
              breakDuration = differenceInMinutes(breakEnd, breakStart);
            }
            
            const totalMinutes = differenceInMinutes(endTime, startTime) - breakDuration;
            totalHours = formatDuration(totalMinutes);
          }

          return {
            "Date": format(parseISO(record.date), 'dd/MM/yyyy'),
            "Heure d'arrivée": record.morning_in || 'Non pointé',
            "Départ pause déjeuner": record.lunch_out || 'Non pointé',
            "Retour pause déjeuner": record.lunch_in || 'Non pointé',
            "Heure de départ": record.evening_out || 'Non pointé',
            "Total heures travaillées": totalHours
          };
        });

        const ws = XLSX.utils.json_to_sheet(data);

        const colWidths = Object.keys(data[0] || {}).map(key => ({
          wch: Math.max(
            key.length,
            ...data.map(row => String(row[key]).length)
          )
        }));
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, `${employee.first_name} ${employee.last_name}`);
      }

      XLSX.writeFile(wb, `temps_travail_${formattedMonth}.xlsx`);
      toast.success(`Export du temps de travail pour ${formattedMonth} effectué avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export du temps de travail:', error);
      toast.error("Une erreur est survenue lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, handleTimeExport };
};
