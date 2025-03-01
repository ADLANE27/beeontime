
import React from "react";
import { AuthContext } from "./AuthContext";
import { useAuthState } from "./useAuthState";
import { useAuthMethods } from "./useAuthMethods";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    session,
    user,
    profile,
    isLoading: stateLoading,
    authReady,
    profileFetchAttempted,
    authError,
    setProfile,
    refreshSession
  } = useAuthState();
  
  // Get auth methods
  const { signIn, signOut } = useAuthMethods(setProfile, (loading) => {
    // This function is intentionally empty as we manage loading state in useAuthState
    // This fixes the issue where isLoading was being overridden incorrectly
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading: stateLoading,
        authReady,
        profileFetchAttempted,
        authError,
        signIn,
        signOut,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
