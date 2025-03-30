
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ExportCard } from "./components/ExportCard";
import { MonthSelector } from "./components/MonthSelector";
import { useBasicExport, useTimeExport, useSalaryElementsExport } from "./hooks/useExportHooks";

export const ExportDataTab = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const { isExporting: isBasicExporting, handleExport } = useBasicExport();
  const { isExporting: isTimeExporting, handleTimeExport } = useTimeExport();
  const { isExporting: isSalaryExporting, handleSalaryElementsExport } = useSalaryElementsExport();

  const isAnyExporting = isBasicExporting || isTimeExporting || isSalaryExporting;

  // Add handler that converts any number to string before setting state
  const handleMonthChange = (value: string | number) => {
    setSelectedMonth(String(value));
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <MonthSelector 
          value={selectedMonth} 
          onValueChange={handleMonthChange} 
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ExportCard 
            title="Éléments de salaires (pour comptable)"
            description="Export consolidé des jours ouvrés, absences, retards, tickets restaurant et heures supplémentaires pour tous les employés"
            icon={<FileText className="h-6 w-6 text-blue-500" />}
            onClick={() => handleSalaryElementsExport(selectedMonth)}
            isExporting={isAnyExporting}
            variant="highlight"
          />

          <ExportCard 
            title="Absences et congés"
            description="Export des absences et congés du mois"
            icon={<FileSpreadsheet className="h-5 w-5 text-muted-foreground" />}
            onClick={() => handleExport("absences", selectedMonth)}
            isExporting={isAnyExporting}
          />

          <ExportCard 
            title="Heures supplémentaires"
            description="Export des heures supplémentaires du mois"
            icon={<FileSpreadsheet className="h-5 w-5 text-muted-foreground" />}
            onClick={() => handleExport("heures_supplementaires", selectedMonth)}
            isExporting={isAnyExporting}
          />

          <ExportCard 
            title="Retards"
            description="Export des retards du mois"
            icon={<FileSpreadsheet className="h-5 w-5 text-muted-foreground" />}
            onClick={() => handleExport("retards", selectedMonth)}
            isExporting={isAnyExporting}
          />

          <ExportCard 
            title="Temps de travail"
            description="Export du temps de travail du mois"
            icon={<FileSpreadsheet className="h-5 w-5 text-muted-foreground" />}
            onClick={() => handleTimeExport(selectedMonth)}
            isExporting={isAnyExporting}
          />
        </div>
      </div>
    </Card>
  );
};
