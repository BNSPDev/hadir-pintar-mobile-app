import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to repair and ensure all users have complete profile and role data
 */

export interface RepairResult {
  totalUsers: number;
  createdProfiles: number;
  createdRoles: number;
  errors: string[];
}

/**
 * Check and repair user data for all users in the system
 * This helps ensure all users have complete profiles and roles
 */
export async function repairUserData(): Promise<RepairResult> {
  const result: RepairResult = {
    totalUsers: 0,
    createdProfiles: 0,
    createdRoles: 0,
    errors: [],
  };

  try {
    // Get all unique user_ids from multiple sources to catch all users

    // 1. Get users from attendance records (active users)
    const { data: attendanceRecords, error: attendanceError } = await supabase
      .from("attendance_records")
      .select("user_id");

    if (attendanceError) {
      result.errors.push(
        `Failed to fetch attendance records: ${attendanceError.message}`,
      );
    }

    // 2. Get users from profiles (users with existing profiles)
    const { data: profileRecords, error: profileError } = await supabase
      .from("profiles")
      .select("user_id");

    if (profileError) {
      result.errors.push(
        `Failed to fetch profile records: ${profileError.message}`,
      );
    }

    // 3. Get users from user_roles (users with roles)
    const { data: roleRecords, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id");

    if (roleError) {
      result.errors.push(`Failed to fetch role records: ${roleError.message}`);
    }

    // Combine all user_ids from different sources
    const allUserIds = [
      ...(attendanceRecords?.map((r) => r.user_id) || []),
      ...(profileRecords?.map((r) => r.user_id) || []),
      ...(roleRecords?.map((r) => r.user_id) || []),
    ];

    const uniqueUserIds = [...new Set(allUserIds)];
    result.totalUsers = uniqueUserIds.length;

    console.log(`Found ${uniqueUserIds.length} unique users across all sources:
      - ${attendanceRecords?.length || 0} from attendance
      - ${profileRecords?.length || 0} from profiles
      - ${roleRecords?.length || 0} from roles`);

    // Check each user for missing profile and role
    for (const userId of uniqueUserIds) {
      try {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          result.errors.push(
            `Error checking profile for ${userId}: ${profileError.message}`,
          );
          continue;
        }

        // Create profile if it doesn't exist
        if (!profile) {
          const { error: createProfileError } = await supabase
            .from("profiles")
            .insert({
              user_id: userId,
              full_name: `User ${userId.slice(-6)}`,
              position: "Staff",
              department: "Umum",
              employee_id: `EMP-${Date.now().toString().slice(-6)}`,
            });

          if (createProfileError) {
            result.errors.push(
              `Failed to create profile for ${userId}: ${createProfileError.message}`,
            );
          } else {
            result.createdProfiles++;
            console.log(`Created profile for user ${userId}`);
          }
        }

        // Check if role exists
        const { data: role, error: roleError } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (roleError && roleError.code !== "PGRST116") {
          result.errors.push(
            `Error checking role for ${userId}: ${roleError.message}`,
          );
          continue;
        }

        // Create role if it doesn't exist
        if (!role) {
          const { error: createRoleError } = await supabase
            .from("user_roles")
            .insert({
              user_id: userId,
              role: "user",
            });

          if (createRoleError) {
            result.errors.push(
              `Failed to create role for ${userId}: ${createRoleError.message}`,
            );
          } else {
            result.createdRoles++;
            console.log(`Created role for user ${userId}`);
          }
        }
      } catch (userError: any) {
        result.errors.push(
          `Error processing user ${userId}: ${userError.message}`,
        );
      }
    }

    console.log("User data repair completed:", result);
    return result;
  } catch (error: any) {
    result.errors.push(`General error: ${error.message}`);
    return result;
  }
}

/**
 * Check if the current user has admin privileges
 */
export async function checkAdminStatus(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    return role?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}
