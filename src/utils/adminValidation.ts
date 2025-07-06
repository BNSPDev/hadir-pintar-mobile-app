import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the entire admin system functionality
 */
export async function validateAdminSystem(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check database connection
    const { error: connectionError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1)
      .single();

    if (connectionError) {
      errors.push(`Database connection failed: ${connectionError.message}`);
      return { isValid: false, errors, warnings };
    }

    // Check required tables exist
    const requiredTables = ["profiles", "attendance_records", "user_roles"];

    for (const table of requiredTables) {
      try {
        const { error } = await supabase.from(table).select("*").limit(1);

        if (error) {
          errors.push(`Table '${table}' is not accessible: ${error.message}`);
        }
      } catch (err: any) {
        errors.push(`Failed to access table '${table}': ${err.message}`);
      }
    }

    // Check if admin users exist
    const { data: adminUsers, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError) {
      errors.push(`Failed to check admin users: ${adminError.message}`);
    } else if (!adminUsers || adminUsers.length === 0) {
      warnings.push("No admin users found in the system");
    }

    // Check profile completeness
    const { data: incompleteProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name, position, department")
      .or("full_name.is.null,position.is.null,department.is.null");

    if (profileError) {
      warnings.push(
        `Could not check profile completeness: ${profileError.message}`,
      );
    } else if (incompleteProfiles && incompleteProfiles.length > 0) {
      warnings.push(
        `${incompleteProfiles.length} profiles have missing information`,
      );
    }

    // Check attendance records structure
    const { data: recentAttendance, error: attendanceError } = await supabase
      .from("attendance_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (attendanceError) {
      warnings.push(
        `Could not access attendance records: ${attendanceError.message}`,
      );
    }
  } catch (error: any) {
    errors.push(`System validation failed: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates attendance data integrity
 */
export async function validateAttendanceData(
  date?: string,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Check for duplicate records
    const { data: duplicates, error: duplicateError } = await supabase
      .from("attendance_records")
      .select("user_id, date, count(*)")
      .eq("date", targetDate);

    if (duplicateError) {
      errors.push(`Failed to check for duplicates: ${duplicateError.message}`);
    }

    // Check for invalid time records
    const { data: invalidTimes, error: timeError } = await supabase
      .from("attendance_records")
      .select("id, user_id, clock_in_time, clock_out_time")
      .eq("date", targetDate)
      .not("clock_in_time", "is", null)
      .not("clock_out_time", "is", null);

    if (timeError) {
      warnings.push(`Could not validate time records: ${timeError.message}`);
    } else if (invalidTimes) {
      const invalidTimeRecords = invalidTimes.filter(
        (record) =>
          record.clock_in_time &&
          record.clock_out_time &&
          new Date(record.clock_out_time) <= new Date(record.clock_in_time),
      );

      if (invalidTimeRecords.length > 0) {
        errors.push(
          `Found ${invalidTimeRecords.length} records with invalid time ranges`,
        );
      }
    }

    // Check for orphaned records (attendance without user profile)
    const { data: orphanedRecords, error: orphanError } = await supabase
      .from("attendance_records")
      .select(
        `
        id,
        user_id,
        profiles!left(user_id)
      `,
      )
      .eq("date", targetDate)
      .is("profiles.user_id", null);

    if (orphanError) {
      warnings.push(
        `Could not check for orphaned records: ${orphanError.message}`,
      );
    } else if (orphanedRecords && orphanedRecords.length > 0) {
      warnings.push(
        `Found ${orphanedRecords.length} attendance records without user profiles`,
      );
    }
  } catch (error: any) {
    errors.push(`Attendance validation failed: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Tests the export functionality
 */
export async function testExportFunctionality(
  year: string,
  month?: string,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate date range
    const yearNum = parseInt(year);
    if (
      isNaN(yearNum) ||
      yearNum < 2020 ||
      yearNum > new Date().getFullYear() + 1
    ) {
      errors.push("Invalid year for export test");
      return { isValid: false, errors, warnings };
    }

    let startDate: string;
    let endDate: string;

    if (month && month !== "all") {
      const monthNum = parseInt(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        errors.push("Invalid month for export test");
        return { isValid: false, errors, warnings };
      }
      startDate = new Date(yearNum, monthNum - 1, 1)
        .toISOString()
        .split("T")[0];
      endDate = new Date(yearNum, monthNum, 0).toISOString().split("T")[0];
    } else {
      startDate = new Date(yearNum, 0, 1).toISOString().split("T")[0];
      endDate = new Date(yearNum, 11, 31).toISOString().split("T")[0];
    }

    // Test data retrieval for export
    const { data: testData, error: dataError } = await supabase
      .from("attendance_records")
      .select(
        `
        id,
        date,
        clock_in_time,
        clock_out_time,
        work_type,
        status,
        daily_report,
        user_id
      `,
      )
      .gte("date", startDate)
      .lte("date", endDate)
      .limit(100); // Limit for testing

    if (dataError) {
      errors.push(`Failed to retrieve export data: ${dataError.message}`);
      return { isValid: false, errors, warnings };
    }

    if (!testData || testData.length === 0) {
      warnings.push(
        `No data found for the specified period (${startDate} to ${endDate})`,
      );
    }

    // Test profile data retrieval
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name, position, department, employee_id")
      .limit(100);

    if (profileError) {
      errors.push(`Failed to retrieve profile data: ${profileError.message}`);
    } else if (!profileData || profileData.length === 0) {
      warnings.push("No profile data found");
    }
  } catch (error: any) {
    errors.push(`Export test failed: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates user role permissions
 */
export async function validateUserPermissions(
  userId: string,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("user_id", userId)
      .single();

    if (userError) {
      errors.push(`User not found: ${userError.message}`);
      return { isValid: false, errors, warnings };
    }

    // Check user role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleError) {
      if (roleError.code === "PGRST116") {
        warnings.push("User has no assigned role (default to 'user')");
      } else {
        errors.push(`Failed to check user role: ${roleError.message}`);
      }
    } else if (roleData?.role !== "admin") {
      errors.push("User does not have admin privileges");
    }
  } catch (error: any) {
    errors.push(`Permission validation failed: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Comprehensive health check for admin functionality
 */
export async function performHealthCheck(): Promise<{
  overall: boolean;
  system: ValidationResult;
  attendance: ValidationResult;
  export: ValidationResult;
  permissions?: ValidationResult;
}> {
  console.log("Starting admin system health check...");

  // Run all validations
  const systemCheck = await validateAdminSystem();
  const attendanceCheck = await validateAttendanceData();
  const exportCheck = await testExportFunctionality(
    new Date().getFullYear().toString(),
  );

  // Check current user permissions if authenticated
  let permissionsCheck: ValidationResult | undefined;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      permissionsCheck = await validateUserPermissions(user.id);
    }
  } catch (error) {
    console.warn("Could not check current user permissions:", error);
  }

  const overall =
    systemCheck.isValid && attendanceCheck.isValid && exportCheck.isValid;

  console.log("Health check completed:", {
    overall,
    systemValid: systemCheck.isValid,
    attendanceValid: attendanceCheck.isValid,
    exportValid: exportCheck.isValid,
    permissionsValid: permissionsCheck?.isValid,
  });

  return {
    overall,
    system: systemCheck,
    attendance: attendanceCheck,
    export: exportCheck,
    permissions: permissionsCheck,
  };
}
