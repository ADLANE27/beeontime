import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, parseISO, differenceInMinutes, subMonths } from "date-fns";
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
  "familyEvent": "Absences pour événements familiaux"
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

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Export des données</h2>
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
