
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
    authInitialized,
    profileFetchAttempted,
    authError,
    setProfile
  } = useAuthState();
  
  // Combine loading states
  const isLoading = stateLoading || isLoadingOverride;
  
  // Get auth methods
  const { signIn, signOut } = useAuthMethods(setProfile, setIsLoadingOverride);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        authReady: authInitialized,
        profileFetchAttempted,
        authError,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
