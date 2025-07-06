import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Building2,
  Car,
  Calendar,
  Heart,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";

interface User {
  id: string;
  user_id: string;
  full_name: string;
  position: string;
  department: string;
  employee_id: string;
}

interface AttendanceRecord {
  id?: string;
  user_id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  work_type: string;
  status: string;
  daily_report: string | null;
}

export function AdminAttendanceForm() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [workType, setWorkType] = useState<string>("");
  const [clockInTime, setClockInTime] = useState<string>("");
  const [clockOutTime, setClockOutTime] = useState<string>("");
  const [dailyReport, setDailyReport] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>(
    [],
  );

  const workTypeOptions = [
    { value: "WFO", label: "WFO", icon: Building2, color: "bg-attendance-wfo" },
    { value: "DL", label: "DL", icon: Car, color: "bg-attendance-dl" },
    {
      value: "Cuti",
      label: "Cuti",
      icon: Calendar,
      color: "bg-attendance-cuti",
    },
    {
      value: "Sakit",
      label: "Sakit",
      icon: Heart,
      color: "bg-attendance-sakit",
    },
  ];

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const initializeData = async () => {
      // First check if user has admin role
      try {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
          .single();

        console.log("Current user role:", roleData?.role);

        if (roleError) {
          console.error("Error checking user role:", roleError);
          toast({
            title: "Error",
            description: "Tidak dapat memverifikasi role admin",
            variant: "destructive",
          });
          return;
        }

        if (roleData?.role !== "admin") {
          toast({
            title: "Access Denied",
            description: "Anda tidak memiliki akses admin",
            variant: "destructive",
          });
          return;
        }

        // If admin, fetch data
        await fetchUsers();
        await fetchTodayAttendance();
      } catch (error: any) {
        console.error("Error initializing admin data:", error);
        toast({
          title: "Error",
          description: "Gagal menginisialisasi data admin",
          variant: "destructive",
        });
      }
    };

    initializeData();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log("Fetching non-admin users...");

      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, position, department, employee_id")
        .order("full_name");

      if (profilesError) {
        console.error("Supabase error fetching users:", profilesError);
        throw new Error(`Database error: ${profilesError.message}`);
      }

      if (!profilesData || profilesData.length === 0) {
        console.warn("No profiles found in database");
        setUsers([]);
        return;
      }

      // Get admin user IDs to filter them out
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) {
        console.warn("Could not fetch admin roles:", rolesError);
        // Show all users as fallback
        setUsers(profilesData);
        toast({
          title: "Peringatan",
          description:
            "Tidak dapat memfilter admin users, menampilkan semua user",
          variant: "default",
        });
        return;
      }

      // Filter out admin users
      const adminUserIds = new Set(
        adminRoles?.map((role) => role.user_id) || [],
      );
      const nonAdminUsers = profilesData.filter(
        (user) => !adminUserIds.has(user.user_id),
      );

      console.log(
        `Found ${nonAdminUsers.length} non-admin users out of ${profilesData.length} total users`,
      );
      setUsers(nonAdminUsers);

      if (nonAdminUsers.length === 0) {
        toast({
          title: "Informasi",
          description: "Semua user terdaftar sebagai admin",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: `Gagal memuat daftar user: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      console.log("Fetching today's attendance for date:", today);

      // Get attendance records with profiles using a join
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
        .eq("date", today)
        .order("created_at", { ascending: false });

      if (attendanceError) {
        console.error("Error fetching attendance records:", attendanceError);
        toast({
          title: "Error",
          description: `Gagal memuat data presensi: ${attendanceError.message}`,
          variant: "destructive",
        });
        setTodayAttendance([]);
        return;
      }

      // Set attendance data (empty array if no data)
      setTodayAttendance(attendanceData || []);

      if (!attendanceData || attendanceData.length === 0) {
        console.log("No attendance records found for today");
      } else {
        console.log(
          `Found ${attendanceData.length} attendance records for today`,
        );
      }
    } catch (error: any) {
      console.error("Error fetching today's attendance:", error);
      toast({
        title: "Error",
        description: `Gagal memuat data presensi: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
      setTodayAttendance([]);
    }
  };

  const handleSubmit = async () => {
    // Enhanced validation
    if (
      !selectedUser ||
      selectedUser === "loading" ||
      selectedUser === "no-users"
    ) {
      toast({
        title: "Error",
        description: "Harap pilih user terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!workType) {
      toast({
        title: "Error",
        description: "Harap pilih tipe kerja",
        variant: "destructive",
      });
      return;
    }

    if (!clockInTime) {
      toast({
        title: "Error",
        description: "Jam masuk wajib diisi",
        variant: "destructive",
      });
      return;
    }

    // Validate clock out time is after clock in time
    if (clockOutTime && clockOutTime <= clockInTime) {
      toast({
        title: "Error",
        description: "Jam pulang harus setelah jam masuk",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if attendance already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", selectedUser)
        .eq("date", today)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking existing record:", checkError);
        throw new Error(`Gagal mengecek data presensi: ${checkError.message}`);
      }

      // Create ISO strings for time
      const clockInISO = new Date(`${today}T${clockInTime}:00`).toISOString();
      const clockOutISO = clockOutTime
        ? new Date(`${today}T${clockOutTime}:00`).toISOString()
        : null;

      const attendanceData = {
        user_id: selectedUser,
        date: today,
        clock_in_time: clockInISO,
        clock_out_time: clockOutISO,
        work_type: workType,
        status: clockOutISO ? "completed" : "active",
        daily_report: dailyReport.trim() || null,
      };

      let operation: string;
      let result;

      if (existingRecord) {
        // Update existing record
        result = await supabase
          .from("attendance_records")
          .update(attendanceData)
          .eq("id", existingRecord.id);
        operation = "diperbarui";
      } else {
        // Create new record
        result = await supabase
          .from("attendance_records")
          .insert(attendanceData);
        operation = "disimpan";
      }

      if (result.error) {
        console.error("Error saving attendance:", result.error);
        throw new Error(`Gagal menyimpan presensi: ${result.error.message}`);
      }

      const selectedUserName =
        users.find((u) => u.user_id === selectedUser)?.full_name || "User";

      toast({
        title: "Berhasil",
        description: `Presensi ${selectedUserName} telah ${operation}`,
      });

      // Reset form
      setSelectedUser("");
      setWorkType("");
      setClockInTime("");
      setClockOutTime("");
      setDailyReport("");

      // Refresh today's attendance
      await fetchTodayAttendance();
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan presensi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getWorkTypeInfo = (workType: string) => {
    return workTypeOptions.find((option) => option.value === workType);
  };

  return (
    <div className="space-y-6">
      {/* Form Input Presensi */}
      <Card className="shadow-md border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Input Presensi User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Pilih User
            </label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih user..." />
              </SelectTrigger>
              <SelectContent>
                {loadingUsers ? (
                  <SelectItem value="loading" disabled>
                    Memuat...
                  </SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="no-users" disabled>
                    Tidak ada user
                  </SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {user.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.position} - {user.department}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Work Type Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Tipe Kerja
            </label>
            <Select value={workType} onValueChange={setWorkType}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe kerja..." />
              </SelectTrigger>
              <SelectContent>
                {workTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Time Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Jam Masuk *
              </label>
              <input
                type="time"
                value={clockInTime}
                onChange={(e) => setClockInTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Jam Pulang
              </label>
              <input
                type="time"
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              />
            </div>
          </div>

          {/* Daily Report */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Laporan Kegiatan
            </label>
            <Textarea
              value={dailyReport}
              onChange={(e) => setDailyReport(e.target.value)}
              placeholder="Masukkan laporan kegiatan harian..."
              className="min-h-[100px]"
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Presensi"}
          </Button>
        </CardContent>
      </Card>

      {/* Today's Attendance Summary */}
      <Card className="shadow-md border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Presensi Hari Ini
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTodayAttendance}
              disabled={loading}
              className="h-8"
            >
              Refresh
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
          </p>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">
                Memuat data presensi...
              </p>
            </div>
          ) : todayAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Belum ada data presensi hari ini</p>
              <p className="text-sm">
                Data akan muncul setelah mengisi presensi user
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-3">
                Total: {todayAttendance.length} presensi tercatat
              </div>
              {todayAttendance.map((record: any) => {
                const workTypeInfo = getWorkTypeInfo(record.work_type);
                const Icon = workTypeInfo?.icon || Clock;

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {record.profiles?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {record.profiles?.full_name || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.profiles?.position || "N/A"} -{" "}
                          {record.profiles?.department || "N/A"}
                        </p>
                        {record.profiles?.employee_id && (
                          <p className="text-xs text-muted-foreground">
                            NIP: {record.profiles.employee_id}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${workTypeInfo?.color || "bg-gray-500"} text-white shadow-sm`}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {record.work_type}
                      </Badge>
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-green-600" />
                          <span className="font-medium">
                            {record.clock_in_time
                              ? format(new Date(record.clock_in_time), "HH:mm")
                              : "-"}
                          </span>
                        </div>
                        {record.clock_out_time && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CheckCircle className="w-3 h-3 text-blue-600" />
                            <span className="font-medium">
                              {format(new Date(record.clock_out_time), "HH:mm")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
