import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export interface User {
  id: string;
  user_id: string;
  full_name: string;
  position: string;
  department: string;
  employee_id: string;
}

export interface AttendanceRecord {
  id?: string;
  user_id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  work_type: string;
  status: string;
  daily_report: string | null;
  profiles?: {
    user_id: string;
    full_name: string;
    position: string;
    department: string;
    employee_id?: string;
  };
}

export interface ExportData {
  records: AttendanceRecord[];
  profiles: User[];
  period: {
    startDate: string;
    endDate: string;
    description: string;
  };
}

/**
 * Validates if the current user has admin privileges
 */
export async function validateAdminAccess(): Promise<{
  isValid: boolean;
  error?: string;
}> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { isValid: false, error: "User tidak terautentikasi" };
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError) {
      return { isValid: false, error: "Gagal memverifikasi role user" };
    }

    if (roleData?.role !== "admin") {
      return { isValid: false, error: "User tidak memiliki akses admin" };
    }

    return { isValid: true };
  } catch (error: any) {
    return { isValid: false, error: error.message || "Error validasi admin" };
  }
}

/**
 * Fetches non-admin users from the database
 */
export async function fetchNonAdminUsers(): Promise<{
  users: User[];
  error?: string;
}> {
  try {
    // Get all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, user_id, full_name, position, department, employee_id")
      .order("full_name");

    if (profilesError) {
      throw new Error(`Database error: ${profilesError.message}`);
    }

    if (!profilesData || profilesData.length === 0) {
      return { users: [], error: "Tidak ada profil user ditemukan" };
    }

    // Get admin user IDs
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.warn("Could not fetch admin roles:", rolesError);
      // Return all users if can't filter admins
      return { users: profilesData as User[] };
    }

    // Filter out admin users
    const adminUserIds = new Set(adminRoles?.map((role) => role.user_id) || []);
    const nonAdminUsers = profilesData.filter(
      (user) => !adminUserIds.has(user.user_id),
    ) as User[];

    return { users: nonAdminUsers };
  } catch (error: any) {
    return { users: [], error: error.message || "Gagal mengambil data user" };
  }
}

/**
 * Fetches attendance records for a specific date
 */
export async function fetchAttendanceByDate(date: string): Promise<{
  records: AttendanceRecord[];
  error?: string;
}> {
  try {
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("attendance_records")
      .select(
        `
        *,
        profiles:user_id (
          user_id,
          full_name,
          position,
          department,
          employee_id
        )
      `,
      )
      .eq("date", date)
      .order("created_at", { ascending: false });

    if (attendanceError) {
      throw new Error(`Database error: ${attendanceError.message}`);
    }

    return { records: (attendanceData || []) as AttendanceRecord[] };
  } catch (error: any) {
    return {
      records: [],
      error: error.message || "Gagal mengambil data presensi",
    };
  }
}

/**
 * Validates attendance form data
 */
export function validateAttendanceForm(data: {
  userId: string;
  workType: string;
  clockInTime: string;
  clockOutTime?: string;
}): { isValid: boolean; error?: string } {
  const { userId, workType, clockInTime, clockOutTime } = data;

  if (!userId || userId === "loading" || userId === "no-users") {
    return { isValid: false, error: "Harap pilih user terlebih dahulu" };
  }

  if (!workType) {
    return { isValid: false, error: "Harap pilih tipe kerja" };
  }

  if (!clockInTime) {
    return { isValid: false, error: "Jam masuk wajib diisi" };
  }

  if (clockOutTime && clockOutTime <= clockInTime) {
    return { isValid: false, error: "Jam pulang harus setelah jam masuk" };
  }

  return { isValid: true };
}

/**
 * Creates or updates attendance record
 */
export async function saveAttendanceRecord(data: {
  userId: string;
  date: string;
  clockInTime: string;
  clockOutTime?: string;
  workType: string;
  dailyReport?: string;
}): Promise<{ success: boolean; error?: string; isUpdate?: boolean }> {
  try {
    const { userId, date, clockInTime, clockOutTime, workType, dailyReport } =
      data;

    // Check if record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      throw new Error(`Gagal mengecek data presensi: ${checkError.message}`);
    }

    // Prepare attendance data
    const clockInISO = new Date(`${date}T${clockInTime}:00`).toISOString();
    const clockOutISO = clockOutTime
      ? new Date(`${date}T${clockOutTime}:00`).toISOString()
      : null;

    const attendanceData = {
      user_id: userId,
      date,
      clock_in_time: clockInISO,
      clock_out_time: clockOutISO,
      work_type: workType,
      status: clockOutISO ? "completed" : "active",
      daily_report: dailyReport?.trim() || null,
    };

    let result;
    let isUpdate = false;

    if (existingRecord) {
      // Update existing record
      result = await supabase
        .from("attendance_records")
        .update(attendanceData)
        .eq("id", existingRecord.id);
      isUpdate = true;
    } else {
      // Create new record
      result = await supabase.from("attendance_records").insert(attendanceData);
    }

    if (result.error) {
      throw new Error(`Gagal menyimpan presensi: ${result.error.message}`);
    }

    return { success: true, isUpdate };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menyimpan presensi",
    };
  }
}

/**
 * Formats date for display
 */
export function formatDateDisplay(date: Date): string {
  return format(date, "EEEE, dd MMMM yyyy", { locale: id });
}

/**
 * Gets work type configuration
 */
export function getWorkTypeInfo(workType: string) {
  const workTypeOptions = [
    { value: "WFO", label: "WFO", color: "bg-attendance-wfo" },
    { value: "DL", label: "DL", color: "bg-attendance-dl" },
    { value: "Cuti", label: "Cuti", color: "bg-attendance-cuti" },
    { value: "Sakit", label: "Sakit", color: "bg-attendance-sakit" },
  ];

  return workTypeOptions.find((option) => option.value === workType);
}

/**
 * Validates date range for export
 */
export function validateDateRange(
  year: string,
  month?: string,
): {
  isValid: boolean;
  error?: string;
  startDate?: string;
  endDate?: string;
} {
  if (!year || isNaN(parseInt(year))) {
    return { isValid: false, error: "Tahun tidak valid" };
  }

  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear();

  if (yearNum < 2020 || yearNum > currentYear + 1) {
    return {
      isValid: false,
      error: `Tahun harus antara 2020 dan ${currentYear + 1}`,
    };
  }

  let startDate: string;
  let endDate: string;

  if (month && month !== "all") {
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return { isValid: false, error: "Bulan tidak valid" };
    }

    startDate = new Date(yearNum, monthNum - 1, 1).toISOString().split("T")[0];
    endDate = new Date(yearNum, monthNum, 0).toISOString().split("T")[0];
  } else {
    startDate = new Date(yearNum, 0, 1).toISOString().split("T")[0];
    endDate = new Date(yearNum, 11, 31).toISOString().split("T")[0];
  }

  return { isValid: true, startDate, endDate };
}

/**
 * Gets month name in Indonesian
 */
export function getMonthName(month: string): string {
  const months = [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return months[parseInt(month)] || month;
}
