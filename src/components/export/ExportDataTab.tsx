
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, FileText, Download, FileDown } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ExportCard } from "./components/ExportCard";
import { MonthSelector } from "./components/MonthSelector";
import { useBasicExport, useTimeExport, useSalaryElementsExport } from "./hooks";
import { Button } from "@/components/ui/button";

export const ExportDataTab = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const { isExporting: isBasicExporting, handleExport } = useBasicExport();
  const { isExporting: isTimeExporting, handleTimeExport } = useTimeExport();
  const { isExporting: isSalaryExporting, handleSalaryElementsExport, handlePDFExport } = useSalaryElementsExport();

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
            <p className="text-sm text-muted-foreground">Téléchargez vos données au format Excel ou PDF</p>
          </div>
        </div>

        <MonthSelector 
          value={selectedMonth} 
          onValueChange={handleMonthChange} 
        />
      </div>

      {/* Export principal pour comptable avec options */}
      <div className="glass-card p-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold flex items-center gap-2">
              📊 Éléments de salaires
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Recommandé
              </span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Export consolidé pour comptable avec feuille de contrôle, calcul des jours fériés, titres restaurant et alertes automatiques
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleSalaryElementsExport(selectedMonth, false)}
            disabled={isAnyExporting}
            className="flex-1 min-w-[200px]"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {isSalaryExporting ? "Export en cours..." : "Exporter Excel"}
          </Button>
          <Button
            onClick={() => handlePDFExport(selectedMonth)}
            disabled={isAnyExporting}
            variant="secondary"
            className="flex-1 min-w-[200px]"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isSalaryExporting ? "Export en cours..." : "Excel + PDF récapitulatif"}
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Nouveautés :</strong> Exclusion automatique des jours fériés français • Feuille de contrôle avec alertes • PDF résumé pour le comptable
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            <p><strong>Format:</strong> Excel (.xlsx) avec mise en forme professionnelle + PDF récapitulatif optionnel</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p><strong>Jours fériés:</strong> Les jours fériés français sont automatiquement exclus du calcul des jours ouvrés</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p><strong>Contrôle:</strong> L'onglet "Contrôle" affiche les totaux, alertes et incohérences à vérifier</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            <p><strong>PDF:</strong> Résumé visuel 1 page idéal pour transmettre au comptable</p>
          </div>
        </div>
      </div>
    </div>
  );
};
