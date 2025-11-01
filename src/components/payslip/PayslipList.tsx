import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PayslipList = () => {
  const { data: payslips = [], isLoading: isLoadingPayslips } = useQuery({
    queryKey: ['payslips'],
    queryFn: async () => {
      console.log('Fetching payslips...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('employee_id', session.user.id)
        .eq('type', 'payslip');

      if (error) {
        console.error('Error fetching payslips:', error);
        throw error;
      }

      console.log('Payslips fetched:', data);
      return data || [];
    }
  });

  const { data: importantDocuments = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ['important_documents'],
    queryFn: async () => {
      console.log('Fetching important documents...');
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .is('employee_id', null)
        .eq('type', 'important_document');

      if (error) {
        console.error('Error fetching important documents:', error);
        throw error;
      }

      console.log('Important documents fetched:', data);
      return data || [];
    }
  });

  const handleDownload = async (fileUrl: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(fileUrl);

      if (error) {
        console.error('Error downloading file:', error);
        toast.error("Erreur lors du téléchargement du document");
        return;
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Téléchargement de ${title} réussi`);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erreur lors du téléchargement du document");
    }
  };

  if (isLoadingPayslips || isLoadingDocs) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Chargement des documents...</p>
        </div>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="payslips" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2 gap-2">
        <TabsTrigger value="payslips" className="text-sm sm:text-base">Bulletins de paie</TabsTrigger>
        <TabsTrigger value="documents" className="text-sm sm:text-base">Documents importants</TabsTrigger>
      </TabsList>

      <TabsContent value="payslips">
        <Card className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Bulletins de paie</h2>
          <div className="space-y-3 sm:space-y-4">
            {payslips.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                Aucun bulletin de paie disponible
              </p>
            ) : (
              payslips.map((payslip) => (
                <div
                  key={payslip.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{payslip.title}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(payslip.file_path, payslip.title)}
                    className="w-full sm:w-auto text-sm h-9"
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
        <Card className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Documents importants</h2>
          <div className="space-y-3 sm:space-y-4">
            {importantDocuments.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                Aucun document important disponible
              </p>
            ) : (
              importantDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{doc.title}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(doc.file_path, doc.title)}
                    className="w-full sm:w-auto text-sm h-9"
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