import { Link } from "react-router-dom";
import { ArrowUpRight, Briefcase, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const RoleSelector = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
            <span className="font-display text-base font-bold text-primary-foreground">R</span>
          </div>
          <div className="font-display text-base font-semibold tracking-tight">
            RH AFTraduction
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-12 sm:px-10 sm:pt-20">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-primary to-accent" />
          Plateforme RH — édition 2026
        </div>

        <h1 className="text-center font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Bienvenue sur{" "}
          <span className="text-gradient">RH AFTraduction</span>
        </h1>
        <p className="mt-5 max-w-xl text-center text-base text-muted-foreground sm:text-lg">
          Sélectionnez votre profil pour accéder à votre espace personnel.
        </p>

        <div className="mt-12 grid w-full gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6">
          <RoleCard
            to="/portal"
            icon={Users}
            title="Employé"
            description="Pointage, congés, heures supplémentaires et documents personnels."
            tint="from-primary/20 via-primary/5 to-transparent"
          />
          <RoleCard
            to="/hr-portal"
            icon={Briefcase}
            title="Responsable RH"
            description="Pilotage des employés, planning, paies et événements RH."
            tint="from-accent/20 via-accent/5 to-transparent"
          />
        </div>

        <p className="mt-12 text-center text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} RH AFTraduction · Tous droits réservés
        </p>
      </main>
    </div>
  );
};

interface RoleCardProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tint: string;
}

const RoleCard = ({ to, icon: Icon, title, description, tint }: RoleCardProps) => (
  <Link
    to={to}
    className="ring-focus group relative isolate overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevation"
  >
    <div
      className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${tint} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
    />

    <div className="flex items-start justify-between">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-accent group-hover:text-primary-foreground group-hover:shadow-glow">
        <Icon className="h-5 w-5" />
      </div>
      <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </div>

    <h2 className="mt-8 font-display text-2xl font-semibold tracking-tight">
      {title}
    </h2>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
      {description}
    </p>
  </Link>
);

export default RoleSelector;
