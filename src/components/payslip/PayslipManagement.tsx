
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Trash2, Upload, Calendar, FileCheck, FileSearch, Loader2, File } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const PayslipManagement = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);

  // Fetch employees from Supabase
  const { data: employees, isLoading } = useQuery({
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

  // Fetch documents from Supabase
  const { data: documents, refetch: refetchDocuments } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, employees (first_name, last_name)');
      
      if (error) {
        console.error('Error fetching documents:', error);
        throw error;
      }
      
      return data;
    }
  });

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
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Vous devez être connecté pour téléverser des documents");
        return;
      }

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `payslips/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error("Erreur lors du téléversement du fichier");
        return;
      }

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          employee_id: selectedEmployee,
          title: selectedFile.name,
          type: 'payslip',
          file_path: filePath,
          uploaded_by: session.user.id
        });

      if (dbError) {
        console.error('Error saving document metadata:', dbError);
        toast.error("Erreur lors de l'enregistrement des métadonnées");
        return;
      }

      toast.success("Fiche de paie téléversée avec succès");
      setSelectedFile(null);
      setSelectedEmployee("");
      refetchDocuments();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("Une erreur inattendue est survenue");
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Vous devez être connecté pour téléverser des documents");
        return;
      }

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error("Erreur lors du téléversement du fichier");
        return;
      }

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          title: selectedFile.name,
          type: 'important_document',
          file_path: filePath,
          uploaded_by: session.user.id
        });

      if (dbError) {
        console.error('Error saving document metadata:', dbError);
        toast.error("Erreur lors de l'enregistrement des métadonnées");
        return;
      }

      toast.success("Document important téléversé avec succès");
      setSelectedFile(null);
      refetchDocuments();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("Une erreur inattendue est survenue");
    }
  };

  const handleDelete = async (type: 'payslip' | 'document', id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting document:', error);
        toast.error("Erreur lors de la suppression du document");
        return;
      }

      toast.success(`${type === 'payslip' ? 'Fiche de paie' : 'Document'} supprimé`);
      refetchDocuments();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("Une erreur inattendue est survenue");
    }
  };

  const handleDownload = async (id: string, filePath: string, fileName: string) => {
    try {
      setDownloadingDoc(id);
      console.log('Downloading document:', filePath);
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) {
        console.error('Error downloading file:', error);
        toast.error("Erreur lors du téléchargement du document");
        return;
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Téléchargement de ${fileName} réussi`);
    } catch (error) {
      console.error('Error:', error);
      toast.error("Erreur lors du téléchargement du document");
    } finally {
      setDownloadingDoc(null);
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
          
          <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
              <Upload className="h-5 w-5 text-blue-500" />
              Téléverser une nouvelle fiche de paie
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
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
              <div className="relative flex-1">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="w-full cursor-pointer file:cursor-pointer file:border-0 file:bg-blue-50 file:text-blue-600 file:font-medium file:mr-4 file:py-2 file:px-4 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200">
                    <File className="h-3 w-3 mr-1" />
                    {selectedFile.name}
                  </Badge>
                )}
              </div>
              <Button onClick={handlePayslipUpload} className="whitespace-nowrap bg-blue-600 hover:bg-blue-700">
                <Upload className="mr-2 h-4 w-4" />
                Téléverser
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            {employees?.filter(employee => 
              documents?.some(doc => 
                doc.employee_id === employee.id && doc.type === 'payslip'
              )
            ).map((employee) => (
              <div key={employee.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gray-100 p-3 border-b">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <FileCheck className="h-5 w-5 text-blue-500 mr-2" />
                    {`${employee.first_name} ${employee.last_name}`}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {documents?.filter(doc => doc.employee_id === employee.id && doc.type === 'payslip')
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-full">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{doc.title}</p>
                          <p className="text-sm text-gray-500">
                            <Calendar className="h-3.5 w-3.5 inline mr-1" />
                            {format(new Date(doc.created_at), "dd MMMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(doc.id, doc.file_path, doc.title)}
                          disabled={downloadingDoc === doc.id}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {downloadingDoc === doc.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
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
                  ))}
                </div>
              </div>
            ))}
            {employees?.filter(employee => 
              documents?.some(doc => 
                doc.employee_id === employee.id && doc.type === 'payslip'
              )
            ).length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileSearch className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">Aucune fiche de paie n'a encore été téléversée</p>
                <p className="text-gray-400 text-sm mt-1">Utilisez le formulaire ci-dessus pour ajouter une fiche de paie</p>
              </div>
            )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Documents importants</h2>
          
          <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
              <Upload className="h-5 w-5 text-green-500" />
              Téléverser un nouveau document
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="w-full cursor-pointer file:cursor-pointer file:border-0 file:bg-green-50 file:text-green-600 file:font-medium file:mr-4 file:py-2 file:px-4 hover:file:bg-green-100"
                />
                {selectedFile && (
                  <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200">
                    <File className="h-3 w-3 mr-1" />
                    {selectedFile.name}
                  </Badge>
                )}
              </div>
              <Button onClick={handleDocumentUpload} className="whitespace-nowrap bg-green-600 hover:bg-green-700">
                <Upload className="mr-2 h-4 w-4" />
                Téléverser
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {documents?.filter(doc => doc.type === 'important_document').length ? (
              <div className="rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gray-100 p-3 border-b">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <FileCheck className="h-5 w-5 text-green-500 mr-2" />
                    Documents d'entreprise
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {documents?.filter(doc => doc.type === 'important_document')
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-50 rounded-full">
                          <FileText className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{doc.title}</p>
                          <p className="text-sm text-gray-500">
                            <Calendar className="h-3.5 w-3.5 inline mr-1" />
                            {format(new Date(doc.created_at), "dd MMMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(doc.id, doc.file_path, doc.title)}
                          disabled={downloadingDoc === doc.id}
                          className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                        >
                          {downloadingDoc === doc.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
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
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileSearch className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">Aucun document important n'a encore été téléversé</p>
                <p className="text-gray-400 text-sm mt-1">Utilisez le formulaire ci-dessus pour ajouter un document</p>
              </div>
            )}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
