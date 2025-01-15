import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Clock, AlertTriangle, Clock4, FileText, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PayslipManagement } from "@/components/payslip/PayslipManagement";
import { AdminPlanning } from "@/components/planning/AdminPlanning";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { DelayList } from "@/components/delays/DelayList";

const HRDashboard = () => {
  const handleExport = () => {
    // Ici, vous ajouterez la logique pour exporter les données
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter les données
          </Button>
        </div>

        <Tabs defaultValue="planning" className="space-y-4">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="planning">
              <Calendar className="mr-2 h-4 w-4" />
              Planning
            </TabsTrigger>
            <TabsTrigger value="leave">
              <Clock className="mr-2 h-4 w-4" />
              Demandes de congés
            </TabsTrigger>
            <TabsTrigger value="overtime">
              <Clock4 className="mr-2 h-4 w-4" />
              Heures supplémentaires
            </TabsTrigger>
            <TabsTrigger value="lateness">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Retards
            </TabsTrigger>
            <TabsTrigger value="payslips">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="planning">
            <AdminPlanning />
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
            <OvertimeList />
          </TabsContent>

          <TabsContent value="lateness">
            <DelayList />
          </TabsContent>

          <TabsContent value="payslips">
            <PayslipManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
