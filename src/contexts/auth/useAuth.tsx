
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// Le hook useAuth doit être une fonction qui utilise le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
