import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, AlertTriangle, FileText } from "lucide-react";
import { NewEmployeeForm } from "@/components/employee/NewEmployeeForm";
import { useState } from "react";
import { Employee } from "@/types/hr";

export const AdminPlanning = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const employees = [
    { id: 1, name: "Jean Dupont", role: "Traducteur", schedule: "9h-17h" },
    { id: 2, name: "Marie Martin", role: "Interprète", schedule: "10h-18h" },
  ];

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee({
      firstName: employee.name.split(' ')[0],
      lastName: employee.name.split(' ')[1],
      email: `${employee.name.toLowerCase().replace(' ', '.')}@entreprise.com`,
      phone: '0612345678',
      birthDate: new Date(),
      birthPlace: '',
      birthCountry: '',
      nationality: '',
      socialSecurityNumber: '',
      address: '',
      postalCode: '',
      city: '',
      country: '',
      startDate: new Date(),
      contractType: 'CDI',
      role: employee.role,
      schedule: employee.schedule,
      workingHours: 35,
      salary: 0,
      bankName: '',
      iban: '',
      bic: '',
    });
  };

  const handleCloseForm = () => {
    setSelectedEmployee(null);
  };

  return (
    <Tabs defaultValue="planning" className="space-y-4">
      <TabsList className="flex flex-wrap gap-2">
        <TabsTrigger value="planning" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Planning
        </TabsTrigger>
        <TabsTrigger value="leave" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Demandes de congés
        </TabsTrigger>
        <TabsTrigger value="overtime" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Heures supplémentaires
        </TabsTrigger>
        <TabsTrigger value="delays" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Retards
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Documents
        </TabsTrigger>
      </TabsList>

      <TabsContent value="planning">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Planning des employés</h2>
          <div className="space-y-4">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-semibold">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.role}</p>
                  <p className="text-sm text-gray-600">Horaires : {employee.schedule}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleEditEmployee(employee)}
                >
                  Modifier
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="leave">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Demandes de congés</h2>
          <div className="space-y-4">
            {[1, 2].map((id) => (
              <div key={id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Jean Dupont</h3>
                  <p className="text-sm text-gray-600">20-27 Mars 2024</p>
                  <p className="text-sm text-gray-600">Congés payés</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Refuser</Button>
                  <Button size="sm">Accepter</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="overtime">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Heures supplémentaires</h2>
          <div className="space-y-4">
            {[1, 2].map((id) => (
              <div key={id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Marie Martin</h3>
                  <p className="text-sm text-gray-600">15 Mars 2024</p>
                  <p className="text-sm text-gray-600">2 heures supplémentaires</p>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Refuser</Button>
                  <Button size="sm">Valider</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="delays">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Retards</h2>
          <div className="space-y-4">
            {[1, 2].map((id) => (
              <div key={id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Pierre Martin</h3>
                  <p className="text-sm text-gray-600">18 Mars 2024</p>
                  <p className="text-sm text-gray-600">30 minutes de retard</p>
                </div>
                <Button variant="outline" size="sm">Noter</Button>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Documents</h2>
          <div className="space-y-4">
            {[1, 2].map((id) => (
              <div key={id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Fiche de paie - Mars 2024</h3>
                  <p className="text-sm text-gray-600">Jean Dupont</p>
                </div>
                <Button variant="outline" size="sm">Télécharger</Button>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      {selectedEmployee && (
        <NewEmployeeForm
          initialData={selectedEmployee}
          onClose={handleCloseForm}
          mode="update"
        />
      )}
    </Tabs>
  );
};