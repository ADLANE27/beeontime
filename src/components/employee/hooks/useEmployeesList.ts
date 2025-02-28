
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useEmployeesList = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        console.log("Fetching employees list...");
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
        toast.error("Erreur lors du chargement des employés");
        return []; // Return empty array instead of throwing to prevent query retry loops
      }
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes (previously called cacheTime)
  });
};
