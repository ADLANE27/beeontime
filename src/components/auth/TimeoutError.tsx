
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TimeoutErrorProps {
  onRefresh: () => void;
  onSignOut?: () => void;
  hasSession?: boolean;
}

export const TimeoutError = ({ 
  onRefresh, 
  onSignOut,
  hasSession = false
}: TimeoutErrorProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold">Délai de connexion dépassé</h1>
          <p className="text-gray-600">
            La vérification de votre session prend plus de temps que prévu. Veuillez rafraîchir la page.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            className="w-full" 
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Rafraîchir la page
          </Button>
          
          {hasSession && onSignOut && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onSignOut}
            >
              Se déconnecter
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
