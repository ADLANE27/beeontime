
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    onChange(newPassword);
    validatePassword(newPassword);
  };

  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Longueur minimale
    if (password.length >= 8) strength += 1;
    
    // Présence de majuscules
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Présence de minuscules
    if (/[a-z]/.test(password)) strength += 1;
    
    // Présence de chiffres
    if (/[0-9]/.test(password)) strength += 1;
    
    // Présence de caractères spéciaux
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  const validatePassword = (password: string) => {
    if (!password && isRequired) {
      setPasswordError("Le mot de passe est requis");
      setPasswordStrength(0);
      return false;
    }
    
    if (password && password.length < 8) {
      setPasswordError("Le mot de passe doit contenir au moins 8 caractères");
      setPasswordStrength(calculatePasswordStrength(password));
      return false;
    }

    setPasswordError(null);
    setPasswordStrength(calculatePasswordStrength(password));
    return true;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    onChange(newPassword);
    validatePassword(newPassword);
  };

  const getStrengthLabel = (strength: number): string => {
    if (strength === 0) return "Très faible";
    if (strength === 1) return "Faible";
    if (strength === 2) return "Moyen";
    if (strength === 3) return "Bon";
    if (strength === 4) return "Fort";
    if (strength === 5) return "Excellent";
    return "Inconnu";
  };

  const getStrengthColor = (strength: number): string => {
    if (strength === 0) return "bg-red-500";
    if (strength === 1) return "bg-red-400";
    if (strength === 2) return "bg-orange-400";
    if (strength === 3) return "bg-yellow-400";
    if (strength === 4) return "bg-green-400";
    if (strength === 5) return "bg-green-600";
    return "bg-gray-300";
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
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getStrengthColor(passwordStrength)} transition-all duration-300`}
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              ></div>
            </div>
            <span className="font-medium whitespace-nowrap">
              {getStrengthLabel(passwordStrength)}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 mt-2">
            <div className="flex flex-col items-center">
              <div className={`h-1 w-full rounded ${value.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1 text-xs">8+ car.</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`h-1 w-full rounded ${/[A-Z]/.test(value) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1 text-xs">Maj.</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`h-1 w-full rounded ${/[a-z]/.test(value) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1 text-xs">Min.</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`h-1 w-full rounded ${/[0-9]/.test(value) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1 text-xs">Chiffre</span>
            </div>
            <div className="flex flex-col items-center">
              <div className={`h-1 w-full rounded ${/[^A-Za-z0-9]/.test(value) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="mt-1 text-xs">Symbole</span>
            </div>
          </div>
        </div>
      )}
      {isEditing && value && !passwordError && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex gap-2 items-center text-sm text-yellow-800">
            <CheckCircle2 size={16} className="text-yellow-600 shrink-0" />
            <span>
              Le mot de passe sera mis à jour pour cet employé. Si c'est votre propre compte, vous serez déconnecté automatiquement.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
