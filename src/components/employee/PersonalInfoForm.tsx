import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PersonalInfoFormProps } from "./types/employee-form";
import { User } from "lucide-react";

export const PersonalInfoForm = ({
  firstName,
  lastName,
  email,
  phone,
  birthDate,
  birthPlace,
  birthCountry,
  socialSecurityNumber,
  onFieldChange,
}: PersonalInfoFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Informations personnelles</h3>
      </div>
      
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

      <div className="grid grid-cols-2 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
};