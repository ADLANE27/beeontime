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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { Loader2, Plus } from "lucide-react";

type LeaveType = Database["public"]["Enums"]["leave_type"];

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

export const CreateLeaveRequestDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("vacation");
  const [dayType, setDayType] = useState("full");
  const [period, setPeriod] = useState<string | null>("morning");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .order('last_name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Créer la demande de congé
      const { data: leaveRequest, error: leaveError } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: selectedEmployee,
          start_date: startDate,
          end_date: endDate,
          type: leaveType,
          day_type: dayType,
          period: dayType === 'half' ? period : null,
          reason,
          status: 'approved' // Les demandes créées par HR sont automatiquement approuvées
        })
        .select()
        .single();

      if (leaveError) throw leaveError;

      // Si un fichier est sélectionné, le télécharger
      if (file && leaveRequest) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${leaveRequest.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('leave-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Enregistrer les informations du document
        const { error: docError } = await supabase
          .from('leave_request_documents')
          .insert({
            leave_request_id: leaveRequest.id,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (docError) throw docError;
      }

      toast.success("Demande de congé créée avec succès");
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating leave request:', error);
      toast.error("Erreur lors de la création de la demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployee("");
    setStartDate("");
    setEndDate("");
    setLeaveType("vacation");
    setDayType("full");
    setPeriod("morning");
    setReason("");
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier le type de fichier
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Type de fichier non autorisé. Veuillez sélectionner un PDF ou une image JPEG/JPG.");
        return;
      }

      // Vérifier la taille du fichier (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB en octets
      if (selectedFile.size > maxSize) {
        toast.error("Le fichier est trop volumineux. Taille maximum : 5MB");
        return;
      }

      setFile(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
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
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
              required
            >
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de congé</Label>
            <Select
              value={leaveType}
              onValueChange={(value: LeaveType) => setLeaveType(value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayType">Type de journée</Label>
            <Select value={dayType} onValueChange={setDayType} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Journée complète</SelectItem>
                <SelectItem value="half">Demi-journée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dayType === 'half' && (
            <div className="space-y-2">
              <Label htmlFor="period">Période</Label>
              <Select
                value={period || "morning"}
                onValueChange={setPeriod}
                required
              >
                <SelectTrigger>
                  <SelectValue />
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
              placeholder="Motif de la demande de congé"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Justificatif (PDF, JPEG, JPG - max 5MB)</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpeg,.jpg"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Créer la demande
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};