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
    if (user?.id) {
      fetchProfile();
    } else if (user === null) {
      // User is explicitly null (not authenticated)
      setProfile(null);
      setLoading(false);
    }
    // If user is undefined, keep loading (auth state not yet determined)
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) {
      console.log("No user ID available for profile fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching profile for user:", user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Profile fetch error:", error);
        throw error;
      }

      // If no profile exists, create a default one
      if (!data) {
        console.log(
          "No profile found, creating default profile for user:",
          user.id,
        );

        // Get user email from auth
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth user fetch error:", authError);
          throw authError;
        }

        const defaultProfile = {
          user_id: user.id,
          full_name: authUser?.email?.split("@")[0] || "User Baru",
          position: "Staff",
          department: "Umum",
          employee_id: `EMP-${Date.now().toString().slice(-6)}`,
        };

        console.log("Creating profile with data:", defaultProfile);

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert(defaultProfile)
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        }

        console.log("Profile created successfully:", newProfile);
        setProfile(newProfile);
      } else {
        console.log("Profile found:", data);
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching/creating profile:", error);
      // Set a minimal profile to prevent infinite loading
      setProfile({
        id: "temp",
        user_id: user.id,
        full_name: "Error Loading Profile",
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
