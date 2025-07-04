import { useState, useEffect } from "react";
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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (user?.id) {
      fetchProfile();
      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.warn("Profile fetch timeout, setting fallback profile");
        setProfile({
          id: "timeout",
          user_id: user.id,
          full_name: "Timeout Loading",
          position: "Staff",
          department: "Umum",
          employee_id: "N/A",
        });
        setLoading(false);
      }, 10000); // 10 second timeout
    } else if (user === null) {
      // User is explicitly null (not authenticated)
      setProfile(null);
      setLoading(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) {
      console.log("No user ID available for profile fetch");
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
        // Don't throw, just set empty profile and continue
        setProfile({
          id: "error",
          user_id: user.id,
          full_name: "Profile Error",
          position: "Staff",
          department: "Umum",
          employee_id: "N/A",
        });
        return;
      }

      if (data) {
        console.log("Profile found:", data);
        setProfile(data);
      } else {
        console.log("No profile found for user:", user.id);
        // Set a temporary profile instead of trying to create one
        setProfile({
          id: "missing",
          user_id: user.id,
          full_name: "Profile Missing",
          position: "Staff",
          department: "Umum",
          employee_id: "N/A",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Set a minimal profile to prevent infinite loading
      setProfile({
        id: "temp",
        user_id: user.id,
        full_name: "Loading Error",
        position: "Staff",
        department: "Umum",
        employee_id: "N/A",
      });
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, fetchProfile };
}
