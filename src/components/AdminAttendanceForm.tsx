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
    fetchUsers();
    fetchTodayAttendance();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log("Fetching users as admin...");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, position, department, employee_id")
        .order("full_name");

      if (error) {
        console.error("Supabase error fetching users:", error);
        throw new Error(
          `Database error: ${error.message} (Code: ${error.code})`,
        );
      }

      console.log("Users fetched successfully:", data?.length || 0);
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: `Gagal memuat daftar user: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      // First get attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("date", today)
        .order("created_at", { ascending: false });

      if (attendanceError) {
        console.error(
          "Error fetching attendance records:",
          attendanceError.message,
        );
        toast({
          title: "Error",
          description: `Gagal memuat data presensi: ${attendanceError.message}`,
          variant: "destructive",
        });
        return;
      }

      // If no attendance records, set empty array
      if (!attendanceData || attendanceData.length === 0) {
        setTodayAttendance([]);
        return;
      }

      // Get all user profiles for the users in attendance records
      const userIds = attendanceData.map((record) => record.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, position, department")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError.message);
        // Still show attendance data even if profiles fail
        setTodayAttendance(attendanceData);
        return;
      }

      // Combine attendance data with profile data
      const combinedData = attendanceData.map((record) => ({
        ...record,
        profiles:
          profilesData?.find((profile) => profile.user_id === record.user_id) ||
          null,
      }));

      setTodayAttendance(combinedData);
    } catch (error: any) {
      console.error("Error fetching today's attendance:", error.message);
      toast({
        title: "Error",
        description: `Gagal memuat data presensi: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (
      !selectedUser ||
      !workType ||
      selectedUser === "loading" ||
      selectedUser === "no-users"
    ) {
      toast({
        title: "Error",
        description: "Harap pilih user dan tipe kerja",
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

    setLoading(true);
    try {
      // Check if attendance already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", selectedUser)
        .eq("date", today)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") throw checkError;

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
        daily_report: dailyReport || null,
      };

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from("attendance_records")
          .update(attendanceData)
          .eq("id", existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from("attendance_records")
          .insert(attendanceData);

        if (error) throw error;
      }

      const selectedUserName =
        users.find((u) => u.user_id === selectedUser)?.full_name || "User";

      toast({
        title: "Berhasil",
        description: `Presensi ${selectedUserName} telah ${existingRecord ? "diperbarui" : "disimpan"}`,
      });

      // Reset form
      setSelectedUser("");
      setWorkType("");
      setClockInTime("");
      setClockOutTime("");
      setDailyReport("");

      // Refresh today's attendance
      fetchTodayAttendance();
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan presensi",
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
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Presensi Hari Ini (
            {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Belum ada data presensi hari ini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAttendance.map((record: any) => {
                const workTypeInfo = getWorkTypeInfo(record.work_type);
                const Icon = workTypeInfo?.icon || Clock;

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {record.profiles?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {record.profiles?.full_name || "Unknown User"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.profiles?.position} -{" "}
                          {record.profiles?.department}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${workTypeInfo?.color || "bg-gray-500"} text-white`}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {record.work_type}
                      </Badge>
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {record.clock_in_time
                            ? format(new Date(record.clock_in_time), "HH:mm")
                            : "-"}
                        </div>
                        {record.clock_out_time && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CheckCircle className="w-3 h-3" />
                            {format(new Date(record.clock_out_time), "HH:mm")}
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
