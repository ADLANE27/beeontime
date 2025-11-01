
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
                last_name,
                position
              )
            `)
            .gte('start_date', format(startDate, 'yyyy-MM-dd'))
            .lte('start_date', format(endDate, 'yyyy-MM-dd'))
            .eq('status', 'approved')
            .order('start_date', { ascending: true });

          if (leaveError) throw leaveError;

          // Calculate exact number of working days
          const calculateWorkingDays = (start: string, end: string, dayType: string) => {
            const startDate = parseISO(start);
            const endDate = parseISO(end);
            let workingDays = 0;
            
            const current = new Date(startDate);
            while (current <= endDate) {
              const dayOfWeek = current.getDay();
              if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                workingDays++;
              }
              current.setDate(current.getDate() + 1);
            }
            
            return dayType === 'half' ? workingDays * 0.5 : workingDays;
          };

          data = leaveRequests.map(request => ({
            "Nom": request.employees?.last_name || 'N/A',
            "Prénom": request.employees?.first_name || 'N/A',
            "Poste": request.employees?.position || 'N/A',
            "Date de début": format(parseISO(request.start_date), 'dd/MM/yyyy'),
            "Date de fin": format(parseISO(request.end_date), 'dd/MM/yyyy'),
            "Type de congé": leaveTypeTranslations[request.type] || request.type,
            "Type de journée": request.day_type === 'full' ? 'Journée complète' : 'Demi-journée',
            "Période": request.period === 'morning' ? 'Matin' : request.period === 'afternoon' ? 'Après-midi' : 'N/A',
            "Nombre de jours ouvrés": calculateWorkingDays(request.start_date, request.end_date, request.day_type),
            "Statut": 'Approuvé',
            "Motif": request.reason || ''
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
            .eq('status', 'approved')
            .order('date', { ascending: true });

          if (overtimeError) throw overtimeError;

          data = overtimeRequests.map(request => ({
            "Nom": request.employees?.last_name || 'N/A',
            "Prénom": request.employees?.first_name || 'N/A',
            "Date": format(parseISO(request.date), 'dd/MM/yyyy'),
            "Jour": format(parseISO(request.date), 'EEEE', { locale: fr }),
            "Heure de début": request.start_time,
            "Heure de fin": request.end_time,
            "Durée (heures)": Number(request.hours).toFixed(2),
            "Statut": 'Approuvé',
            "Motif": request.reason || ''
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
            .lte('date', format(endDate, 'yyyy-MM-dd'))
            .order('date', { ascending: true });

          if (delaysError) throw delaysError;

          // Calculate delay duration in minutes more accurately
          const calculateDelayMinutes = (duration: any) => {
            if (!duration) return 'N/A';
            const durationStr = String(duration);
            const parts = durationStr.split(':');
            if (parts.length >= 2) {
              const hours = parseInt(parts[0]) || 0;
              const minutes = parseInt(parts[1]) || 0;
              return hours * 60 + minutes;
            }
            return 'N/A';
          };

          data = delays.map(delay => ({
            "Nom": delay.employees?.last_name || 'N/A',
            "Prénom": delay.employees?.first_name || 'N/A',
            "Date": format(parseISO(delay.date), 'dd/MM/yyyy'),
            "Jour": format(parseISO(delay.date), 'EEEE', { locale: fr }),
            "Heure prévue": delay.scheduled_time,
            "Heure réelle": delay.actual_time,
            "Retard (minutes)": calculateDelayMinutes(delay.duration),
            "Statut": delay.status === 'approved' ? 'Justifié' : delay.status === 'rejected' ? 'Non justifié' : 'En attente',
            "Motif": delay.reason || ''
          }));
          break;

        case "employees":
          const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select('*')
            .order('last_name', { ascending: true });

          if (employeesError) throw employeesError;

          data = employeesData.map(emp => ({
            "Nom": emp.last_name || 'N/A',
            "Prénom": emp.first_name || 'N/A',
            "Email": emp.email || 'N/A',
            "Téléphone": emp.phone || 'N/A',
            "Poste": emp.position || 'N/A',
            "Type de contrat": emp.contract_type || 'N/A',
            "Date d'embauche": emp.start_date ? format(parseISO(emp.start_date), 'dd/MM/yyyy') : 'N/A',
            "Date de naissance": emp.birth_date ? format(parseISO(emp.birth_date), 'dd/MM/yyyy') : 'N/A',
            "Ville": emp.city || 'N/A',
            "Congés année en cours": Number(emp.current_year_vacation_days || 0).toFixed(1),
            "Congés utilisés": Number(emp.current_year_used_days || 0).toFixed(1),
            "Congés restants": (Number(emp.current_year_vacation_days || 0) - Number(emp.current_year_used_days || 0)).toFixed(1),
            "Congés année précédente": Number(emp.previous_year_vacation_days || 0).toFixed(1),
            "Congés N-1 utilisés": Number(emp.previous_year_used_days || 0).toFixed(1)
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
