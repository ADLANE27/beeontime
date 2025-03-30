
import { useState } from "react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { leaveTypeTranslations, applyExcelStyling } from "../utils/exportHelpers";

export const useBasicExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: string, selectedMonth: string) => {
    setIsExporting(true);
    const startDate = startOfMonth(new Date(selectedMonth));
    const endDate = endOfMonth(new Date(selectedMonth));
    const formattedMonth = format(startDate, 'MMMM yyyy', { locale: fr });
    
    try {
      let data = [];
      
      switch(type) {
        case "absences":
          const { data: leaveRequests, error: leaveError } = await supabase
            .from('leave_requests')
            .select(`
              *,
              employees (
                first_name,
                last_name
              )
            `)
            .gte('start_date', format(startDate, 'yyyy-MM-dd'))
            .lte('end_date', format(endDate, 'yyyy-MM-dd'))
            .eq('status', 'approved');

          if (leaveError) throw leaveError;

          data = leaveRequests.map(request => ({
            "Nom": request.employees?.last_name || 'N/A',
            "Prénom": request.employees?.first_name || 'N/A',
            "Date de début": format(parseISO(request.start_date), 'dd/MM/yyyy'),
            "Date de fin": format(parseISO(request.end_date), 'dd/MM/yyyy'),
            "Type de congé": leaveTypeTranslations[request.type] || request.type,
            "Nombre de jours": request.day_type === 'full' ? 1 : 0.5
          }));
          break;

        case "heures_supplementaires":
          const { data: overtimeRequests, error: overtimeError } = await supabase
            .from('overtime_requests')
            .select(`
              *,
              employees (
                first_name,
                last_name
              )
            `)
            .gte('date', format(startDate, 'yyyy-MM-dd'))
            .lte('date', format(endDate, 'yyyy-MM-dd'))
            .eq('status', 'approved');

          if (overtimeError) throw overtimeError;

          data = overtimeRequests.map(request => ({
            "Nom": request.employees?.last_name || 'N/A',
            "Prénom": request.employees?.first_name || 'N/A',
            "Date": format(parseISO(request.date), 'dd/MM/yyyy'),
            "Heure de début": request.start_time,
            "Heure de fin": request.end_time,
            "Durée (heures)": Number(request.hours).toFixed(2)
          }));
          break;

        case "retards":
          const { data: delays, error: delaysError } = await supabase
            .from('delays')
            .select(`
              *,
              employees (
                first_name,
                last_name
              )
            `)
            .gte('date', format(startDate, 'yyyy-MM-dd'))
            .lte('date', format(endDate, 'yyyy-MM-dd'));

          if (delaysError) throw delaysError;

          data = delays.map(delay => ({
            "Nom": delay.employees?.last_name || 'N/A',
            "Prénom": delay.employees?.first_name || 'N/A',
            "Date": format(parseISO(delay.date), 'dd/MM/yyyy'),
            "Heure prévue": delay.scheduled_time,
            "Heure réelle": delay.actual_time,
            "Durée du retard": delay.duration ? String(delay.duration).split('.')[0] : 'N/A'
          }));
          break;
      }

      if (data.length === 0) {
        toast.warning("Aucune donnée disponible pour cette période");
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(
          key.length,
          ...data.map(row => String(row[key]).length)
        )
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, `Données ${type}`);

      XLSX.writeFile(wb, `export_${type}_${formattedMonth}.xlsx`);
      
      toast.success(`Export des ${type} pour ${formattedMonth} effectué avec succès`);
    } catch (error) {
      console.error(`Erreur lors de l'export des ${type}:`, error);
      toast.error("Une erreur est survenue lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, handleExport };
};
