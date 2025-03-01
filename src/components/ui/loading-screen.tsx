
import React, { useState, useEffect } from "react";
import { Loader2, RefreshCcw } from "lucide-react";

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
  timeout = 8000 // Default timeout of 8 seconds
}: LoadingScreenProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  // Show timeout message if loading takes too long
  const [showTimeout, setShowTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);
    
    return () => clearTimeout(timer);
  }, [timeout]);

  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[200px]'} bg-background`}>
      <div className="flex flex-col items-center gap-3 animate-fade-in max-w-md px-4">
        {!showTimeout ? (
          <>
            <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
            {message && <p className="text-sm text-muted-foreground text-center">{message}</p>}
          </>
        ) : (
          <div className="text-center">
            <RefreshCcw className="h-8 w-8 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-medium mb-2">Le chargement prend plus de temps que prévu</h3>
            <p className="text-sm text-amber-600 mb-4">
              Nous rencontrons des difficultés à charger vos données. Veuillez essayer de rafraîchir la page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Rafraîchir la page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
