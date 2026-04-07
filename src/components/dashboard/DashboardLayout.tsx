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
      <div className="relative min-h-screen w-full">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:h-[68px] sm:px-6 lg:px-10">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                <span className="font-display text-sm font-bold text-primary-foreground">R</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-display text-sm font-semibold leading-tight tracking-tight">
                  RH AFTraduction
                </div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Espace privé
                </div>
              </div>
            </div>

            {/* Center: command palette trigger */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="ring-focus group flex h-10 max-w-md flex-1 items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-3 text-sm text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground sm:gap-3"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left text-xs sm:text-sm">
                Rechercher une section, une action…
              </span>
              <kbd className="hidden h-6 select-none items-center gap-1 rounded-md border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                <span>⌘</span>K
              </kbd>
            </button>

            {/* Right: theme + user + logout */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              <div className="hidden h-8 w-px bg-border md:block" />

              {user?.email && (
                <div className="hidden items-center gap-2.5 md:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 to-accent/10 text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs font-medium text-foreground">
                      {user.email.split("@")[0]}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
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
                className="ring-focus h-10 w-10 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>
    </PaletteContext.Provider>
  );
};
