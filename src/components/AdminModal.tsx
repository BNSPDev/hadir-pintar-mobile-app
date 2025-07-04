import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { X, Download, Users, Shield, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { repairUserData } from "@/utils/userDataRepair";

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
  const [repairing, setRepairing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsersData();
    }
  }, [isOpen]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);

      // Get all authenticated users first from auth.users (this requires admin access)
      // Since we can't directly access auth.users, we'll get all profiles
      // and also check for users with attendance records but no profiles

      // Get all profiles first
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

      // Get all user roles separately
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.warn("User roles error:", rolesError);
        // Continue without roles data if this fails
      }

      // Get all unique user_ids from attendance records to catch any users without profiles
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("attendance_records")
        .select("user_id");

      if (attendanceError) {
        console.warn("Attendance users error:", attendanceError);
      }

      // Get unique user_ids from attendance records
      const uniqueAttendanceUserIds = attendanceRecords
        ? [...new Set(attendanceRecords.map((record) => record.user_id))]
        : [];

      // Create a set of user_ids from profiles
      const profileUserIds = new Set(profiles?.map((p) => p.user_id) || []);

      // Find user_ids that have attendance but no profile
      const missingProfileUsers = uniqueAttendanceUserIds
        .filter((userId) => !profileUserIds.has(userId))
        .map((userId) => ({ user_id: userId }));

      // Log missing profiles for debugging
      if (missingProfileUsers.length > 0) {
        console.log(
          `Found ${missingProfileUsers.length} users with attendance but no profile:`,
          missingProfileUsers.map((u) => u.user_id),
        );

        toast({
          title: "Informasi",
          description: `Ditemukan ${missingProfileUsers.length} pengguna tanpa profil lengkap`,
          variant: "default",
        });
      }

      // Create a map of user roles for quick lookup
      const rolesMap = new Map(
        userRoles?.map((role) => [role.user_id, role.role]) || [],
      );

      // Combine profiles with any missing users
      const allProfiles = [
        ...(profiles || []),
        ...missingProfileUsers.map((mu) => ({
          id: `missing-${mu.user_id}`,
          user_id: mu.user_id,
          full_name: "Profil Tidak Lengkap",
          position: "Tidak Diketahui",
          department: "Tidak Diketahui",
          employee_id: "Belum Diisi",
        })),
      ];

      if (!allProfiles || allProfiles.length === 0) {
        toast({
          title: "Informasi",
          description: "Tidak ada data pengguna ditemukan",
        });
        setUsers([]);
        return;
      }

      // Get attendance counts for each user with better error handling
      const usersWithStats = await Promise.all(
        allProfiles.map(async (profile) => {
          try {
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

            return {
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

      setUsers(usersWithStats);

      toast({
        title: "Berhasil",
        description: `Data ${usersWithStats.length} pengguna berhasil dimuat`,
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

      // Get detailed attendance records for all users with better error handling
      const { data: attendanceRecords, error } = await supabase
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
          user_id,
          profiles!inner(
            full_name,
            position,
            department,
            employee_id
          )
        `,
        )
        .order("date", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!attendanceRecords || attendanceRecords.length === 0) {
        toast({
          title: "Informasi",
          description: "Tidak ada data presensi untuk diunduh",
          variant: "default",
        });
        return;
      }

      // Convert to CSV format with proper escaping
      const csvHeaders = [
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

      const csvRows = attendanceRecords.map((record) => {
        // Safe date parsing
        const recordDate = record.date ? new Date(record.date) : null;
        const clockInTime = record.clock_in_time
          ? new Date(record.clock_in_time)
          : null;
        const clockOutTime = record.clock_out_time
          ? new Date(record.clock_out_time)
          : null;

        return [
          recordDate ? format(recordDate, "dd/MM/yyyy") : "-",
          record.profiles?.full_name || "-",
          record.profiles?.employee_id || "-",
          record.profiles?.position || "-",
          record.profiles?.department || "-",
          clockInTime ? format(clockInTime, "HH:mm") : "-",
          clockOutTime ? format(clockOutTime, "HH:mm") : "-",
          record.work_type || "-",
          record.status || "-",
          (record.daily_report || "-").replace(/"/g, '""'), // Escape quotes in CSV
        ];
      });

      // Create CSV content with BOM for proper Excel encoding
      const csvContent =
        "\uFEFF" +
        [csvHeaders, ...csvRows]
          .map((row) => row.map((field) => `"${field}"`).join(","))
          .join("\r\n");

      // Create and download file
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `rekap-presensi-bnsp-${format(new Date(), "yyyy-MM-dd")}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      URL.revokeObjectURL(url);

      toast({
        title: "Berhasil",
        description: `Data rekap presensi (${attendanceRecords.length} record) berhasil diunduh`,
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

  const handleRepairUserData = async () => {
    try {
      setRepairing(true);

      toast({
        title: "Memulai Perbaikan",
        description: "Memeriksa dan memperbaiki data pengguna...",
      });

      const result = await repairUserData();

      if (result.errors.length > 0) {
        console.error("Repair errors:", result.errors);
        toast({
          title: "Perbaikan Selesai dengan Peringatan",
          description: `Diperbaiki: ${result.createdProfiles} profil, ${result.createdRoles} role. ${result.errors.length} error.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Perbaikan Berhasil",
          description: `Dibuat: ${result.createdProfiles} profil baru, ${result.createdRoles} role baru dari ${result.totalUsers} pengguna.`,
        });
      }

      // Refresh the user list
      await fetchUsersData();
    } catch (error: any) {
      console.error("Error repairing user data:", error);
      toast({
        title: "Error",
        description: "Gagal memperbaiki data pengguna. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setRepairing(false);
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
          {/* Download Section */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-card-foreground">
                  Download Rekap Presensi
                </h3>
                <p className="text-sm text-muted-foreground">
                  Unduh data rekap presensi semua anggota dalam format CSV
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={downloadUserData}
                disabled={downloading || users.length === 0}
                className="bg-gradient-secondary hover:shadow-lg hover:scale-[1.02] text-white transition-all duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? "Mengunduh..." : `Unduh Rekap (${users.length})`}
              </Button>
              <Button
                onClick={handleRepairUserData}
                disabled={repairing}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${repairing ? "animate-spin" : ""}`}
                />
                {repairing ? "Memperbaiki..." : "Perbaiki Data"}
              </Button>
            </div>
            {users.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Tidak ada data untuk diunduh. Coba tombol "Perbaiki Data" untuk
                memperbaiki data pengguna yang hilang.
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
