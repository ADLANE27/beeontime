
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useEmployeesList = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("last_name", { ascending: true });

        if (error) throw error;
        return data || []; // Return empty array if no data to prevent null errors
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast.error("Erreur lors du chargement des employés");
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
  });
};
