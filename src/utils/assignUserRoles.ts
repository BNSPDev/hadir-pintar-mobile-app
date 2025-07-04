import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to assign "user" role to all users who don't have roles
 */
export async function assignRolesToAllUsers() {
  try {
    console.log("Starting role assignment process...");

    // Get all profiles (all users)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name");

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log("No profiles found");
      return { success: false, message: "No profiles found" };
    }

    console.log(`Found ${profiles.length} profiles`);

    // Get existing roles
    const { data: existingRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.warn("Error fetching existing roles:", rolesError);
    }

    // Create a set of user_ids that already have roles
    const usersWithRoles = new Set(existingRoles?.map((r) => r.user_id) || []);

    // Find users without roles
    const usersWithoutRoles = profiles.filter(
      (p) => !usersWithRoles.has(p.user_id),
    );

    console.log(`Users without roles: ${usersWithoutRoles.length}`);
    console.log(
      "Users needing roles:",
      usersWithoutRoles.map((u) => u.full_name),
    );

    if (usersWithoutRoles.length === 0) {
      return {
        success: true,
        message: "All users already have roles",
        assigned: 0,
        total: profiles.length,
      };
    }

    // Assign "user" role to users without roles
    const rolesToInsert = usersWithoutRoles.map((user) => ({
      user_id: user.user_id,
      role: "user",
    }));

    const { data: insertedRoles, error: insertError } = await supabase
      .from("user_roles")
      .insert(rolesToInsert)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert roles: ${insertError.message}`);
    }

    console.log(
      `Successfully assigned roles to ${insertedRoles?.length || 0} users`,
    );

    return {
      success: true,
      message: `Successfully assigned "user" role to ${insertedRoles?.length || 0} users`,
      assigned: insertedRoles?.length || 0,
      total: profiles.length,
    };
  } catch (error: any) {
    console.error("Error assigning roles:", error);
    return {
      success: false,
      message: error.message || "Failed to assign roles",
      assigned: 0,
      total: 0,
    };
  }
}
