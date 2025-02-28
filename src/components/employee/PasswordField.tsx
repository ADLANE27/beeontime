import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { generateSecurePassword } from "@/utils/passwordGenerator";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  label?: string;
}

export const PasswordField = ({ 
  value, 
  onChange, 
  isRequired = false,
  label = "Mot de passe initial"
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    onChange(newPassword);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="password">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={isRequired}
            className="pr-10"
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
    </div>
  );
};