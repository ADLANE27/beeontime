
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewEmployee } from "@/types/hr";
import { PasswordField } from "./PasswordField";

export interface PersonalInfoFormProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthPlace: string;
  birthCountry: string;
  socialSecurityNumber: string;
  initialPassword: string;
  onFieldChange: (field: keyof NewEmployee, value: string) => void;
}

export const PersonalInfoForm = ({
  firstName,
  lastName,
  email,
  phone,
  birthDate,
  birthPlace,
  birthCountry,
  socialSecurityNumber,
  initialPassword,
  onFieldChange,
}: PersonalInfoFormProps) => {
  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border">
      <h3 className="text-xl font-medium">Informations personnelles</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => onFieldChange("firstName", e.target.value)}
            className="h-12"
            required
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => onFieldChange("lastName", e.target.value)}
            className="h-12"
            required
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onFieldChange("email", e.target.value)}
          className="h-12"
          required
        />
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="initialPassword">Mot de passe initial</Label>
        <PasswordField 
          value={initialPassword}
          onChange={(value) => onFieldChange("initialPassword", value)}
        />
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => onFieldChange("phone", e.target.value)}
          className="h-12"
          required
        />
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="birthDate">Date de naissance</Label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => onFieldChange("birthDate", e.target.value)}
          className="h-12"
          required
        />
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="birthPlace">Lieu de naissance</Label>
        <Input
          id="birthPlace"
          value={birthPlace}
          onChange={(e) => onFieldChange("birthPlace", e.target.value)}
          className="h-12"
          required
        />
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="birthCountry">Pays de naissance</Label>
        <Input
          id="birthCountry"
          value={birthCountry}
          onChange={(e) => onFieldChange("birthCountry", e.target.value)}
          className="h-12"
          required
        />
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="socialSecurityNumber">Numéro de sécurité sociale</Label>
        <Input
          id="socialSecurityNumber"
          value={socialSecurityNumber}
          onChange={(e) => onFieldChange("socialSecurityNumber", e.target.value)}
          className="h-12"
          required
        />
      </div>
    </div>
  );
};
