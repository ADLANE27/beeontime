
import { Session, User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role: "hr" | "employee";
};

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};
