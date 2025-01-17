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
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Database } from "@/integrations/supabase/types";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"] & {
  employees: {
    first_name: string;
    last_name: string;
  };
};

const getStatusColor = (status: LeaveRequest["status"]) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

const getStatusLabel = (status: LeaveRequest["status"]) => {
  switch (status) {
    case "approved":
      return "Acceptée";
    case "rejected":
      return "Refusée";
    default:
      return "En attente";
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
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leave requests:', error);
        throw error;
      }

      return data as LeaveRequest[];
    }
  });

  // Get unique employees from leave requests
  const uniqueEmployees = leaveRequests 
    ? Array.from(new Set(leaveRequests.map(request => request.employee_id)))
        .map(employeeId => {
          const request = leaveRequests.find(r => r.employee_id === employeeId);
          return {
            id: employeeId,
            name: `${request?.employees.first_name} ${request?.employees.last_name}`
          };
        })
    : [];

  // Filter leave requests based on selected employee
  const filteredLeaveRequests = leaveRequests?.filter(request => 
    selectedEmployee === "all" || request.employee_id === selectedEmployee
  );

  const handleApprove = async (request: LeaveRequest) => {
    setLoadingRequestId(request.id);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;
      
      toast.success("Demande approuvée avec succès");
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoadingRequestId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setLoadingRequestId(selectedRequest.id);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: 'rejected',
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;
      
      toast.error("Demande refusée");
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setRejectionDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoadingRequestId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Demandes de congés</h2>

      <div className="space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Employé</Label>
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tous les employés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les employés</SelectItem>
                {uniqueEmployees.map((employee) => (
                  <SelectItem 
                    key={employee.id} 
                    value={employee.id}
                  >
                    {employee.name}
                  </SelectItem>
                ))}
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
                {filteredLeaveRequests
                  ?.filter((request) => {
                    if (tab === "all") return true;
                    return request.status === tab;
                  })
                  .map((request) => (
                    <Card key={request.id} className="p-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold">
                            {request.employees.first_name} {request.employees.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {leaveTypes.find(t => t.value === request.type)?.label}
                          </p>
                          <p className="text-sm">
                            Du {format(new Date(request.start_date), "dd MMMM yyyy", { locale: fr })} au{" "}
                            {format(new Date(request.end_date), "dd MMMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.day_type === "full" ? "Journée complète" : "Demi-journée"}
                            {request.period && ` (${request.period === "morning" ? "Matin" : "Après-midi"})`}
                          </p>
                          {request.reason && (
                            <p className="text-sm text-gray-600">
                              Motif : {request.reason}
                            </p>
                          )}
                          {request.rejection_reason && (
                            <p className="text-sm text-red-600">
                              Motif du refus : {request.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-end">
                          {request.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(request)}
                                disabled={loadingRequestId === request.id}
                              >
                                {loadingRequestId === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Accepter
                              </Button>
                              <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setRejectionDialogOpen(true);
                                }}
                                disabled={loadingRequestId === request.id}
                              >
                                {loadingRequestId === request.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Refuser
                              </Button>
                            </>
                          )}
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
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

      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motif du refus</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Veuillez indiquer le motif du refus</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Saisissez le motif du refus..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectionDialogOpen(false);
                setRejectionReason("");
                setSelectedRequest(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
