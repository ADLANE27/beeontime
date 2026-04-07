import { Link } from "react-router-dom";
import { Users, Briefcase } from "lucide-react";

const RoleSelector = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-3xl text-center space-y-10">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-foreground">
            Bienvenue sur RH AFTraduction
          </h1>
          <p className="text-lg text-muted-foreground">
            Sélectionnez votre profil pour accéder à votre espace
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            to="/portal"
            className="group rounded-2xl border border-input bg-card p-8 text-left shadow-sm transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-foreground">
                  Employé
                </h2>
                <p className="text-sm text-muted-foreground">
                  Accédez à votre espace personnel : pointage, congés,
                  absences et documents.
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/hr-portal"
            className="group rounded-2xl border border-input bg-card p-8 text-left shadow-sm transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Briefcase className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-foreground">
                  Responsable RH
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gestion des employés, des plannings, des paies et des
                  événements RH.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
