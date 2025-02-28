
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// Define a more specific return type for better type safety
type Employee = any; // Replace with your actual Employee type if available
type EmployeesQueryResult = UseQueryResult<Employee[], Error> & {
  isAuthError: boolean;
};

export const useEmployeesList = (): EmployeesQueryResult => {
  const { session, isLoading: authLoading } = useAuth();
  
  const query = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        console.log("Fetching employees list...");
        
        // Check if we have an active session
        if (!session) {
          console.log("No active session, aborting employees fetch");
          const authError = new Error("Authentication required");
          // Add a custom property to identify auth errors
          (authError as any).isAuthError = true;
          throw authError;
        }
        
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("last_name", { ascending: true });

        if (error) {
          console.error("Error fetching employees:", error);
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} employees`);
        return data || []; // Return empty array if no data to prevent null errors
      } catch (error: any) {
        console.error("Error in employee list query:", error);
        
        // Differentiate between auth errors and other errors for better UX
        if (error.isAuthError) {
          console.log("Authentication error detected");
          // Don't show toast for auth errors as they're expected when not logged in
          throw error;
        } else {
          toast.error("Erreur lors du chargement des employés");
          throw error; // Re-throw to let react-query handle it
        }
      }
    },
    enabled: !authLoading, // Only run the query when auth state is determined
    retry: (failureCount, error: any) => {
      // Don't retry auth errors, but retry other errors once
      return !error.isAuthError && failureCount < 1;
    },
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes (previously called cacheTime)
  });

  // Extend the query result with an isAuthError flag
  return {
    ...query,
    isAuthError: query.error ? (query.error as any).isAuthError === true : false
  };
};
