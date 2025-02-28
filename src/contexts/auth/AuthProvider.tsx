
import React, { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { useAuthState } from "./useAuthState";
import { useAuthMethods } from "./useAuthMethods";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoadingOverride, setIsLoadingOverride] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  const {
    session,
    user,
    profile,
    isLoading: stateLoading,
    authInitialized,
    setProfile
  } = useAuthState();
  
  const isLoading = stateLoading || isLoadingOverride;
  const setIsLoading = setIsLoadingOverride;
  
  const { signIn, signOut } = useAuthMethods(setProfile, setIsLoading);

  // Set auth ready state when initialization is complete
  useEffect(() => {
    if (authInitialized) {
      setAuthReady(true);
    }
  }, [authInitialized]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        authReady,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
