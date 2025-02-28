
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
import { format, isWithinInterval, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Download, Loader2, Plus, Pencil, Trash2, Calendar, Clock, UserCircle, FileText, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogContentFullScreen,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Database } from "@/integrations/supabase/types";
import { LeaveRequestForm } from "./LeaveRequestForm";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isNewLeaveOpen, setIsNewLeaveOpen] = useState(false);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const [editingLeave, setEditingLeave] = useState<any | null>(null);
  
  // Filtres
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  
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

  // Récupérer la liste des employés pour le filtre
  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      return data;
    }
  });

  // Appliquer les filtres aux demandes de congés
  const filteredLeaveRequests = useMemo(() => {
    if (!leaveRequests) return [];

    return leaveRequests.filter(request => {
      // Filtre par employé
      if (employeeFilter !== "all" && request.employee_id !== employeeFilter) {
        return false;
      }

      // Filtre par type de congé
      if (leaveTypeFilter !== "all" && request.type !== leaveTypeFilter) {
        return false;
      }

      // Filtre par plage de dates
      if (startDateFilter && endDateFilter) {
        const requestStartDate = parseISO(request.start_date);
        const requestEndDate = parseISO(request.end_date);
        const filterStartDate = parseISO(startDateFilter);
        const filterEndDate = parseISO(endDateFilter);

        // Vérifier si les périodes se chevauchent
        const overlap = (
          (requestStartDate <= filterEndDate && requestStartDate >= filterStartDate) ||
          (requestEndDate <= filterEndDate && requestEndDate >= filterStartDate) ||
          (requestStartDate <= filterStartDate && requestEndDate >= filterEndDate)
        );

        if (!overlap) {
          return false;
        }
      } else if (startDateFilter) {
        // Seulement date de début spécifiée
        const requestStartDate = parseISO(request.start_date);
        const filterStartDate = parseISO(startDateFilter);
        if (requestStartDate < filterStartDate) {
          return false;
        }
      } else if (endDateFilter) {
        // Seulement date de fin spécifiée
        const requestEndDate = parseISO(request.end_date);
        const filterEndDate = parseISO(endDateFilter);
        if (requestEndDate > filterEndDate) {
          return false;
        }
      }

      return true;
    });
  }, [leaveRequests, employeeFilter, leaveTypeFilter, startDateFilter, endDateFilter]);

  const resetFilters = () => {
    setEmployeeFilter("all");
    setLeaveTypeFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
  };

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

  const handleUpdate = async () => {
    if (!editingLeave) return;
    
    setLoadingRequestId(editingLeave.id);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          start_date: editingLeave.start_date,
          end_date: editingLeave.end_date,
          type: editingLeave.type,
          reason: editingLeave.reason,
          day_type: editingLeave.day_type,
          period: editingLeave.period,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLeave.id);

      if (error) throw error;
      
      toast.success("Demande de congé mise à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setEditDialogOpen(false);
      setEditingLeave(null);
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error("Une erreur est survenue lors de la mise à jour");
    } finally {
      setLoadingRequestId(null);
    }
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
      setDeleteDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error("Une erreur est survenue lors de la suppression");
    } finally {
      setLoadingRequestId(null);
    }
  };

  const openEditDialog = (request: LeaveRequest) => {
    setEditingLeave({...request});
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setDeleteDialogOpen(true);
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
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Demandes de congés</h2>
          <Button onClick={() => setIsNewLeaveOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Button>
        </div>
        
        {/* Section des filtres */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="employeeFilter" className="mb-2 block">Employé</Label>
              <Select
                value={employeeFilter}
                onValueChange={setEmployeeFilter}
              >
                <SelectTrigger id="employeeFilter">
                  <SelectValue placeholder="Tous les employés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les employés</SelectItem>
                  {employees?.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="leaveTypeFilter" className="mb-2 block">Type de congé</Label>
              <Select
                value={leaveTypeFilter}
                onValueChange={setLeaveTypeFilter}
              >
                <SelectTrigger id="leaveTypeFilter">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {leaveTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDateFilter" className="mb-2 block">Date de début</Label>
              <Input
                id="startDateFilter"
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="endDateFilter" className="mb-2 block">Date de fin</Label>
              <Input
                id="endDateFilter"
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={resetFilters} className="mr-2">
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredLeaveRequests.length > 0 ? (
          filteredLeaveRequests.map((request) => (
            <Card key={request.id} className="p-4 hover:shadow-md transition-shadow">
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
                      onClick={() => openEditDialog(request)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      disabled={loadingRequestId === request.id}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openDeleteDialog(request)}
                      disabled={loadingRequestId === request.id}
                    >
                      {loadingRequestId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune demande de congé ne correspond aux critères de recherche</p>
          </div>
        )}
      </div>

      {/* Dialog de confirmation de rejet */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="fixed inset-0 grid place-items-center sm:max-w-[425px] mx-auto my-auto">
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

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="fixed inset-0 grid place-items-center sm:max-w-[425px] mx-auto my-auto">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette demande de congé ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedRequest(null);
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loadingRequestId === (selectedRequest?.id || '')}
            >
              {loadingRequestId === (selectedRequest?.id || '') ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="fixed inset-0 grid place-items-center sm:max-w-[425px] mx-auto my-auto">
          <DialogHeader>
            <DialogTitle>Modifier la demande de congé</DialogTitle>
          </DialogHeader>
          {editingLeave && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={editingLeave.start_date}
                    onChange={(e) => setEditingLeave({ ...editingLeave, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={editingLeave.end_date}
                    onChange={(e) => setEditingLeave({ ...editingLeave, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type de congé</Label>
                <Select
                  value={editingLeave.type}
                  onValueChange={(value) => setEditingLeave({ ...editingLeave, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="day_type">Type de journée</Label>
                <Select
                  value={editingLeave.day_type}
                  onValueChange={(value) => setEditingLeave({ ...editingLeave, day_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de journée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Journée complète</SelectItem>
                    <SelectItem value="half">Demi-journée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingLeave.day_type === "half" && (
                <div className="space-y-2">
                  <Label htmlFor="period">Période</Label>
                  <Select
                    value={editingLeave.period || "morning"}
                    onValueChange={(value) => setEditingLeave({ ...editingLeave, period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Matin</SelectItem>
                      <SelectItem value="afternoon">Après-midi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="reason">Motif (optionnel)</Label>
                <Textarea
                  id="reason"
                  placeholder="Précisez le motif de votre demande..."
                  value={editingLeave.reason || ""}
                  onChange={(e) => setEditingLeave({ ...editingLeave, reason: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingLeave(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loadingRequestId === (editingLeave?.id || '')}
            >
              {loadingRequestId === (editingLeave?.id || '') ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de nouvelle demande - en plein écran avec design amélioré */}
      <Dialog open={isNewLeaveOpen} onOpenChange={setIsNewLeaveOpen}>
        <DialogContentFullScreen className="bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-bold text-center text-gray-800">
                Nouvelle demande de congés
              </DialogTitle>
              <p className="text-center text-gray-600 mt-2">
                Remplissez le formulaire pour créer une nouvelle demande de congés
              </p>
            </DialogHeader>
          
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
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
            </div>
          </div>
        </DialogContentFullScreen>
      </Dialog>
    </Card>
  );
};
