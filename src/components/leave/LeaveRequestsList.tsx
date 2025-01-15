import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  type: string;
  status: "En attente" | "Acceptée" | "Refusée";
  dayType: "complete" | "demi";
  approvalDate?: Date;
  refusalDate?: Date;
  daysCount: number;
}

// Exemple de données (à remplacer par les vraies données)
const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 1,
    employeeId: 1,
    employeeName: "Jean Dupont",
    startDate: new Date(2024, 3, 15),
    endDate: new Date(2024, 3, 20),
    type: "Congés payés",
    status: "En attente",
    dayType: "complete",
    daysCount: 5
  },
  {
    id: 2,
    employeeId: 2,
    employeeName: "Marie Martin",
    startDate: new Date(2024, 3, 10),
    endDate: new Date(2024, 3, 10),
    type: "RTT",
    status: "Acceptée",
    approvalDate: new Date(2024, 3, 5),
    dayType: "demi",
    daysCount: 0.5
  },
  {
    id: 3,
    employeeId: 3,
    employeeName: "Pierre Durant",
    startDate: new Date(2024, 3, 1),
    endDate: new Date(2024, 3, 5),
    type: "Congés payés",
    status: "Refusée",
    refusalDate: new Date(2024, 3, 1),
    dayType: "complete",
    daysCount: 5
  }
];

const getStatusColor = (status: LeaveRequest["status"]) => {
  switch (status) {
    case "Acceptée":
      return "bg-green-100 text-green-800";
    case "Refusée":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

export const LeaveRequestsList = () => {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Demandes de congés</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Employé</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Tous les employés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les employés</SelectItem>
                <SelectItem value="1">Jean Dupont</SelectItem>
                <SelectItem value="2">Marie Martin</SelectItem>
                <SelectItem value="3">Pierre Durant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type de congé</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="paid">Congés payés</SelectItem>
                <SelectItem value="rtt">RTT</SelectItem>
                <SelectItem value="unpaid">Congé sans solde</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rechercher</Label>
            <Input type="text" placeholder="Rechercher..." />
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="approved">Acceptée</TabsTrigger>
            <TabsTrigger value="rejected">Refusée</TabsTrigger>
          </TabsList>

          {["pending", "approved", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-4">
                {mockLeaveRequests
                  .filter((request) => {
                    switch (tab) {
                      case "pending":
                        return request.status === "En attente";
                      case "approved":
                        return request.status === "Acceptée";
                      case "rejected":
                        return request.status === "Refusée";
                      default:
                        return true;
                    }
                  })
                  .map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{request.employeeName}</h3>
                          <p className="text-sm text-gray-600">
                            {request.type} - {request.daysCount} jour{request.daysCount > 1 ? "s" : ""}
                          </p>
                          <p className="text-sm">
                            Du {format(request.startDate, "dd MMMM yyyy", { locale: fr })} au{" "}
                            {format(request.endDate, "dd MMMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.dayType === "complete" ? "Journée complète" : "Demi-journée"}
                          </p>
                          {(request.approvalDate || request.refusalDate) && (
                            <p className="text-sm text-gray-600">
                              {request.status === "Acceptée"
                                ? `Acceptée le ${format(request.approvalDate!, "dd/MM/yyyy")}`
                                : request.status === "Refusée"
                                ? `Refusée le ${format(request.refusalDate!, "dd/MM/yyyy")}`
                                : null}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Card>
  );
};