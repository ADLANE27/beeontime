
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useEmployeesList = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      console.log("Fetching employees list");
      // First check profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role");
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }
      
      console.log("Profiles found:", profiles?.length || 0);
      
      // Then check employees table
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email")
        .order("last_name", { ascending: true });

      if (employeesError) {
        console.error("Error fetching employees:", employeesError);
        throw employeesError;
      }
      
      console.log("Employees found:", employees?.length || 0);
      
      // Log discrepancies
      if (profiles && employees) {
        const profileIds = profiles.map(p => p.id);
        const employeeIds = employees.map(e => e.id);
        
        const inProfileButNotEmployee = profiles.filter(p => !employeeIds.includes(p.id));
        const inEmployeeButNotProfile = employees.filter(e => !profileIds.includes(e.id));
        
        if (inProfileButNotEmployee.length > 0) {
          console.log("Users in profiles but not in employees:", inProfileButNotEmployee);
        }
        
        if (inEmployeeButNotProfile.length > 0) {
          console.log("Users in employees but not in profiles:", inEmployeeButNotProfile);
        }
      }
      
      return employees || [];
    },
  });
};
