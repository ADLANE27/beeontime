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
import { Download, Loader2, Plus } from "lucide-react";
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
import { LeaveRequestForm } from "./LeaveRequestForm";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"] & {
  employees: {
    first_name: string;
    last_name: string;
  };
  documents: {
    id: string;
    file_path: string;
    file_name: string;
  }[];
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

const leaveTypes = [
  { value: "vacation", label: "Congés payés" },
  { value: "annual", label: "Congé annuel" },
  { value: "rtt", label: "RTT" },
  { value: "paternity", label: "Congé paternité" },
  { value: "maternity", label: "Congé maternité" },
  { value: "sickChild", label: "Congé enfant malade" },
  { value: "sickLeave", label: "Arrêt maladie" },
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
  const [isNewLeaveOpen, setIsNewLeaveOpen] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      console.log('Fetching leave requests with documents...');
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees (
            first_name,
            last_name
          ),
          documents:leave_request_documents (
            id,
            file_path,
            file_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leave requests:', error);
        throw error;
      }

      console.log('Fetched leave requests:', data);
      return data as LeaveRequest[];
    }
  });

  const handleDownloadDocument = async (documentId: string, filePath: string, fileName: string) => {
    try {
      setDownloadingDocumentId(documentId);
      console.log('Downloading document:', { documentId, filePath, fileName });
      
      const { data } = await supabase.storage
        .from('leave-documents')
        .getPublicUrl(filePath);

      console.log('Got public URL:', data.publicUrl);

      const response = await fetch(data.publicUrl);
      if (!response.ok) throw new Error('Failed to download file');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Document téléchargé avec succès");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Erreur lors du téléchargement du document");
    } finally {
      setDownloadingDocumentId(null);
    }
  };

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
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Demandes de congés</h2>
        <Button onClick={() => setIsNewLeaveOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

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
                {/* Unique employees mapping */}
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
                {leaveRequests
                  ?.filter((request) => {
                    if (tab === "all") return true;
                    return request.status === tab;
                  })
                  .map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold">
                            {request.employees.first_name} {request.employees.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {leaveTypes.find(t => t.value === request.type)?.label}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              Du {format(new Date(request.start_date), "dd MMMM yyyy", { locale: fr })}
                            </p>
                            <p className="font-medium">
                              au {format(new Date(request.end_date), "dd MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            Type de journée: {request.day_type === "full" ? "Journée complète" : "Demi-journée"}
                            {request.day_type === "half" && request.period && (
                              <span className="font-medium"> ({request.period === "morning" ? "Matin" : "Après-midi"})</span>
                            )}
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
                          <p className="text-sm text-gray-500">
                            Soumis le {format(new Date(request.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
                          </p>
                          {request.documents && request.documents.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <p className="text-sm text-gray-600">Documents :</p>
                              <div className="flex gap-2">
                                {request.documents.map((doc) => (
                                  <Button
                                    key={doc.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadDocument(doc.id, doc.file_path, doc.file_name)}
                                    disabled={downloadingDocumentId === doc.id}
                                    className="flex items-center gap-2"
                                  >
                                    {downloadingDocumentId === doc.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                    {doc.file_name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                          {request.status === "pending" && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
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
                                size="sm"
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
                            </div>
                          )}
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

      <Dialog open={isNewLeaveOpen} onOpenChange={setIsNewLeaveOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle demande de congés</DialogTitle>
          </DialogHeader>
          <LeaveRequestForm 
            onSubmit={async (data) => {
              try {
                const { error } = await supabase
                  .from('leave_requests')
                  .insert({
                    ...data,
                    status: 'approved'
                  });

                if (error) throw error;
                
                toast.success("Demande de congés créée avec succès");
                setIsNewLeaveOpen(false);
                queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
              } catch (error) {
                console.error('Error creating leave request:', error);
                toast.error("Erreur lors de la création de la demande");
              }
            }}
            isSubmitting={false}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};
