import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

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

// Types de congés alignés avec le formulaire employé
const leaveTypes = [
  { value: "vacation", label: "Congés payés" },
  { value: "annual", label: "Congé annuel" },
  { value: "rtt", label: "RTT" },
  { value: "paternity", label: "Congé paternité" },
  { value: "maternity", label: "Congé maternité" },
  { value: "sickChild", label: "Congé enfant malade" },
  { value: "unpaidUnexcused", label: "Absence injustifiée non rémunérée" },
  { value: "unpaidExcused", label: "Absence justifiée non rémunérée" },
  { value: "unpaid", label: "Absence non rémunérée" },
  { value: "familyEvent", label: "Absences pour événements familiaux" }
];

export const LeaveRequestsList = () => {
  const handleApprove = (requestId: number) => {
    // Logique d'approbation à implémenter
    toast.success("Demande approuvée avec succès");
  };

  const handleReject = (requestId: number) => {
    // Logique de refus à implémenter
    toast.error("Demande refusée");
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Demandes de congés</h2>

      <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
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
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rechercher</Label>
            <Input type="text" placeholder="Rechercher..." />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="approved">Acceptée</TabsTrigger>
            <TabsTrigger value="rejected">Refusée</TabsTrigger>
          </TabsList>

          {["all", "pending", "approved", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-4">
                {mockLeaveRequests
                  .filter((request) => {
                    if (tab === "all") return true;
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
                        <div className="flex flex-col sm:flex-row gap-2 items-end">
                          {request.status === "En attente" && (
                            <>
                              <Button
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(request.id)}
                              >
                                Accepter
                              </Button>
                              <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(request.id)}
                              >
                                Refuser
                              </Button>
                            </>
                          )}
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
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
