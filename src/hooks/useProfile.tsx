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
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // If no profile exists, create a default one
      if (!data) {
        console.log(
          "No profile found, creating default profile for user:",
          user?.id,
        );

        // Get user email from auth
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        const defaultProfile = {
          user_id: user?.id,
          full_name: authUser?.email?.split("@")[0] || "User Baru",
          position: "Staff",
          department: "Umum",
          employee_id: `EMP-${Date.now().toString().slice(-6)}`,
        };

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert(defaultProfile)
          .select()
          .single();

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw insertError;
        }

        setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching/creating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, fetchProfile };
}
