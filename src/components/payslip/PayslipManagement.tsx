
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Trash2, Upload, Calendar, FileCheck, FileSearch, Loader2, File, FileUp } from "lucide-react";
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Gestion des fiches de paie</h2>
            
            <div className="flex items-center gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
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
              
              <div className="relative">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Sélectionner un fichier"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-9 w-9 border-dashed border-blue-300"
                  disabled={!!selectedFile}
                  tabIndex={-1}
                >
                  <FileUp className="h-4 w-4 text-blue-500" />
                </Button>
                {selectedFile && (
                  <Badge className="absolute -top-2 -right-2 bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs z-20">
                    <File className="h-2.5 w-2.5 mr-0.5" />
                  </Badge>
                )}
              </div>
              
              <Button 
                onClick={handlePayslipUpload} 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 h-9"
                disabled={!selectedFile || !selectedEmployee}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {employees?.filter(employee => 
              documents?.some(doc => 
                doc.employee_id === employee.id && doc.type === 'payslip'
              )
            ).map((employee) => (
              <div key={employee.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gray-50 p-2 border-b">
                  <h3 className="font-medium text-gray-800 flex items-center text-sm">
                    <FileCheck className="h-4 w-4 text-blue-500 mr-1.5" />
                    {`${employee.first_name} ${employee.last_name}`}
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {documents?.filter(doc => doc.employee_id === employee.id && doc.type === 'payslip')
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-blue-50 rounded-full">
                          <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{doc.title}</p>
                          <p className="text-xs text-gray-500">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {format(new Date(doc.created_at), "dd MMMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownload(doc.id, doc.file_path, doc.title)}
                          disabled={downloadingDoc === doc.id}
                          className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          {downloadingDoc === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete('payslip', doc.id)}
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
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
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileSearch className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucune fiche de paie n'a encore été téléversée</p>
              </div>
            )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Documents importants</h2>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Sélectionner un fichier"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-9 w-9 border-dashed border-green-300"
                  disabled={!!selectedFile}
                  tabIndex={-1}
                >
                  <FileUp className="h-4 w-4 text-green-500" />
                </Button>
                {selectedFile && (
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs z-20">
                    <File className="h-2.5 w-2.5 mr-0.5" />
                  </Badge>
                )}
              </div>
              
              <Button 
                onClick={handleDocumentUpload} 
                size="sm"
                className="bg-green-600 hover:bg-green-700 h-9"
                disabled={!selectedFile}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {documents?.filter(doc => doc.type === 'important_document').length ? (
              <div className="rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gray-50 p-2 border-b">
                  <h3 className="font-medium text-gray-800 flex items-center text-sm">
                    <FileCheck className="h-4 w-4 text-green-500 mr-1.5" />
                    Documents d'entreprise
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {documents?.filter(doc => doc.type === 'important_document')
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-green-50 rounded-full">
                          <FileText className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{doc.title}</p>
                          <p className="text-xs text-gray-500">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {format(new Date(doc.created_at), "dd MMMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownload(doc.id, doc.file_path, doc.title)}
                          disabled={downloadingDoc === doc.id}
                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          {downloadingDoc === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete('document', doc.id)}
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileSearch className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Aucun document important n'a encore été téléversé</p>
              </div>
            )}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
