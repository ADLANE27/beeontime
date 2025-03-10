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
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Informations personnelles</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => onFieldChange("firstName", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => onFieldChange("lastName", e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onFieldChange("email", e.target.value)}
          required
        />
      </div>
      <PasswordField 
        value={initialPassword}
        onChange={(value) => onFieldChange("initialPassword", value)}
      />
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => onFieldChange("phone", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthDate">Date de naissance</Label>
        <Input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => onFieldChange("birthDate", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthPlace">Lieu de naissance</Label>
        <Input
          id="birthPlace"
          value={birthPlace}
          onChange={(e) => onFieldChange("birthPlace", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthCountry">Pays de naissance</Label>
        <Input
          id="birthCountry"
          value={birthCountry}
          onChange={(e) => onFieldChange("birthCountry", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="socialSecurityNumber">Numéro de sécurité sociale</Label>
        <Input
          id="socialSecurityNumber"
          value={socialSecurityNumber}
          onChange={(e) => onFieldChange("socialSecurityNumber", e.target.value)}
          required
        />
      </div>
    </div>
  );
};