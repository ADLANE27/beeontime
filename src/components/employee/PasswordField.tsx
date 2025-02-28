
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { generateSecurePassword } from "@/utils/passwordGenerator";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  label?: string;
  isEditing?: boolean;
}

export const PasswordField = ({ 
  value, 
  onChange, 
  isRequired = false,
  label = "Mot de passe initial",
  isEditing = false
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    onChange(newPassword);
    validatePassword(newPassword);
  };

  const validatePassword = (password: string) => {
    if (!password && isRequired) {
      setPasswordError("Le mot de passe est requis");
      return false;
    }
    
    if (password && password.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères");
      return false;
    }

    setPasswordError(null);
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    onChange(newPassword);
    validatePassword(newPassword);
  };

  useEffect(() => {
    // Validation au chargement du composant
    if (value) {
      validatePassword(value);
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="password">{label}</Label>
        {isEditing && (
          <div className="text-sm text-gray-500 italic">
            Laissez vide pour ne pas modifier le mot de passe
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={handlePasswordChange}
            required={isRequired}
            className={`pr-10 ${passwordError ? 'border-red-500' : ''}`}
            placeholder={isEditing ? "••••••••" : ""}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGeneratePassword}
              >
                <RefreshCw size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Générer un mot de passe sécurisé</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {passwordError && (
        <div className="text-red-500 text-sm flex items-center gap-1 mt-1">
          <AlertCircle size={14} />
          <span>{passwordError}</span>
        </div>
      )}
      {value && !passwordError && (
        <div className="text-xs text-gray-500 mt-1">
          <div className="flex gap-2 mb-1">
            <div className={`h-1 flex-1 rounded ${value.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`h-1 flex-1 rounded ${/[A-Z]/.test(value) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`h-1 flex-1 rounded ${/[a-z]/.test(value) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`h-1 flex-1 rounded ${/[0-9]/.test(value) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`h-1 flex-1 rounded ${/[^A-Za-z0-9]/.test(value) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          </div>
          <div className="flex justify-between text-xs">
            <span>8+ caractères</span>
            <span>Majuscule</span>
            <span>Minuscule</span>
            <span>Chiffre</span>
            <span>Symbole</span>
          </div>
        </div>
      )}
    </div>
  );
};
