import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  X,
  Download,
  Edit,
  Save,
  XCircle,
  Trash,
  Pencil,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { performHealthCheck } from "@/utils/adminValidation";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  position: string;
  department: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface UserData {
  id: string;
  user_id: string;
  email?: string;
  full_name: string;
  position: string;
  department: string;
  employee_id: string;
  role: string;
  total_attendance: number;
  last_attendance: string | null;
  created_at?: string;
  updated_at?: string;
  isEditing?: boolean;
  tempData?: {
    full_name: string;
    position: string;
    department: string;
    employee_id: string;
    role: string;
  };
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [healthStatus, setHealthStatus] = useState<{
    overall: boolean;
    lastCheck?: Date;
    details?: any;
  }>({ overall: true });

  // Available departments
  const departments = [
    "Sekretariat",
    "Akreditasi LSP",
    "Sertifikasi",
    "Pengembangan",
    "Hukum",
    "Umum",
  ] as const;

  // Available roles
  const roles = ["admin", "user"] as const;

  // Type guard for role
  const isRole = (role: string): role is "admin" | "user" => {
    return role === "admin" || role === "user";
  };

  // Type guard for department
  const isDepartment = (dept: string): dept is (typeof departments)[number] => {
    return departments.includes(dept as any);
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Get all profiles with proper typing
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;
      if (!profiles) throw new Error("Tidak ada data profil yang ditemukan");

      // Cast profiles to Profile[] for type safety
      const typedProfiles = profiles as unknown as Profile[];

      // Get all user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) {
        console.warn("User roles error:", rolesError);
        // Continue without roles if this fails
      }

      // Cast userRoles to UserRole[] for type safety
      const typedUserRoles = (userRoles || []) as unknown as UserRole[];

      // Process users with their roles and attendance data
      const usersWithData = await Promise.all(
        typedProfiles.map(async (profile) => {
          try {
            const userRole = typedUserRoles.find(
              (r) => r.user_id === profile.user_id,
            );
            const roleValue = userRole?.role || "user";
            const role = isRole(roleValue) ? roleValue : "user";

            // Get attendance count
            const { count, error: countError } = await supabase
              .from("attendance_records")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.user_id);

            if (countError) {
              console.warn(
                `Error getting attendance count for user ${profile.user_id}:`,
                countError,
              );
            }

            // Get last attendance date
            const { data: lastAttendance, error: lastError } = await supabase
              .from("attendance_records")
              .select("date")
              .eq("user_id", profile.user_id)
              .order("date", { ascending: false })
              .limit(1)
              .single();

            if (lastError && lastError.code !== "PGRST116") {
              // Ignore 'No rows found' error
              console.warn(
                `Error getting last attendance for user ${profile.user_id}:`,
                lastError,
              );
            }

            // Build user data with proper typing
            const userData: UserData = {
              id: profile.id,
              user_id: profile.user_id || profile.id,
              email: profile.email,
              full_name: profile.full_name || "Nama tidak tersedia",
              position: profile.position || "Posisi tidak tersedia",
              department: isDepartment(profile.department)
                ? profile.department
                : "Departemen tidak tersedia",
              employee_id: profile.employee_id || "NIP tidak tersedia",
              role,
              total_attendance: count || 0,
              last_attendance: lastAttendance?.date || null,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
              isEditing: false,
            };

            return userData;
          } catch (error) {
            console.error(`Error processing user ${profile.user_id}:`, error);
            // Return minimal user data if processing fails
            return {
              id: profile.id,
              user_id: profile.user_id || profile.id,
              email: profile.email,
              full_name: profile.full_name || "Nama tidak tersedia",
              position: profile.position || "Posisi tidak tersedia",
              department: isDepartment(profile.department)
                ? profile.department
                : "Departemen tidak tersedia",
              employee_id: profile.employee_id || "NIP tidak tersedia",
              role: "user",
              total_attendance: 0,
              last_attendance: null,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
              isEditing: false,
            };
          }
        }),
      );

      setUsers(usersWithData);

      toast({
        title: "Berhasil",
        description: `Data ${usersWithData.length} pengguna berhasil dimuat`,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? `Gagal memuat data: ${error.message}`
            : "Terjadi kesalahan saat memuat data pengguna",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle edit mode for a user
  const toggleEdit = (userId: string) => {
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          const isEditing = !user.isEditing;
          return {
            ...user,
            isEditing,
            tempData: isEditing
              ? {
                  full_name: user.full_name,
                  position: user.position,
                  department: user.department,
                  employee_id: user.employee_id,
                  role: user.role,
                }
              : undefined,
          };
        }
        return user;
      }),
    );
  };

  // Handle input changes during edit
  const handleInputChange = (userId: string, field: string, value: string) => {
    setUsers(
      users.map((user) => {
        if (user.id === userId && user.tempData) {
          return {
            ...user,
            tempData: {
              ...user.tempData,
              [field]: value,
            },
          };
        }
        return user;
      }),
    );
  };

  // Save user data
  const saveUserData = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user || !user.tempData) return;

      setLoading(true);

      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: user.tempData.full_name,
          position: user.tempData.position,
          department: user.tempData.department,
          employee_id: user.tempData.employee_id,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.user_id);

      if (profileError) throw profileError;

      // Update role in user_roles table
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: user.user_id, role: user.tempData.role },
          { onConflict: "user_id" },
        );

      if (roleError) throw roleError;

      // Update local state
      setUsers(
        users.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              ...user.tempData,
              isEditing: false,
              tempData: undefined,
            };
          }
          return u;
        }),
      );

      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui profil. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) return;

    try {
      setLoading(true);
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      // Delete from auth.users (requires admin privileges or RLS policy)
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.user_id,
      );

      if (authError) throw authError;

      // Update local state
      setUsers(users.filter((u) => u.id !== userId));

      toast({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description:
          "Gagal menghapus pengguna. Pastikan Anda memiliki izin yang cukup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Export data to Excel with each user's data in separate sheets
  const exportToExcel = async () => {
    try {
      setLoading(true);

      // Get all attendance records
      const { data: attendance, error } = await supabase
        .from("attendance_records")
        .select("*")
        .order("clock_in_time", { ascending: false });

      if (error) throw error;
      if (!attendance || attendance.length === 0) {
        toast({
          title: "Info",
          description: "Tidak ada data kehadiran yang ditemukan",
          variant: "destructive",
        });
        return;
      }

      // Group attendance by user
      const attendanceByUser: Record<string, any[]> = {};

      attendance.forEach((record) => {
        const userId = record.user_id;
        if (!userId) return;

        if (!attendanceByUser[userId]) {
          attendanceByUser[userId] = [];
        }
        attendanceByUser[userId].push(record);
      });

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Create a worksheet for each user
      Object.entries(attendanceByUser).forEach(([userId, records]) => {
        if (!records || records.length === 0) return;

        const user = records[0]?.profiles;
        if (!user) return;

        const userName = user.full_name || `User_${userId}`;

        // Format data for Excel with proper date handling
        const excelData = records.map((record) => ({
          Tanggal: record.clock_in_time
            ? format(new Date(record.clock_in_time), "dd/MM/yyyy", {
                locale: id,
              })
            : "-",
          Hari: record.clock_in_time
            ? format(new Date(record.clock_in_time), "EEEE", { locale: id })
            : "-",
          "Jam Masuk": record.clock_in_time
            ? format(new Date(record.clock_in_time), "HH:mm:ss")
            : "-",
          "Jam Keluar": record.clock_out_time
            ? format(new Date(record.clock_out_time), "HH:mm:ss")
            : "-",
          Status: record.status || "-",
          Keterangan: record.daily_report || "-",
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Add to workbook with sheet name (max 31 chars, Excel limit)
        const sheetName = userName.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      // Generate Excel file with semicolon delimiters for Indonesian locale
      const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
        bookSST: true,
        cellDates: true,
        cellStyles: true,
        sheetStubs: true,
      });

      // Create blob and download
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Data_Kehadiran_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Berhasil",
        description: "Data berhasil diekspor ke Excel",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengekspor data ke Excel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setDownloading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const downloadUserData = async () => {
    try {
      setDownloading(true);

      // Validate date inputs
      if (!selectedYear || isNaN(parseInt(selectedYear))) {
        toast({
          title: "Error",
          description: "Tahun tidak valid",
          variant: "destructive",
        });
        return;
      }

      const year = parseInt(selectedYear);
      const currentYear = new Date().getFullYear();

      if (year < 2020 || year > currentYear + 1) {
        toast({
          title: "Error",
          description: `Tahun harus antara 2020 dan ${currentYear + 1}`,
          variant: "destructive",
        });
        return;
      }

      // Build date filter
      let startDate: string;
      let endDate: string;

      if (selectedMonth && selectedMonth !== "all") {
        const month = parseInt(selectedMonth);
        if (isNaN(month) || month < 1 || month > 12) {
          toast({
            title: "Error",
            description: "Bulan tidak valid",
            variant: "destructive",
          });
          return;
        }

        startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
        endDate = new Date(year, month, 0).toISOString().split("T")[0];
      } else {
        startDate = new Date(year, 0, 1).toISOString().split("T")[0];
        endDate = new Date(year, 11, 31).toISOString().split("T")[0];
      }

      console.log(
        `Fetching attendance records from ${startDate} to ${endDate}`,
      );

      // Get attendance records with proper error handling
      const { data: attendanceRecords, error: attendanceError } = await supabase
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
        .order("date", { ascending: false });

      if (attendanceError) {
        console.error("Attendance records error:", attendanceError);
        throw new Error(
          `Gagal mengambil data presensi: ${attendanceError.message}`,
        );
      }

      // Get all profiles separately with error handling
      const { data: profiles, error: profilesError } = await supabase.from(
        "profiles",
      ).select(`
          user_id,
          full_name,
          position,
          department,
          employee_id
        `);

      if (profilesError) {
        console.error("Profiles error:", profilesError);
        throw new Error(
          `Gagal mengambil data profil: ${profilesError.message}`,
        );
      }

      if (!profiles || profiles.length === 0) {
        toast({
          title: "Informasi",
          description: "Tidak ada data profil user ditemukan",
          variant: "default",
        });
        return;
      }

      // Create a map of profiles for quick lookup
      const profilesMap = new Map(
        profiles?.map((profile) => [profile.user_id, profile]) || [],
      );

      if (!attendanceRecords || attendanceRecords.length === 0) {
        const periodText =
          selectedMonth && selectedMonth !== "all"
            ? `bulan ${getMonthName(selectedMonth)} ${selectedYear}`
            : `tahun ${selectedYear}`;

        toast({
          title: "Informasi",
          description: `Tidak ada data presensi untuk ${periodText}. Silakan pilih periode lain atau pastikan data sudah tersedia.`,
          variant: "default",
        });

        console.log(
          `No attendance records found for period: ${startDate} to ${endDate}`,
        );
        return;
      }

      console.log(
        `Found ${attendanceRecords.length} attendance records for the selected period`,
      );

      // Create new workbook
      const workbook = XLSX.utils.book_new();

      // Headers for all sheets
      const headers = [
        "Tanggal",
        "Nama Lengkap",
        "NIP",
        "Jabatan",
        "Unit Kerja",
        "Jam Masuk",
        "Jam Pulang",
        "Tipe Kerja",
        "Status",
        "Laporan Kegiatan",
      ];

      // Show progress
      toast({
        title: "Memproses Data",
        description: `Sedang memproses ${attendanceRecords.length} record presensi...`,
        variant: "default",
      });

      // Group attendance records by user
      const recordsByUser = new Map();

      attendanceRecords.forEach((record) => {
        if (!recordsByUser.has(record.user_id)) {
          recordsByUser.set(record.user_id, []);
        }
        recordsByUser.get(record.user_id).push(record);
      });

      console.log(
        `Creating sheets for ${recordsByUser.size} users with total ${attendanceRecords.length} records`,
      );

      // Create a sheet for each user
      recordsByUser.forEach((userRecords, userId) => {
        const profile = profilesMap.get(userId);
        const userName = profile?.full_name || `User-${userId.slice(-6)}`;

        // Sanitize sheet name (Excel has restrictions)
        const sheetName = userName
          .replace(/[\\\/\?\*\[\]]/g, "-")
          .substring(0, 31);

        const sheetData = [
          headers,
          ...userRecords.map((record) => {
            const recordDate = record.date ? new Date(record.date) : null;
            const clockInTime = record.clock_in_time
              ? new Date(record.clock_in_time)
              : null;
            const clockOutTime = record.clock_out_time
              ? new Date(record.clock_out_time)
              : null;

            return [
              recordDate ? format(recordDate, "dd/MM/yyyy") : "-",
              profile?.full_name || "Profil Tidak Ditemukan",
              profile?.employee_id || "-",
              profile?.position || "-",
              profile?.department || "-",
              clockInTime ? format(clockInTime, "HH:mm") : "-",
              clockOutTime ? format(clockOutTime, "HH:mm") : "-",
              record.work_type || "-",
              record.status || "-",
              record.daily_report || "-",
            ];
          }),
        ];

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Auto-size columns
        const colWidths = [
          { wch: 12 }, // Tanggal
          { wch: 20 }, // Nama
          { wch: 15 }, // NIP
          { wch: 15 }, // Jabatan
          { wch: 15 }, // Unit Kerja
          { wch: 10 }, // Jam Masuk
          { wch: 10 }, // Jam Pulang
          { wch: 8 }, // Tipe Kerja
          { wch: 12 }, // Status
          { wch: 30 }, // Laporan
        ];
        worksheet["!cols"] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });

      // Create period description for summary
      const periodText =
        selectedMonth && selectedMonth !== "all"
          ? `${getMonthName(selectedMonth)} ${selectedYear}`
          : `Tahun ${selectedYear}`;

      // Also create a summary sheet
      const summaryData = [
        [`Ringkasan Presensi BNSP - ${periodText}`, "", "", "", ""],
        ["Tanggal Download:", format(new Date(), "dd/MM/yyyy HH:mm")],
        ["Period:", periodText],
        ["Total Pengguna:", recordsByUser.size],
        ["Total Record:", attendanceRecords.length],
        [""],
        ["Nama", "NIP", "Total Presensi", "Terakhir Hadir", "Status"],
        ...Array.from(recordsByUser.entries()).map(([userId, userRecords]) => {
          const profile = profilesMap.get(userId);
          const lastRecord = userRecords[0]; // Records are ordered by date desc
          const lastDate = lastRecord
            ? format(new Date(lastRecord.date), "dd/MM/yyyy")
            : "-";

          return [
            profile?.full_name || "Tidak Diketahui",
            profile?.employee_id || "-",
            userRecords.length,
            lastDate,
            userRecords.length > 0 ? "Aktif" : "Tidak Aktif",
          ];
        }),
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet["!cols"] = [
        { wch: 25 }, // Nama
        { wch: 15 }, // NIP
        { wch: 15 }, // Total
        { wch: 15 }, // Terakhir
        { wch: 12 }, // Status
      ];

      // Insert summary sheet at the beginning
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

      // Generate filename based on selected period
      const filenamePeriod =
        selectedMonth && selectedMonth !== "all"
          ? `${getMonthName(selectedMonth)}-${selectedYear}`
          : `${selectedYear}`;

      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        bookSST: false,
      });

      // Create and download file
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `rekap-presensi-bnsp-${filenamePeriod}.xlsx`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      toast({
        title: "Download Berhasil",
        description: `File Excel "${filenamePeriod}" berhasil diunduh dengan ${recordsByUser.size} sheet user dan ${attendanceRecords.length} total record`,
      });
    } catch (error: any) {
      console.error("Error downloading data:", error);
      toast({
        title: "Error",
        description:
          error.message || "Gagal mengunduh data. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  // Helper function to get month name
  const getMonthName = (month: string) => {
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
  };

  // Run health check
  const runHealthCheck = async () => {
    try {
      setLoading(true);
      const healthResult = await performHealthCheck();

      setHealthStatus({
        overall: healthResult.overall,
        lastCheck: new Date(),
        details: healthResult,
      });

      const totalErrors =
        healthResult.system.errors.length +
        healthResult.attendance.errors.length +
        healthResult.export.errors.length +
        (healthResult.permissions?.errors.length || 0);

      const totalWarnings =
        healthResult.system.warnings.length +
        healthResult.attendance.warnings.length +
        healthResult.export.warnings.length +
        (healthResult.permissions?.warnings.length || 0);

      if (healthResult.overall) {
        toast({
          title: "Sistem Admin Sehat",
          description: `Semua fungsi bekerja normal${totalWarnings > 0 ? ` (${totalWarnings} peringatan)` : ""}`,
        });
      } else {
        toast({
          title: "Masalah Terdeteksi",
          description: `Ditemukan ${totalErrors} error dan ${totalWarnings} peringatan`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Health Check Gagal",
        description:
          error.message || "Tidak dapat menjalankan pemeriksaan sistem",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-50">
      <Card className="w-full max-w-6xl max-h-[95vh] flex flex-col mx-2">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl md:text-2xl font-bold">
                Panel Admin
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile-first responsive layout */}
            <div className="space-y-4">
              {/* Period Selection Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Periode Rekap:
                  </label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Satu Tahun Penuh</SelectItem>
                      <SelectItem value="1">Januari</SelectItem>
                      <SelectItem value="2">Februari</SelectItem>
                      <SelectItem value="3">Maret</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">Mei</SelectItem>
                      <SelectItem value="6">Juni</SelectItem>
                      <SelectItem value="7">Juli</SelectItem>
                      <SelectItem value="8">Agustus</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">Oktober</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">Desember</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Tahun:
                  </label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Download Button */}
                <Button
                  onClick={downloadUserData}
                  disabled={downloading || users.length === 0}
                  size="lg"
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md"
                >
                  <Download className="h-5 w-5" />
                  <span className="hidden sm:inline">
                    {downloading
                      ? "Mengunduh..."
                      : `Excel ${selectedMonth && selectedMonth !== "all" ? getMonthName(selectedMonth) : "Tahunan"} ${selectedYear}`}
                  </span>
                  <span className="sm:hidden">
                    {downloading ? "Mengunduh..." : "Unduh Excel"}
                  </span>
                </Button>

                {/* Health Check Button */}
                <Button
                  onClick={runHealthCheck}
                  disabled={loading}
                  size="lg"
                  variant="outline"
                  className={`gap-2 font-bold shadow-md border-2 ${
                    healthStatus.overall
                      ? "border-green-500 text-green-700 hover:bg-green-50"
                      : "border-orange-500 text-orange-700 hover:bg-orange-50"
                  }`}
                >
                  {healthStatus.overall ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span className="hidden sm:inline">
                    {loading ? "Checking..." : "Health Check"}
                  </span>
                  <span className="sm:hidden">
                    {loading ? "Check..." : "Status"}
                  </span>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Cari Pengguna:
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Cari berdasarkan nama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0111.317-2.5M19 21v-1a6 6 0 00-4-5.659M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Tidak ada data pengguna
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "Coba kata kunci lain" : "Data belum tersedia"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nama
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900">
                        {user.isEditing ? (
                          <Input
                            value={user.tempData?.full_name || user.full_name}
                            onChange={(e) =>
                              handleInputChange(
                                user.id,
                                "full_name",
                                e.target.value,
                              )
                            }
                            className="w-full text-sm"
                            placeholder="Nama lengkap"
                          />
                        ) : (
                          <div className="truncate max-w-[150px] sm:max-w-none">
                            {user.full_name}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                        {user.isEditing ? (
                          <Select
                            value={user.tempData?.role || user.role}
                            onValueChange={(value) =>
                              handleInputChange(user.id, "role", value)
                            }
                          >
                            <SelectTrigger className="w-full text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.role === "admin" ? "Admin" : "User"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center text-sm font-medium">
                        <div className="flex justify-center gap-2">
                          {user.isEditing ? (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => saveUserData(user.id)}
                                disabled={loading}
                              >
                                <Save className="h-4 w-4" />
                                Simpan
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => toggleEdit(user.id)}
                                disabled={loading}
                              >
                                <XCircle className="h-4 w-4" />
                                Batal
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              onClick={() => toggleEdit(user.id)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
