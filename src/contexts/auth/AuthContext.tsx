
import { createContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { Profile } from "./types";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  authReady: boolean;
  profileFetchAttempted?: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: {
      user: User | null;
      session: Session | null;
    };
  }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  authReady: false,
  profileFetchAttempted: false,
  signIn: async () => ({
    error: null,
    data: {
      user: null,
      session: null,
    },
  }),
  signOut: async () => {},
});
