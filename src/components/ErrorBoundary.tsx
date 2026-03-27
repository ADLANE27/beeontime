import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from "sonner";
import { RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    toast.error("Une erreur inattendue s'est produite");
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-slate-50 to-blue-50/30">
          <div className="text-center max-w-md px-6 animate-fade-in">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-red-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Quelque chose s'est mal passé
            </h1>
            <p className="text-muted-foreground mb-8 text-sm">
              Une erreur inattendue est survenue. Vous pouvez réessayer ou revenir à l'accueil.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/portal';
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border bg-background text-foreground rounded-xl hover:bg-muted transition-colors font-medium text-sm"
              >
                <Home className="h-4 w-4" />
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
