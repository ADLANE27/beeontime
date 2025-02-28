
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export const LoadingScreen = ({
  message = "Chargement...",
  fullScreen = false,
  size = "md"
}: LoadingScreenProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[200px]'} bg-background`}>
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
};
