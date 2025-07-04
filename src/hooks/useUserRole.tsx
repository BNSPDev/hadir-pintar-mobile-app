import React, { useState, useEffect } from "react";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserRole();
    } else if (user === null) {
      // User is explicitly null (not authenticated)
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    setError(null);
    if (!user?.id) {
      const noUserMsg = "No user ID available for role fetch";
      console.log(noUserMsg);
      setError(noUserMsg);
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching role for user:", user.id);

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Role fetch error:", error);
        setError(error.message || "Role fetch error");
        // Set default role on error and finish loading
        setUserRole({
          id: "error",
          user_id: user.id,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      if (data) {
        console.log("Role found:", data);
        setUserRole(data);
      } else {
        const notFoundMsg = "No role found for user: " + user.id;
        console.log(notFoundMsg);
        setError(notFoundMsg);
        // Set default role instead of trying to create one
        setUserRole({
          id: "default",
          user_id: user.id,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching user role:", error);
      setError(error.message || "Unknown error fetching user role");
      // Set a default role to prevent infinite loading
      setUserRole({
        id: "temp",
        user_id: user.id,
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
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

  return { userRole, loading, error, isAdmin, updateRole, fetchUserRole };
}
