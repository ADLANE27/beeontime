
import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { LoginErrorAlert } from "./LoginErrorAlert";
import { NetworkStatusAlert } from "./NetworkStatusAlert";

interface LoginFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  loginError: string | null;
  authError: Error | null;
  isLoading: boolean;
  networkStatus: 'online' | 'offline' | 'checking';
  onCheckNetwork: () => void;
}

export const LoginForm = ({
  onSubmit,
  loginError,
  authError,
  isLoading,
  networkStatus,
  onCheckNetwork
}: LoginFormProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-3 rounded-full shadow-sm">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-primary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
              />
            </svg>
          </div>
          <img 
            src="/lovable-uploads/ebd70f88-aacb-40cd-b225-d94a0c0f1903.png" 
            alt="AFTraduction Logo" 
            className="h-16 w-auto"
          />
          <h1 className="text-2xl font-bold text-gray-900">Portail RH</h1>
          <p className="text-sm text-gray-600 text-center">
            Connectez-vous pour accéder à l'espace RH
          </p>
        </div>

        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <NetworkStatusAlert 
            isOffline={networkStatus === 'offline'} 
            onCheck={onCheckNetwork}
          />
          
          <div className="flex items-center gap-2 mb-6 p-3 bg-primary/5 rounded-lg">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Connexion sécurisée</span>
          </div>

          <LoginErrorAlert error={loginError} authError={authError} />

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <input 
                id="email"
                name="email"
                type="email" 
                className="bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg w-full p-2.5 border"
                placeholder="Votre adresse email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input 
                id="password"
                name="password"
                type="password" 
                className="bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg w-full p-2.5 border"
                placeholder="Votre mot de passe"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-600 mt-8">
          © {new Date().getFullYear()} AFTraduction. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};
