import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from 'xlsx';

export const ExportDataTab = () => {
  const handleExport = (type: string) => {
    const currentDate = format(new Date(), 'MMMM yyyy', { locale: fr });
    
    // Exemple de données (à remplacer par vos vraies données)
    const mockData = [
      {
        nom: "Dupont",
        prenom: "Jean",
        poste: "Traducteur",
        joursPresence: 20,
        heuresSupp: 5,
        congesPris: 2,
        retards: 0
      },
      {
        nom: "Martin",
        prenom: "Marie",
        poste: "Traductrice",
        joursPresence: 22,
        heuresSupp: 3,
        congesPris: 0,
        retards: 1
      }
    ];

    // Création du workbook Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(mockData);

    // Ajout de la feuille au workbook
    XLSX.utils.book_append_sheet(wb, ws, `Données ${type}`);

    // Génération et téléchargement du fichier
    XLSX.writeFile(wb, `export_${type}_${currentDate}.xlsx`);
    
    toast.success(`Export des ${type} pour ${currentDate} effectué avec succès`);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Export des données</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleExport("absences")}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Absences et congés</h3>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Export des absences et congés du mois</p>
              <Button variant="outline" className="w-full" onClick={() => handleExport("absences")}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </Card>

          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleExport("heures_supplementaires")}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Heures supplémentaires</h3>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Export des heures supplémentaires du mois</p>
              <Button variant="outline" className="w-full" onClick={() => handleExport("heures_supplementaires")}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </Card>

          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleExport("pointages")}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Pointages</h3>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Relevé des pointages journaliers</p>
              <Button variant="outline" className="w-full" onClick={() => handleExport("pointages")}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </Card>

          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleExport("jours_travailles")}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Jours travaillés</h3>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nombre de jours travaillés par employé</p>
              <Button variant="outline" className="w-full" onClick={() => handleExport("jours_travailles")}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </Card>

          <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleExport("synthese_mensuelle")}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Synthèse mensuelle</h3>
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Rapport complet mensuel par employé</p>
              <Button variant="outline" className="w-full" onClick={() => handleExport("synthese_mensuelle")}>
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