
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
import { Download, Edit, Loader2, Plus, Trash2 } from "lucide-react";
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
import { leaveTypeColors } from "../planning/LeaveTypeLegend";

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"] & {
  employees: {
    first_name: string;
    last_name: string;
  };
  documents: {
    id: string;
    file_path: string;
    file_name: string;
    file_type: string;
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

export const LeaveRequestsList = () => {
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [isNewLeaveOpen, setIsNewLeaveOpen] = useState(false);
  const [isEditLeaveOpen, setIsEditLeaveOpen] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
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
            file_name,
            file_type
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

  const handleEdit = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsEditLeaveOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedRequest) return;
    
    setLoadingRequestId(selectedRequest.id);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', selectedRequest.id);

      if (error) throw error;
      
      toast.success("Demande supprimée avec succès");
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setDeleteConfirmOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setLoadingRequestId(null);
    }
  };

  const handleUpdateRequest = async (formData: any) => {
    if (!selectedRequest) return;
    
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          start_date: formData.start_date,
          end_date: formData.end_date,
          type: formData.type,
          day_type: formData.day_type,
          period: formData.period,
          reason: formData.reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;
      
      toast.success("Demande mise à jour avec succès");
      setIsEditLeaveOpen(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error("Une erreur est survenue lors de la mise à jour");
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
      <div className="flex justify-center mb-6">
        <Button onClick={() => setIsNewLeaveOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      <div className="space-y-4">
        {leaveRequests?.map((request) => (
          <Card key={request.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-semibold">
                  {request.employees.first_name} {request.employees.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {leaveTypeColors[request.type as keyof typeof leaveTypeColors]?.label || request.type}
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

                {/* Documents section */}
                {request.documents && request.documents.length > 0 && (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Documents :</p>
                    <div className="flex flex-wrap gap-2">
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
                <div className="flex gap-2 mt-2">
                  {request.status === "pending" && (
                    <>
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
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(request)}
                    disabled={loadingRequestId === request.id}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setSelectedRequest(request);
                      setDeleteConfirmOpen(true);
                    }}
                    disabled={loadingRequestId === request.id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
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

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation de suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer cette demande de congé ?</p>
            <p className="text-sm text-gray-500 mt-2">Cette action est irréversible.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setSelectedRequest(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loadingRequestId === selectedRequest?.id}
            >
              {loadingRequestId === selectedRequest?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
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

      <Dialog open={isEditLeaveOpen} onOpenChange={setIsEditLeaveOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier demande de congés</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <LeaveRequestForm 
              onSubmit={handleUpdateRequest}
              isSubmitting={loadingRequestId === selectedRequest.id}
              initialValues={{
                employee_id: selectedRequest.employee_id,
                start_date: selectedRequest.start_date,
                end_date: selectedRequest.end_date,
                type: selectedRequest.type,
                day_type: selectedRequest.day_type,
                period: selectedRequest.period || "",
                reason: selectedRequest.reason || "",
              }}
              isEditing={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
