import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  position: string;
  department: string;
  employee_id: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    } else if (user === null) {
      // User is explicitly null (not authenticated)
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    setError(null);
    if (!user?.id) {
      const noUserMsg = "No user ID available for profile fetch";
      console.log(noUserMsg);
      setError(noUserMsg);
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching profile for user:", user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Profile fetch error:", error);
        setError(error.message || "Profile fetch error");
        // Set fallback profile on error
        setProfile({
          id: "error",
          user_id: user.id,
          full_name: "Error Loading Profile",
          position: "Staff",
          department: "Umum",
          employee_id: "N/A",
        });
        setLoading(false);
        return;
      }

      if (data) {
        console.log("Profile found:", data);
        setProfile(data);
      } else {
        const notFoundMsg = "No profile found for user: " + user.id;
        console.log(notFoundMsg);
        setError(notFoundMsg);
        // Create a basic profile for users without one
        setProfile({
          id: "missing",
          user_id: user.id,
          full_name: "Profile Not Found",
          position: "Staff",
          department: "Umum",
          employee_id: "N/A",
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      setError(error.message || "Unknown error fetching profile");
      // Set a minimal profile to prevent infinite loading
      setProfile({
        id: "temp",
        user_id: user.id,
        full_name: "Failed to Load Profile",
        position: "Staff",
        department: "Umum",
        employee_id: "N/A",
      });
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, fetchProfile };
}
