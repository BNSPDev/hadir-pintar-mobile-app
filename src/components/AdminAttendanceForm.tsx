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
import {
  validateAdminAccess,
  fetchNonAdminUsers,
  fetchAttendanceByDate,
  validateAttendanceForm,
  saveAttendanceRecord,
  formatDateDisplay,
  getWorkTypeInfo,
  type User,
  type AttendanceRecord,
} from "@/utils/adminHelpers";

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
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [isEditMode, setIsEditMode] = useState(false);

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

  // Load existing record when user is selected
  const loadExistingRecord = async (userId: string) => {
    try {
      const result = await fetchAttendanceByDate(today);
      const userRecord = result.records.find(
        (record) => record.user_id === userId,
      );

      if (userRecord) {
        setExistingRecord(userRecord);
        setIsEditMode(true);

        // Auto-fill form with existing data
        setWorkType(userRecord.work_type);
        if (userRecord.clock_in_time) {
          const clockInTime = new Date(userRecord.clock_in_time);
          setClockInTime(format(clockInTime, "HH:mm"));
        }
        if (userRecord.clock_out_time) {
          const clockOutTime = new Date(userRecord.clock_out_time);
          setClockOutTime(format(clockOutTime, "HH:mm"));
        }
        setDailyReport(userRecord.daily_report || "");

        toast({
          title: "Data Ditemukan",
          description: `Memuat data presensi ${users.find((u) => u.user_id === userId)?.full_name || "user"} hari ini`,
          variant: "default",
        });
      } else {
        // Reset if no existing record
        setExistingRecord(null);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error loading existing record:", error);
    }
  };

  // Handle user selection change
  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);

    // Reset form first
    setWorkType("");
    setClockInTime("");
    setClockOutTime("");
    setDailyReport("");
    setExistingRecord(null);
    setIsEditMode(false);

    // Load existing record if user is selected
    if (userId && userId !== "loading" && userId !== "no-users") {
      loadExistingRecord(userId);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Validate admin access using helper
        const adminCheck = await validateAdminAccess();

        if (!adminCheck.isValid) {
          toast({
            title: "Access Denied",
            description: adminCheck.error || "Anda tidak memiliki akses admin",
            variant: "destructive",
          });
          setLoadingUsers(false);
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
        setLoadingUsers(false);
      }
    };

    initializeData();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      const result = await fetchNonAdminUsers();

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setUsers([]);
        return;
      }

      setUsers(result.users);

      if (result.users.length === 0) {
        toast({
          title: "Informasi",
          description: "Tidak ada user non-admin ditemukan",
          variant: "default",
        });
      } else {
        console.log(`Loaded ${result.users.length} non-admin users`);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: `Gagal memuat daftar user: ${error.message}`,
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const result = await fetchAttendanceByDate(today);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setTodayAttendance([]);
        return;
      }

      setTodayAttendance(result.records);
      console.log(
        `Found ${result.records.length} attendance records for today`,
      );
    } catch (error: any) {
      console.error("Error fetching today's attendance:", error);
      toast({
        title: "Error",
        description: `Gagal memuat data presensi: ${error.message}`,
        variant: "destructive",
      });
      setTodayAttendance([]);
    }
  };

  const handleSubmit = async (saveType: "draft" | "complete" = "draft") => {
    // Basic validation
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

    // For complete save, require clock out time
    if (saveType === "complete" && !clockOutTime) {
      toast({
        title: "Error",
        description: "Jam pulang wajib diisi untuk menyelesaikan presensi",
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
      // Save attendance using helper
      const result = await saveAttendanceRecord({
        userId: selectedUser,
        date: today,
        clockInTime,
        clockOutTime: saveType === "complete" ? clockOutTime : clockOutTime, // Allow partial save
        workType,
        dailyReport,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const selectedUserName =
        users.find((u) => u.user_id === selectedUser)?.full_name || "User";

      const statusText =
        saveType === "complete"
          ? clockOutTime
            ? "diselesaikan"
            : "disimpan"
          : existingRecord
            ? "diperbarui"
            : "disimpan sebagai draft";

      toast({
        title: "Berhasil",
        description: `Presensi ${selectedUserName} telah ${statusText}`,
      });

      // Only reset form if it's a complete save
      if (saveType === "complete") {
        setSelectedUser("");
        setWorkType("");
        setClockInTime("");
        setClockOutTime("");
        setDailyReport("");
        setExistingRecord(null);
        setIsEditMode(false);
      } else {
        // For draft save, reload the record to update the UI
        await loadExistingRecord(selectedUser);
      }

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
            <Select value={selectedUser} onValueChange={handleUserChange}>
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

          {/* Time Inputs - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Jam Masuk *
              </label>
              <input
                type="time"
                value={clockInTime}
                onChange={(e) => setClockInTime(e.target.value)}
                className="w-full px-3 py-3 sm:py-2 border border-border rounded-md bg-background text-foreground text-base sm:text-sm"
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
                className="w-full px-3 py-3 sm:py-2 border border-border rounded-md bg-background text-foreground text-base sm:text-sm"
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

          {/* Status Indicator - Mobile Optimized */}
          {isEditMode && existingRecord && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-blue-700 block">
                    Mode Edit: Data presensi ditemukan
                  </span>
                  <div className="text-xs text-blue-600 mt-1">
                    Status:{" "}
                    {existingRecord.clock_out_time
                      ? "Selesai"
                      : "Draft (Jam pulang belum diisi)"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Buttons - Mobile Optimized */}
          <div className="space-y-3">
            {!existingRecord?.clock_out_time && (
              <Button
                onClick={() => handleSubmit("draft")}
                variant="outline"
                className="w-full h-12 text-base font-medium"
                disabled={loading}
              >
                {loading
                  ? "Menyimpan..."
                  : isEditMode
                    ? "Update Draft"
                    : "Simpan Draft"}
              </Button>
            )}

            {clockOutTime && (
              <Button
                onClick={() => handleSubmit("complete")}
                className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? "Menyelesaikan..." : "Selesaikan Presensi"}
              </Button>
            )}

            {!clockOutTime && !isEditMode && (
              <Button
                onClick={() => handleSubmit("draft")}
                className="w-full h-12 text-base font-medium"
                disabled={loading}
              >
                {loading ? "Menyimpan..." : "Simpan Presensi"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's Attendance Summary - Mobile Optimized */}
      <Card className="shadow-md border border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-lg font-bold">
                  Presensi Hari Ini
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTodayAttendance}
              disabled={loading}
              className="h-8 self-start sm:self-auto"
            >
              Refresh
            </Button>
          </div>
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
                    className="p-3 sm:p-4 bg-muted/50 rounded-xl border border-border/50 hover:bg-muted/70 transition-colors"
                  >
                    {/* Mobile-first responsive layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* User Info Section */}
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {record.profiles?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {record.profiles?.full_name || "Unknown User"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {record.profiles?.position || "N/A"} -{" "}
                            {record.profiles?.department || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Badge and Time Section */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <Badge
                          className={`${workTypeInfo?.color || "bg-gray-500"} text-white shadow-sm flex-shrink-0`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {record.work_type}
                        </Badge>

                        {/* Time Display - Responsive */}
                        <div className="flex gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-green-600" />
                            <span className="font-medium">
                              {record.clock_in_time
                                ? format(
                                    new Date(record.clock_in_time),
                                    "HH:mm",
                                  )
                                : "-"}
                            </span>
                          </div>
                          {record.clock_out_time && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                              <span className="font-medium">
                                {format(
                                  new Date(record.clock_out_time),
                                  "HH:mm",
                                )}
                              </span>
                            </div>
                          )}
                        </div>
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
