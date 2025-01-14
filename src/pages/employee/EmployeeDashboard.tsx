import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, FileText, Clock4 } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { OvertimeList } from "@/components/overtime/OvertimeList";
import { toast } from "sonner";

const EmployeeDashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="leave">
              <Clock className="mr-2 h-4 w-4" />
              Congés
            </TabsTrigger>
            <TabsTrigger value="overtime">
              <Clock4 className="mr-2 h-4 w-4" />
              Heures Supp.
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Documents Importants</h2>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h3 className="font-semibold">Bulletin de paie - Mars 2024</h3>
                  <p className="text-sm text-gray-600">PDF - 245 KB</p>
                </div>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <h3 className="font-semibold">Contrat de travail</h3>
                  <p className="text-sm text-gray-600">PDF - 1.2 MB</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="leave">
            <LeaveRequestForm />
          </TabsContent>

          <TabsContent value="overtime">
            <OvertimeList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;