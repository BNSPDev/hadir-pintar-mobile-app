import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { X, Download, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import { UserRoleManager } from "@/components/UserRoleManager";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  position: string;
  department: string;
  employee_id: string;
  role: string;
  total_attendance: number;
  last_attendance: string | null;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsersData();
    }
  }, [isOpen]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);

      // Get all profiles first - this should include all 8 users (7 + admin)
      const { data: profiles, error: profilesError } = await supabase.from(
        "profiles",
      ).select(`
          id,
          user_id,
          full_name,
          position,
          department,
          employee_id
        `);

      if (profilesError) {
        console.error("Profiles error:", profilesError);
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      console.log(`Found ${profiles?.length || 0} profiles in database`);

      // Auto-assign roles to users who don't have them
      const roleAssignmentResult = await assignRolesToAllUsers();
      console.log("Role assignment result:", roleAssignmentResult);

      if (roleAssignmentResult.success && roleAssignmentResult.assigned > 0) {
        toast({
          title: "Roles Assigned",
          description: `Assigned "user" role to ${roleAssignmentResult.assigned} users`,
        });
      }

      // Get all user roles separately (after potential role assignment)
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.warn("User roles error:", rolesError);
        // Continue without roles data if this fails
      }

      console.log(`Found ${userRoles?.length || 0} user roles in database`);

      // Create a map of user roles for quick lookup
      const rolesMap = new Map(
        userRoles?.map((role) => [role.user_id, role.role]) || [],
      );

      if (!profiles || profiles.length === 0) {
        console.error("No profiles found in database!");
        toast({
          title: "Error",
          description:
            "Tidak ada profil pengguna ditemukan di database. Pastikan data sudah ada.",
          variant: "destructive",
        });
        setUsers([]);
        return;
      }

      console.log(
        "Processing users with profiles:",
        profiles.map((p) => ({
          id: p.id,
          user_id: p.user_id,
          full_name: p.full_name,
        })),
      );

      // Get attendance counts for each user
      const usersWithStats = await Promise.all(
        profiles.map(async (profile) => {
          try {
            console.log(
              `Processing user: ${profile.full_name} (${profile.user_id})`,
            );

            // Get attendance count
            const { count, error: countError } = await supabase
              .from("attendance_records")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.user_id);

            if (countError) {
              console.warn(
                `Count error for user ${profile.user_id}:`,
                countError,
              );
            }

            // Get last attendance
            const { data: lastAttendance, error: lastError } = await supabase
              .from("attendance_records")
              .select("date")
              .eq("user_id", profile.user_id)
              .order("date", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastError) {
              console.warn(
                `Last attendance error for user ${profile.user_id}:`,
                lastError,
              );
            }

            const userData = {
              id: profile.id,
              email: profile.user_id,
              full_name: profile.full_name || "Nama tidak tersedia",
              position: profile.position || "Jabatan tidak tersedia",
              department: profile.department || "Unit kerja tidak tersedia",
              employee_id: profile.employee_id || "NIP tidak tersedia",
              role: rolesMap.get(profile.user_id) || "user",
              total_attendance: count || 0,
              last_attendance: lastAttendance?.date || null,
            };

            console.log(`User processed:`, userData);
            return userData;
          } catch (userError) {
            console.error(
              `Error processing user ${profile.user_id}:`,
              userError,
            );
            // Return basic user data even if attendance fetch fails
            return {
              id: profile.id,
              email: profile.user_id,
              full_name: profile.full_name || "Nama tidak tersedia",
              position: profile.position || "Jabatan tidak tersedia",
              department: profile.department || "Unit kerja tidak tersedia",
              employee_id: profile.employee_id || "NIP tidak tersedia",
              role: rolesMap.get(profile.user_id) || "user",
              total_attendance: 0,
              last_attendance: null,
            };
          }
        }),
      );

      console.log(`Final user list:`, usersWithStats);
      setUsers(usersWithStats);

      toast({
        title: "Berhasil",
        description: `Data ${usersWithStats.length} pengguna berhasil dimuat dari database`,
      });
    } catch (error: any) {
      console.error("Error fetching users data:", error);
      toast({
        title: "Error",
        description:
          error.message || "Gagal memuat data pengguna. Silakan coba lagi.",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadUserData = async () => {
    try {
      setDownloading(true);

      // Get attendance records first
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
        .order("date", { ascending: false });

      if (attendanceError) {
        console.error("Supabase error:", attendanceError);
        throw new Error(`Database error: ${attendanceError.message}`);
      }

      // Get all profiles separately
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
        throw new Error(`Database error: ${profilesError.message}`);
      }

      // Create a map of profiles for quick lookup
      const profilesMap = new Map(
        profiles?.map((profile) => [profile.user_id, profile]) || [],
      );

      if (!attendanceRecords || attendanceRecords.length === 0) {
        toast({
          title: "Informasi",
          description: "Tidak ada data presensi untuk diunduh",
          variant: "default",
        });
        return;
      }

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

      // Group attendance records by user
      const recordsByUser = new Map();

      attendanceRecords.forEach((record) => {
        if (!recordsByUser.has(record.user_id)) {
          recordsByUser.set(record.user_id, []);
        }
        recordsByUser.get(record.user_id).push(record);
      });

      console.log(`Creating sheets for ${recordsByUser.size} users`);

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

      // Also create a summary sheet
      const summaryData = [
        ["Ringkasan Presensi BNSP", "", "", "", ""],
        ["Tanggal Download:", format(new Date(), "dd/MM/yyyy HH:mm")],
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
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan", 0);

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
        `rekap-presensi-bnsp-${format(new Date(), "yyyy-MM-dd")}.xlsx`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: `File Excel dengan ${recordsByUser.size} sheet pengguna berhasil diunduh`,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl h-[80vh] bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Panel Admin
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* User Role Management */}
          <UserRoleManager onUserRoleAssigned={fetchUsersData} />

          {/* Download Section */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-card-foreground">
                  Download Rekap Presensi
                </h3>
                <p className="text-sm text-muted-foreground">
                  Download data presensi dalam format Excel multi-sheet
                </p>
              </div>
            </div>
            <Button
              onClick={downloadUserData}
              disabled={downloading || users.length === 0}
              className="bg-gradient-secondary hover:shadow-lg hover:scale-[1.02] text-white transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading
                ? "Mengunduh..."
                : `Download Excel (${users.length} users)`}
            </Button>
            {users.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Tidak ada data untuk diunduh
              </p>
            )}
          </div>

          {/* Users List */}
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Daftar Pengguna ({users.length})
            </h3>
            <ScrollArea className="h-full">
              {loading ? (
                <LoadingSpinner message="Memuat data pengguna..." />
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Tidak ada data pengguna
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 bg-muted/30 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-card-foreground">
                            {user.full_name}
                          </h4>
                          <p className="text-sm text-primary">
                            {user.position}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.department} • NIP: {user.employee_id}
                          </p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              user.role === "admin"
                                ? "bg-primary/20 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {user.role === "admin" ? "Admin" : "User"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Total Presensi: {user.total_attendance}</span>
                        <span>
                          Terakhir Hadir:{" "}
                          {user.last_attendance
                            ? format(
                                new Date(user.last_attendance),
                                "dd MMM yyyy",
                                { locale: id },
                              )
                            : "Belum pernah"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
