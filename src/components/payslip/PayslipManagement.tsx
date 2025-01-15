import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { Employee, Payslip } from "@/types/hr";

export const PayslipManagement = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  // Mock data - In a real app, this would come from your backend
  const employees: Employee[] = [
    { id: 1, name: "Jean Dupont", poste: "Traducteur", department: "Traduction" },
    { id: 2, name: "Marie Martin", poste: "Traductrice", department: "Traduction" }
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
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePayslipUpload = () => {
    if (!selectedFile || !selectedEmployee) {
      toast.error("Veuillez sélectionner un employé et un fichier");
      return;
    }
    
    // Here you would handle the actual upload to your backend
    toast.success(`Fiche de paie téléversée pour ${selectedEmployee}`);
    setSelectedFile(null);
    setSelectedEmployee("");
  };

  const handleDocumentUpload = () => {
    if (!selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }
    
    // Here you would handle the actual upload to your backend
    toast.success("Document important téléversé");
    setSelectedFile(null);
  };

  const handleDelete = (type: 'payslip' | 'document', id: number) => {
    // Here you would handle the actual deletion from your backend
    toast.success(`${type === 'payslip' ? 'Fiche de paie' : 'Document'} supprimé`);
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
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.name}>
                    {employee.name}
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
            {employees.map((employee) => (
              <div key={employee.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{employee.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Mars 2024</span>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete('payslip', 1)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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