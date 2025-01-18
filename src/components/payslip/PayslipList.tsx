import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PayslipList = () => {
  const queryClient = useQueryClient();

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

  const handleDownload = async (fileUrl: string, title: string, docId: string) => {
    try {
      // Télécharger le fichier
      const { data, error } = await supabase.storage
        .from('documents')
        .download(fileUrl);

      if (error) {
        console.error('Error downloading file:', error);
        toast.error("Erreur lors du téléchargement du document");
        return;
      }

      // Marquer le document comme vu
      const { error: updateError } = await supabase
        .from('documents')
        .update({ viewed: true })
        .eq('id', docId);

      if (updateError) {
        console.error('Error updating document viewed status:', updateError);
      } else {
        // Invalider les requêtes pour forcer un rafraîchissement des données
        queryClient.invalidateQueries({ queryKey: ['important_documents'] });
        queryClient.invalidateQueries({ queryKey: ['payslips'] });
      }

      // Créer un lien de téléchargement
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

  // Calculer le nombre de documents non vus
  const unviewedDocs = importantDocuments.filter(doc => !doc.viewed).length;

  return (
    <Tabs defaultValue="payslips" className="space-y-4">
      <TabsList>
        <TabsTrigger value="payslips">Bulletins de paie</TabsTrigger>
        <TabsTrigger value="documents" className="relative">
          Documents importants
          {unviewedDocs > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unviewedDocs}
            </span>
          )}
        </TabsTrigger>
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
                  <div className="flex items-center space-x-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{payslip.title}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(payslip.file_path, payslip.title, payslip.id)}
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
              importantDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{doc.title}</p>
                      {!doc.viewed && (
                        <span className="text-xs text-destructive">Nouveau</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(doc.file_path, doc.title, doc.id)}
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