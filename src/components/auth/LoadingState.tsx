
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  message: string;
  subMessage?: string;
  onRefresh?: () => void;
  disableRefresh?: boolean;
}

export const LoadingState = ({
  message,
  subMessage,
  onRefresh,
  disableRefresh = false
}: LoadingStateProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">{message}</p>
        {subMessage && (
          <p className="text-xs text-muted-foreground/70">{subMessage}</p>
        )}
        {onRefresh && (
          <Button 
            variant="link" 
            className="text-sm text-muted-foreground"
            onClick={onRefresh}
            disabled={disableRefresh}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Rafraîchir
          </Button>
        )}
      </div>
    </div>
  );
};
