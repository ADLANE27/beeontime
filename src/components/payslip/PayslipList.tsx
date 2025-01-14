import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Payslip } from "@/types/hr";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const PayslipList = () => {
  const payslips: Payslip[] = [
    {
      id: 1,
      employeeId: 1,
      month: "Mars",
      year: 2024,
      fileUrl: "/payslips/mars-2024.pdf"
    }
  ];

  const importantDocuments = [
    {
      id: 1,
      title: "Règlement intérieur",
      type: "PDF",
      size: "500 KB",
      fileUrl: "/documents/reglement-interieur.pdf"
    },
    {
      id: 2,
      title: "Convention collective",
      type: "PDF",
      size: "1.2 MB",
      fileUrl: "/documents/convention-collective.pdf"
    },
    {
      id: 3,
      title: "Décisions employeur",
      type: "PDF",
      size: "300 KB",
      fileUrl: "/documents/decisions-employeur.pdf"
    }
  ];

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      toast.success(`Téléchargement de ${title} en cours...`);
      
      // Simulation du téléchargement
      // Dans un cas réel, vous feriez un appel API ici
      // const response = await fetch(fileUrl);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = title;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
    } catch (error) {
      toast.error("Erreur lors du téléchargement du document");
    }
  };

  return (
    <Tabs defaultValue="payslips" className="space-y-4">
      <TabsList>
        <TabsTrigger value="payslips">Bulletins de paie</TabsTrigger>
        <TabsTrigger value="documents">Documents importants</TabsTrigger>
      </TabsList>

      <TabsContent value="payslips">
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
                  onClick={() => handleDownload(payslip.fileUrl, `Bulletin ${payslip.month} ${payslip.year}`)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Documents importants</h2>
          <div className="space-y-4">
            {importantDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.type} - {doc.size}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownload(doc.fileUrl, doc.title)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};