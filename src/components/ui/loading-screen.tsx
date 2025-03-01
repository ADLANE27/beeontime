
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  timeout?: number; // Add timeout property to prevent infinite loading
}

export const LoadingScreen = ({
  message = "Chargement...",
  fullScreen = false,
  size = "md",
  timeout = 15000 // Default timeout of 15 seconds
}: LoadingScreenProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  // Show timeout message if loading takes too long
  const [showTimeout, setShowTimeout] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);
    
    return () => clearTimeout(timer);
  }, [timeout]);

  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[200px]'} bg-background`}>
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        
        {showTimeout && (
          <div className="mt-4 text-center max-w-[400px]">
            <p className="text-sm text-amber-600">
              Le chargement prend plus de temps que prévu. Si le problème persiste, essayez de rafraîchir la page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Rafraîchir la page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
