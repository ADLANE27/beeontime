
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from "sonner";
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    toast.error("Une erreur inattendue s'est produite");
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = this.props.fallbackRoute || '/portal';
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Check if error is related to network connectivity
      const isNetworkError = this.state.error?.toString().includes('Failed to fetch') || 
                            this.state.error?.toString().includes('Network error');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-6">
            <div className="bg-red-50 p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Une erreur inattendue s'est produite
            </h1>
            
            {isNetworkError ? (
              <p className="text-gray-600 mb-6">
                Il semble y avoir un problème de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer.
              </p>
            ) : (
              <p className="text-gray-600 mb-6">
                Nous sommes désolés pour la gêne occasionnée. Veuillez réessayer ou retourner à l'accueil.
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRefresh}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Rafraîchir la page
              </Button>
              
              <Button
                onClick={this.handleReset}
                className="bg-primary text-white"
              >
                Retourner à l'accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
