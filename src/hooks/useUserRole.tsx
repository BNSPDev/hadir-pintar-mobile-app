import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export function useUserRole() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      // If no role exists, create default user role
      if (!data) {
        const { data: newRole, error: insertError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user?.id,
            role: "user",
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setUserRole(newRole);
      } else {
        setUserRole(data);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return userRole?.role === "admin";
  };

  const updateRole = async (newRole: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", user?.id);

      if (error) throw error;
      await fetchUserRole();
      return { success: true };
    } catch (error) {
      console.error("Error updating role:", error);
      return { success: false, error };
    }
  };

  return { userRole, loading, isAdmin, updateRole, fetchUserRole };
}
