
import { createContext } from "react";
import { User, Session } from "@supabase/supabase-js";

// Define the profile type but it won't be used
export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  email?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean; // Always false
  profile: Profile | null; // Always null
  authReady: boolean; // Always true
  authError: Error | null;
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
  isLoading: false,
  profile: null,
  authReady: true,
  authError: null,
  signIn: async () => ({
    error: null,
    data: {
      user: null,
      session: null,
    },
  }),
  signOut: async () => {},
});
