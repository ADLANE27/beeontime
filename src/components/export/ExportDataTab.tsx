
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO, differenceInMinutes, subMonths, isWeekend, parse } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Label } from "@/components/ui/label";

// Ajout des traductions des types de congés
const leaveTypeTranslations: { [key: string]: string } = {
  "vacation": "Congés payés",
  "annual": "Congé annuel",
  "rtt": "RTT",
  "paternity": "Congé paternité",
  "maternity": "Congé maternité",
  "sickChild": "Congé enfant malade",
  "unpaidUnexcused": "Absence injustifiée non rémunérée",
  "unpaidExcused": "Absence justifiée non rémunérée",
  "unpaid": "Absence non rémunérée",
  "familyEvent": "Absences pour événements familiaux",
  "sickLeave": "Arrêt maladie"
};

// Fonction pour obtenir les 12 derniers mois
const getLastTwelveMonths = () => {
  const months = [];
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    months.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy', { locale: fr })
    });
  }
  return months;
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${String(remainingMinutes).padStart(2, '0')}`;
};

// Fonction pour calculer le nombre de jours ouvrés dans un mois
const calculateWorkingDays = (startDate: Date, endDate: Date) => {
  let workingDays = 0;
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Si ce n'est pas un weekend (0 = dimanche, 6 = samedi)
    if (!isWeekend(currentDate)) {
      workingDays++;
    }
    
    // Passer au jour suivant
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
};

export const ExportDataTab = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: string) => {
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

      // Création du workbook Excel avec style
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajustement automatique de la largeur des colonnes
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(
          key.length,
          ...data.map(row => String(row[key]).length)
        )
      }));
      ws['!cols'] = colWidths;

      // Ajout de la feuille au workbook
      XLSX.utils.book_append_sheet(wb, ws, `Données ${type}`);

      // Génération et téléchargement du fichier
      XLSX.writeFile(wb, `export_${type}_${formattedMonth}.xlsx`);
      
      toast.success(`Export des ${type} pour ${formattedMonth} effectué avec succès`);
    } catch (error) {
      console.error(`Erreur lors de l'export des ${type}:`, error);
      toast.error("Une erreur est survenue lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const handleTimeExport = async () => {
    setIsExporting(true);
    const startDate = startOfMonth(new Date(selectedMonth));
    const endDate = endOfMonth(new Date(selectedMonth));
    const formattedMonth = format(startDate, 'MMMM yyyy', { locale: fr });

    try {
      // Récupérer tous les employés
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, work_schedule');

      if (employeesError) throw employeesError;

      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new();

      // Pour chaque employé
      for (const employee of employees) {
        // Récupérer les pointages du mois pour cet employé
        const { data: timeRecords, error: timeError } = await supabase
          .from('time_records')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .order('date');

        if (timeError) throw timeError;

        // Préparer les données pour l'export
        const data = timeRecords.map(record => {
          let totalHours = "Pointage incomplet";
          
          if (record.morning_in && record.evening_out) {
            const startTime = parseISO(`2000-01-01T${record.morning_in}`);
            const endTime = parseISO(`2000-01-01T${record.evening_out}`);
            
            // Calculer la pause déjeuner si elle est renseignée
            let breakDuration = 60; // Pause standard d'1h par défaut
            if (record.lunch_out && record.lunch_in) {
              const breakStart = parseISO(`2000-01-01T${record.lunch_out}`);
              const breakEnd = parseISO(`2000-01-01T${record.lunch_in}`);
              breakDuration = differenceInMinutes(breakEnd, breakStart);
            }
            
            // Calculer le temps total en minutes puis convertir en format "XhYY"
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

        // Créer une feuille pour l'employé
        const ws = XLSX.utils.json_to_sheet(data);

        // Ajuster la largeur des colonnes
        const colWidths = Object.keys(data[0] || {}).map(key => ({
          wch: Math.max(
            key.length,
            ...data.map(row => String(row[key]).length)
          )
        }));
        ws['!cols'] = colWidths;

        // Ajouter la feuille au workbook
        XLSX.utils.book_append_sheet(wb, ws, `${employee.first_name} ${employee.last_name}`);
      }

      // Générer et télécharger le fichier
      XLSX.writeFile(wb, `temps_travail_${formattedMonth}.xlsx`);
      toast.success(`Export du temps de travail pour ${formattedMonth} effectué avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export du temps de travail:', error);
      toast.error("Une erreur est survenue lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  // Nouvelle fonction pour exporter les éléments de salaires
  const handleSalaryElementsExport = async () => {
    setIsExporting(true);
    const startDate = startOfMonth(new Date(selectedMonth));
    const endDate = endOfMonth(new Date(selectedMonth));
    const formattedMonth = format(startDate, 'MMMM yyyy', { locale: fr });
    const monthYear = format(startDate, 'MM-yyyy');

    try {
      // Récupérer tous les employés
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

      // Récupérer les absences approuvées
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

      // Récupérer les retards
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

      // Récupérer les heures supplémentaires
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

      // Calculer le nombre de jours ouvrés dans le mois
      const workingDays = calculateWorkingDays(startDate, endDate);

      // Créer un nouveau workbook Excel
      const wb = XLSX.utils.book_new();

      // Feuille de résumé par employé
      const summaryData = employees.map(employee => {
        // Calculer les absences pour cet employé
        const employeeAbsences = absences?.filter(a => a.employee_id === employee.id) || [];
        let totalAbsenceDays = 0;
        
        employeeAbsences.forEach(absence => {
          const absenceStartDate = new Date(absence.start_date);
          const absenceEndDate = new Date(absence.end_date);
          
          // Calculer les jours ouvrés pour chaque absence
          let absenceDays = calculateWorkingDays(
            absenceStartDate > startDate ? absenceStartDate : startDate,
            absenceEndDate < endDate ? absenceEndDate : endDate
          );
          
          // Ajuster pour les demi-journées
          if (absence.day_type === 'half') {
            absenceDays = absenceDays / 2;
          }
          
          totalAbsenceDays += absenceDays;
        });

        // Calculer les retards pour cet employé
        const employeeDelays = delays?.filter(d => d.employee_id === employee.id) || [];
        let totalDelayMinutes = 0;
        
        employeeDelays.forEach(delay => {
          if (delay.duration) {
            // Convertir le format interval PostgreSQL (HH:MM:SS) en minutes
            const durationParts = String(delay.duration).split(':');
            if (durationParts.length >= 2) {
              const hours = parseInt(durationParts[0], 10);
              const minutes = parseInt(durationParts[1], 10);
              totalDelayMinutes += (hours * 60) + minutes;
            }
          }
        });

        // Calculer les heures supplémentaires pour cet employé
        const employeeOvertimes = overtimes?.filter(o => o.employee_id === employee.id) || [];
        let totalOvertimeHours = 0;
        
        employeeOvertimes.forEach(overtime => {
          totalOvertimeHours += parseFloat(overtime.hours);
        });

        return {
          "Nom": employee.last_name,
          "Prénom": employee.first_name,
          "Email": employee.email,
          "Jours ouvrés du mois": workingDays,
          "Jours d'absence": totalAbsenceDays.toFixed(1),
          "Jours travaillés": (workingDays - totalAbsenceDays).toFixed(1),
          "Retards cumulés (minutes)": totalDelayMinutes,
          "Heures supplémentaires": totalOvertimeHours.toFixed(2)
        };
      });

      if (summaryData.length > 0) {
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        
        // Ajuster la largeur des colonnes
        const summaryColWidths = Object.keys(summaryData[0]).map(key => ({
          wch: Math.max(
            key.length,
            ...summaryData.map(row => String(row[key]).length)
          )
        }));
        summarySheet['!cols'] = summaryColWidths;
        
        // Ajouter la feuille au workbook
        XLSX.utils.book_append_sheet(wb, summarySheet, "Résumé");
      }

      // Feuille détaillée des absences
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
        
        // Ajuster la largeur des colonnes
        const absenceColWidths = Object.keys(absenceData[0]).map(key => ({
          wch: Math.max(
            key.length,
            ...absenceData.map(row => String(row[key]).length)
          )
        }));
        absenceSheet['!cols'] = absenceColWidths;
        
        // Ajouter la feuille au workbook
        XLSX.utils.book_append_sheet(wb, absenceSheet, "Absences");
      }

      // Feuille détaillée des retards
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
        
        // Ajuster la largeur des colonnes
        const delayColWidths = Object.keys(delayData[0]).map(key => ({
          wch: Math.max(
            key.length,
            ...delayData.map(row => String(row[key]).length)
          )
        }));
        delaySheet['!cols'] = delayColWidths;
        
        // Ajouter la feuille au workbook
        XLSX.utils.book_append_sheet(wb, delaySheet, "Retards");
      }

      // Feuille détaillée des heures supplémentaires
      if (overtimes && overtimes.length > 0) {
        const overtimeData = overtimes.map(overtime => ({
          "Nom": overtime.employees?.last_name || 'N/A',
          "Prénom": overtime.employees?.first_name || 'N/A',
          "Date": format(parseISO(overtime.date), 'dd/MM/yyyy'),
          "Heure de début": overtime.start_time,
          "Heure de fin": overtime.end_time,
          "Heures": parseFloat(overtime.hours).toFixed(2)
        }));

        const overtimeSheet = XLSX.utils.json_to_sheet(overtimeData);
        
        // Ajuster la largeur des colonnes
        const overtimeColWidths = Object.keys(overtimeData[0]).map(key => ({
          wch: Math.max(
            key.length,
            ...overtimeData.map(row => String(row[key]).length)
          )
        }));
        overtimeSheet['!cols'] = overtimeColWidths;
        
        // Ajouter la feuille au workbook
        XLSX.utils.book_append_sheet(wb, overtimeSheet, "Heures supplémentaires");
      }

      // Générer et télécharger le fichier
      XLSX.writeFile(wb, `elements_salaires_${monthYear}.xlsx`);
      toast.success(`Export des éléments de salaires pour ${formattedMonth} effectué avec succès`);
    } catch (error) {
      console.error('Erreur lors de l\'export des éléments de salaires:', error);
      toast.error("Une erreur est survenue lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-64">
            <Label>Période</Label>
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un mois" />
              </SelectTrigger>
              <SelectContent>
                {getLastTwelveMonths().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nouveau bloc pour l'export des éléments de salaires */}
          <Card className="p-4 hover:bg-accent/50 transition-colors col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-blue-700">Éléments de salaires (pour comptable)</h3>
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                Export consolidé des jours ouvrés, absences, retards et heures supplémentaires pour tous les employés
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleSalaryElementsExport}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter les éléments de salaires
              </Button>
            </div>
          </Card>

          <Card className="p-4 hover:bg-accent/50 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Absences et congés</h3>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Export des absences et congés du mois</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleExport("absences")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </Card>

          <Card className="p-4 hover:bg-accent/50 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Heures supplémentaires</h3>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Export des heures supplémentaires du mois</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleExport("heures_supplementaires")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </Card>

          <Card className="p-4 hover:bg-accent/50 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Retards</h3>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Export des retards du mois</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => handleExport("retards")}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </Card>

          <Card className="p-4 hover:bg-accent/50 transition-colors">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Temps de travail</h3>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Export du temps de travail du mois</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleTimeExport}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
};
