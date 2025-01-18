import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NewEmployee } from "@/types/hr";

export interface AddressInfoFormProps {
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  onFieldChange: (field: keyof NewEmployee, value: string) => void;
}

export const AddressInfoForm = ({
  streetAddress,
  city,
  postalCode,
  country,
  onFieldChange,
}: AddressInfoFormProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Adresse</h3>
      <div className="space-y-2">
        <Label htmlFor="streetAddress">Adresse</Label>
        <Input
          id="streetAddress"
          value={streetAddress}
          onChange={(e) => onFieldChange("streetAddress", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => onFieldChange("city", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Code postal</Label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(e) => onFieldChange("postalCode", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Pays</Label>
        <Input
          id="country"
          value={country}
          onChange={(e) => onFieldChange("country", e.target.value)}
        />
      </div>
    </div>
  );
};