import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>();
  const [reason, setReason] = useState("");
  const [dayType, setDayType] = useState("full");
  const [period, setPeriod] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name");

      if (error) throw error;
      return data;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("Le fichier est trop volumineux (max 5MB)");
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast.error("Type de fichier non autorisé (PDF, JPEG ou JPG uniquement)");
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !startDate || !endDate || !leaveType || !dayType) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create leave request
      const { data: leaveRequest, error: leaveError } = await supabase
        .from("leave_requests")
        .insert({
          employee_id: selectedEmployee,
          start_date: startDate,
          end_date: endDate,
          type: leaveType,
          reason,
          day_type: dayType,
          period: dayType === "half" ? period : null,
        })
        .select()
        .single();

      if (leaveError) throw leaveError;

      // 2. Upload file if present
      if (file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${leaveRequest.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("leave-documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 3. Create document record
        const { error: docError } = await supabase
          .from("leave_request_documents")
          .insert({
            leave_request_id: leaveRequest.id,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (docError) throw docError;
      }

      toast.success("Demande de congé créée avec succès");
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating leave request:", error);
      toast.error("Une erreur est survenue lors de la création de la demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une demande de congé</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Employé</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {`${employee.first_name} ${employee.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
                <SelectItem value="annual">Congé annuel</SelectItem>
                <SelectItem value="rtt">RTT</SelectItem>
                <SelectItem value="paternity">Congé paternité</SelectItem>
                <SelectItem value="maternity">Congé maternité</SelectItem>
                <SelectItem value="sickChild">Congé enfant malade</SelectItem>
                <SelectItem value="unpaidUnexcused">
                  Absence injustifiée non rémunérée
                </SelectItem>
                <SelectItem value="unpaidExcused">
                  Absence justifiée non rémunérée
                </SelectItem>
                <SelectItem value="unpaid">Absence non rémunérée</SelectItem>
                <SelectItem value="familyEvent">
                  Absences pour événements familiaux
                </SelectItem>
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
            <Label htmlFor="reason">Motif</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motif de la demande"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Pièce jointe (PDF, JPEG, JPG - max 5MB)</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer la demande
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};