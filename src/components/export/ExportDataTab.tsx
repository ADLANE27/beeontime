
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ExportCard } from "./components/ExportCard";
import { MonthSelector } from "./components/MonthSelector";
import { useBasicExport, useTimeExport, useSalaryElementsExport } from "./hooks";

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
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
            <Download className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Exports de données</h2>
            <p className="text-sm text-muted-foreground">Téléchargez vos données au format Excel</p>
          </div>
        </div>

        <MonthSelector 
          value={selectedMonth} 
          onValueChange={handleMonthChange} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <ExportCard 
          title="📊 Éléments de salaires"
          description="Export consolidé pour comptable : jours ouvrés, absences, retards, tickets restaurant et heures supplémentaires de tous les employés"
          icon={<FileText className="h-6 w-6 text-blue-600" />}
          onClick={() => handleSalaryElementsExport(selectedMonth)}
          isExporting={isAnyExporting}
          variant="highlight"
        />

        <ExportCard 
          title="📅 Absences et congés"
          description="Liste détaillée des demandes de congés : dates, types, statuts et employés concernés"
          icon={<FileSpreadsheet className="h-5 w-5 text-purple-600" />}
          onClick={() => handleExport("absences", selectedMonth)}
          isExporting={isAnyExporting}
        />

        <ExportCard 
          title="⏰ Heures supplémentaires"
          description="Récapitulatif des heures supplémentaires validées avec dates et durées par employé"
          icon={<FileSpreadsheet className="h-5 w-5 text-green-600" />}
          onClick={() => handleExport("heures_supplementaires", selectedMonth)}
          isExporting={isAnyExporting}
        />

        <ExportCard 
          title="⚠️ Retards"
          description="Liste complète des retards enregistrés avec heures prévues et réelles, durée et statut"
          icon={<FileSpreadsheet className="h-5 w-5 text-orange-600" />}
          onClick={() => handleExport("retards", selectedMonth)}
          isExporting={isAnyExporting}
        />

        <ExportCard 
          title="🕐 Temps de travail"
          description="Pointages détaillés quotidiens : heures d'arrivée, départ, pauses et total par jour"
          icon={<FileSpreadsheet className="h-5 w-5 text-indigo-600" />}
          onClick={() => handleTimeExport(selectedMonth)}
          isExporting={isAnyExporting}
        />

        <ExportCard 
          title="👥 Liste des employés"
          description="Export complet des informations employés : coordonnées, contrats, soldes de congés"
          icon={<FileSpreadsheet className="h-5 w-5 text-teal-600" />}
          onClick={() => handleExport("employees", selectedMonth)}
          isExporting={isAnyExporting}
        />
      </div>

      <div className="glass-card p-6 rounded-xl">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          À propos des exports
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p><strong>Format:</strong> Tous les exports sont au format Excel (.xlsx) pour une compatibilité maximale</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p><strong>Période:</strong> Sélectionnez le mois souhaité pour filtrer les données exportées</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p><strong>Export comptable:</strong> L'export éléments de salaires regroupe toutes les données nécessaires pour la paie</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p><strong>Données en temps réel:</strong> Les exports reflètent l'état actuel de la base de données</p>
          </div>
        </div>
      </div>
    </div>
  );
};
