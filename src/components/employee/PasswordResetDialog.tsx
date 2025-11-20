import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordField } from "./PasswordField";
import { toast } from "sonner";
import { updateUserPassword } from "@/api/employee";
import { KeyRound } from "lucide-react";

interface PasswordResetDialogProps {
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
}

export const PasswordResetDialog = ({ employeeId, employeeEmail, employeeName }: PasswordResetDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.trim() === "") {
      toast.error("Veuillez entrer un nouveau mot de passe");
      return;
    }

    setIsLoading(true);
    try {
      await updateUserPassword(employeeId, newPassword, employeeEmail);
      toast.success(`Mot de passe réinitialisé pour ${employeeName}`);
      setIsOpen(false);
      setNewPassword("");
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Erreur lors de la réinitialisation du mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="h-4 w-4" />
          Réinitialiser le mot de passe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          <DialogDescription>
            Définir un nouveau mot de passe pour {employeeName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            value={newPassword}
            onChange={setNewPassword}
            label="Nouveau mot de passe"
            isRequired={true}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setNewPassword("");
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Réinitialisation..." : "Réinitialiser"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
