import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import type { LucideIcon } from "lucide-react";

export interface HRCommandItem {
  value: string;
  label: string;
  icon: LucideIcon;
  badge?: number | null;
}

interface HRCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: HRCommandItem[];
  onSelect: (value: string) => void;
  onSignOut?: () => void;
}

export const HRCommandPalette = ({
  open,
  onOpenChange,
  items,
  onSelect,
  onSignOut,
}: HRCommandPaletteProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const handleSelect = (value: string) => {
    onSelect(value);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une section, une action..." />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.value}
                value={item.label}
                onSelect={() => handleSelect(item.value)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
                {item.badge ? (
                  <CommandShortcut>{item.badge}</CommandShortcut>
                ) : null}
              </CommandItem>
            );
          })}
        </CommandGroup>
        {onSignOut && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Compte">
              <CommandItem value="Déconnexion" onSelect={onSignOut}>
                Se déconnecter
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};
