
import React, { useState } from "react";
import { AuthContext } from "./AuthContext";
import { useAuthState } from "./useAuthState";
import { useAuthMethods } from "./useAuthMethods";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoadingOverride, setIsLoadingOverride] = useState(false);
  
  const {
    session,
    user,
    profile,
    isLoading: stateLoading,
    setProfile
  } = useAuthState();
  
  const isLoading = stateLoading || isLoadingOverride;
  const setIsLoading = setIsLoadingOverride;
  
  const { signIn, signOut } = useAuthMethods(setProfile, setIsLoading);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
