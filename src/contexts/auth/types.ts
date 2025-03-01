
// Types for the auth context
export type Profile = {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string; // Making email required to match database schema
  role: "hr" | "employee";
};
