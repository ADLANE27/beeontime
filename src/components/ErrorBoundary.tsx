import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from "sonner";

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Une erreur inattendue s'est produite
            </h1>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/portal';
              }}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Retourner à l'accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}