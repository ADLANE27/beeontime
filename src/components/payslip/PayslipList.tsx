import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Payslip } from "@/types/hr";
import { toast } from "sonner";

export const PayslipList = () => {
  // Exemple de données
  const payslips: Payslip[] = [
    {
      id: 1,
      employeeId: 1,
      month: "Mars",
      year: 2024,
      fileUrl: "/payslips/mars-2024.pdf"
    }
  ];

  const handleDownload = async (payslip: Payslip) => {
    try {
      // Simulation du téléchargement
      toast.success(`Téléchargement du bulletin de paie ${payslip.month} ${payslip.year} en cours...`);
      
      // Dans un cas réel, vous feriez un appel API ici pour obtenir le fichier
      // const response = await fetch(payslip.fileUrl);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `bulletin-${payslip.month}-${payslip.year}.pdf`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
    } catch (error) {
      toast.error("Erreur lors du téléchargement du bulletin de paie");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Bulletins de paie</h2>
      <div className="space-y-4">
        {payslips.map((payslip) => (
          <div
            key={payslip.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div>
              <p className="font-semibold">
                {payslip.month} {payslip.year}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDownload(payslip)}
            >
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};