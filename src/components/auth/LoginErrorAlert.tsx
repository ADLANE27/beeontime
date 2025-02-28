
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface LoginErrorAlertProps {
  error: string | null;
  authError?: Error | null;
}

export const LoginErrorAlert = ({ 
  error, 
  authError 
}: LoginErrorAlertProps) => {
  if (!error && !authError) return null;
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (authError) {
    return (
      <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertTitle>Problème d'authentification</AlertTitle>
        <AlertDescription>
          {authError.message || "Une erreur s'est produite lors de l'authentification."}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
