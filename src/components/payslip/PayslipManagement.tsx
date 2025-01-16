import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PayslipManagement = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  // Fetch employees from Supabase
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name');
      
      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }
      
      return data;
    }
  });

  // Fetch documents for each employee
  const { data: documents, refetch: refetchDocuments } = useQuery({
    queryKey: ['documents', selectedEmployee],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('employee_id', selectedEmployee);
      
      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!selectedEmployee
  });

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
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePayslipUpload = async () => {
    if (!selectedFile || !selectedEmployee) {
      toast.error("Veuillez sélectionner un employé et un fichier");
      return;
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `payslips/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Save document metadata to the documents table
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          employee_id: selectedEmployee,
          title: selectedFile.name,
          type: 'payslip',
          file_path: filePath,
        });

      if (dbError) {
        throw dbError;
      }

      toast.success(`Fiche de paie téléversée pour ${selectedEmployee}`);
      setSelectedFile(null);
      refetchDocuments();
    } catch (error) {
      console.error('Error uploading payslip:', error);
      toast.error("Erreur lors du téléversement du fichier");
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          title: selectedFile.name,
          type: 'important_document',
          file_path: filePath,
        });

      if (dbError) {
        throw dbError;
      }

      toast.success("Document important téléversé");
      setSelectedFile(null);
      refetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error("Erreur lors du téléversement du fichier");
    }
  };

  const handleDelete = async (type: 'payslip' | 'document', id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success(`${type === 'payslip' ? 'Fiche de paie' : 'Document'} supprimé`);
      refetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error("Erreur lors de la suppression du document");
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) {
        throw error;
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error("Erreur lors du téléchargement du fichier");
    }
  };

  return (
    <Tabs defaultValue="payslips" className="space-y-4">
      <TabsList>
        <TabsTrigger value="payslips">Fiches de paie</TabsTrigger>
        <TabsTrigger value="documents">Documents importants</TabsTrigger>
      </TabsList>

      <TabsContent value="payslips">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Gestion des fiches de paie</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex gap-4">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Sélectionner un employé</option>
                {employees?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {`${employee.first_name} ${employee.last_name}`}
                  </option>
                ))}
              </select>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="w-full"
              />
              <Button onClick={handlePayslipUpload} className="whitespace-nowrap">
                <Upload className="mr-2 h-4 w-4" />
                Téléverser
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {documents?.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{doc.title}</span>
                  </div>
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(doc.file_path)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete('payslip', doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Documents importants</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex gap-4">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="w-full"
              />
              <Button onClick={handleDocumentUpload} className="whitespace-nowrap">
                <Upload className="mr-2 h-4 w-4" />
                Téléverser
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {importantDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50"
              >
                <div className="flex items-center">
                  <FileText className="mr-4 h-6 w-6 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.type} - {doc.size}
                    </p>
                  </div>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete('document', doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};