
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
    profileFetchAttempted,
    setProfile
  } = useAuthState();
  
  // Combine loading states more explicitly
  const isLoading = stateLoading || isLoadingOverride;
  
  const { signIn, signOut } = useAuthMethods(setProfile, setIsLoadingOverride);

  // Set auth ready state when initialization is complete
  useEffect(() => {
    if (authInitialized) {
      console.log("Auth initialized, setting authReady to true");
      setAuthReady(true);
    }
  }, [authInitialized]);

  // Debug auth state changes
  useEffect(() => {
    console.log("Auth state updated:", {
      session: !!session,
      profile: !!profile,
      isLoading,
      authReady,
      profileFetchAttempted
    });
  }, [session, profile, isLoading, authReady, profileFetchAttempted]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        authReady,
        profileFetchAttempted,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
