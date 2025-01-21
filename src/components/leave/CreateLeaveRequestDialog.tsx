import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type LeaveType = Database["public"]["Enums"]["leave_type"];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg"];

export const CreateLeaveRequestDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType | undefined>();
  const [reason, setReason] = useState("");
  const [dayType, setDayType] = useState("full");
  const [period, setPeriod] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name");
      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("Le fichier est trop volumineux. Maximum 5MB.");
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error("Type de fichier non autorisé. Utilisez PDF, JPEG ou JPG.");
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEmployee || !startDate || !endDate || !leaveType || !dayType) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create leave request
      const { data: leaveRequest, error: leaveError } = await supabase
        .from("leave_requests")
        .insert({
          employee_id: selectedEmployee,
          start_date: startDate,
          end_date: endDate,
          type: leaveType,
          reason,
          day_type: dayType,
          period: period || undefined,
          status: "pending",
        })
        .select()
        .single();

      if (leaveError) throw leaveError;

      // Upload file if present
      if (file && leaveRequest) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${leaveRequest.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("leave-documents")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create document record
        const { error: docError } = await supabase
          .from("leave_request_documents")
          .insert({
            leave_request_id: leaveRequest.id,
            file_path: fileName,
            file_name: file.name,
            file_type: file.type,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (docError) throw docError;
      }

      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      toast.success("Demande de congé créée avec succès");
      handleClose();
    } catch (error) {
      console.error("Error creating leave request:", error);
      toast.error("Erreur lors de la création de la demande de congé");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedEmployee("");
    setStartDate("");
    setEndDate("");
    setLeaveType(undefined);
    setReason("");
    setDayType("full");
    setPeriod(null);
    setFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle demande
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de congé</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employee">Employé</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leaveType">Type de congé</Label>
            <Select value={leaveType} onValueChange={(value: LeaveType) => setLeaveType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacation">Congés payés</SelectItem>
                <SelectItem value="annual">Congés annuels</SelectItem>
                <SelectItem value="rtt">RTT</SelectItem>
                <SelectItem value="unpaid">Congé sans solde</SelectItem>
                <SelectItem value="sickChild">Enfant malade</SelectItem>
                <SelectItem value="familyEvent">Événement familial</SelectItem>
                <SelectItem value="paternity">Congé paternité</SelectItem>
                <SelectItem value="maternity">Congé maternité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayType">Type de journée</Label>
            <Select value={dayType} onValueChange={setDayType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type de journée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Journée complète</SelectItem>
                <SelectItem value="half">Demi-journée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dayType === "half" && (
            <div className="space-y-2">
              <Label htmlFor="period">Période</Label>
              <Select value={period || ""} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la période" />
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
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Saisissez le motif de la demande..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Pièce jointe (optionnel)</Label>
            <input
              type="file"
              id="file"
              accept=".pdf,.jpg,.jpeg"
              onChange={handleFileChange}
              className="w-full cursor-pointer rounded-md border border-input px-3 py-2"
            />
            <p className="text-sm text-muted-foreground">
              Formats acceptés : PDF, JPEG, JPG (max 5MB)
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer la demande
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};