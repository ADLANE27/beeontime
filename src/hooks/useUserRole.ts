
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type UserRole = "hr" | "employee" | null;

interface UseUserRoleResult {
  role: UserRole;
  isLoading: boolean;
  hasRole: (requiredRole: "hr" | "employee") => boolean;
}

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        } else {
          setRole(data?.role as UserRole || null);
        }
      } catch (error) {
        console.error("Unexpected error fetching user role:", error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  const hasRole = (requiredRole: "hr" | "employee"): boolean => {
    if (!role) return false;
    // HR users can access both HR and employee dashboards
    if (role === "hr") return true;
    // Employee users can only access employee dashboard
    return role === requiredRole;
  };

  return { role, isLoading, hasRole };
}
