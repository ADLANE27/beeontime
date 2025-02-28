
import { WifiOff } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface NetworkStatusAlertProps {
  isOffline: boolean;
  onCheck?: () => void;
}

export const NetworkStatusAlert = ({ 
  isOffline, 
  onCheck 
}: NetworkStatusAlertProps) => {
  if (!isOffline) return null;
  
  return (
    <Alert variant="warning" className="mb-4 bg-amber-50 border-amber-200">
      <WifiOff className="h-4 w-4 text-amber-500" />
      <AlertTitle>Connexion limitée</AlertTitle>
      <AlertDescription>
        Vous semblez être hors ligne. La connexion pourrait échouer.
        {onCheck && (
          <div className="mt-2">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs"
              onClick={onCheck}
            >
              Vérifier la connexion
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
