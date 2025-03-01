
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// Hook personnalisé pour accéder au contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
