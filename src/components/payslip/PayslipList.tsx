import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Payslip } from "@/types/hr";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const PayslipList = () => {
  const payslips: Payslip[] = [];
  const importantDocuments = [];

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      toast.success(`Téléchargement de ${title} en cours...`);
      // Real download logic will be implemented here
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
            {payslips.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun bulletin de paie disponible
              </p>
            ) : (
              payslips.map((payslip) => (
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
              ))
            )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Documents importants</h2>
          <div className="space-y-4">
            {importantDocuments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Aucun document important disponible
              </p>
            ) : (
              importantDocuments.map((doc: any) => (
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
              ))
            )}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};