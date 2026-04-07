import { Button } from "@/components/ui/button";
import { LogOut, Search } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { createContext, useContext, useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface CommandPaletteCtx {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PaletteContext = createContext<CommandPaletteCtx | null>(null);

export const useDashboardPalette = () => useContext(PaletteContext);

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
    toast.success("Vous avez été déconnecté");
  };

  const initials = (user?.email || "?")
    .split("@")[0]
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <PaletteContext.Provider value={{ open: paletteOpen, setOpen: setPaletteOpen }}>
      <div className="relative min-h-[100dvh] w-full">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl pt-safe">
          <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 sm:h-[68px] sm:gap-4 sm:px-6 lg:px-10">
            {/* Brand */}
            <div className="flex shrink-0 items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                <span className="font-display text-sm font-bold text-primary-foreground">R</span>
              </div>
              <div className="hidden md:block">
                <div className="font-display text-sm font-semibold leading-tight tracking-tight">
                  RH AFTraduction
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Espace privé
                </div>
              </div>
            </div>

            {/* Center: command palette trigger
                Desktop: full search-input look
                Mobile: icon-only square */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Rechercher une section ou une action"
              className="ring-focus tap-target group ml-auto hidden h-10 max-w-md flex-1 items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground sm:flex"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-left text-sm">
                Rechercher une section, une action…
              </span>
              <kbd className="inline-flex h-6 select-none items-center gap-1 rounded-md border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span>⌘</span>K
              </kbd>
            </button>

            {/* Right cluster */}
            <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-2">
              {/* Mobile-only search icon */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPaletteOpen(true)}
                aria-label="Rechercher"
                className="ring-focus tap-target h-10 w-10 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
              >
                <Search className="h-[18px] w-[18px]" />
              </Button>

              <ThemeToggle />

              <div className="hidden h-7 w-px bg-border md:block" />

              {user?.email && (
                <div className="hidden items-center gap-2.5 md:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 to-accent/10 text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs font-medium leading-tight text-foreground">
                      {user.email.split("@")[0]}
                    </div>
                    <div className="text-[10px] leading-tight text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label="Se déconnecter"
                className="ring-focus tap-target h-10 w-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 pb-safe sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>
    </PaletteContext.Provider>
  );
};
