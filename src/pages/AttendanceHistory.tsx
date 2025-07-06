import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Filter, ChevronRight, Users, User, ArrowLeft } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  work_type: string;
  status: string;
  daily_report?: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  position: string;
  department: string;
  employee_id: string;
}

export default function AttendanceHistory() {
  const { user } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"));
  
  // Admin-specific states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserList, setShowUserList] = useState(true);

  const isAdmin = userRole?.role === 'admin';

  useEffect(() => {
    if (user && !roleLoading) {
      if (isAdmin) {
        fetchUsers();
      } else {
        fetchAttendanceRecords();
      }
    }
  }, [user, filterMonth, roleLoading, isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async (targetUserId?: string) => {
    try {
      setLoading(true);
      const startDate = startOfMonth(new Date(filterMonth + "-01"));
      const endDate = endOfMonth(new Date(filterMonth + "-01"));

      const userId = targetUserId || user?.id;

      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", userId)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"))
        .order("date", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (selectedUserProfile: UserProfile) => {
    setSelectedUser(selectedUserProfile);
    setShowUserList(false);
    fetchAttendanceRecords(selectedUserProfile.user_id);
  };

  const handleBackToUserList = () => {
    setShowUserList(true);
    setSelectedUser(null);
    setRecords([]);
  };

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case "WFO":
        return "bg-attendance-wfo text-white";
      case "DL":
        return "bg-attendance-dl text-white";
      case "Cuti":
        return "bg-attendance-cuti text-white";
      case "Sakit":
        return "bg-attendance-sakit text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatus = (record: AttendanceRecord) => {
    if (!record.clock_in_time) return "Tidak Hadir";
    if (!record.clock_out_time) return "Belum Pulang";

    const clockIn = new Date(record.clock_in_time);
    const workStart = new Date(clockIn);
    workStart.setHours(8, 0, 0, 0);

    if (clockIn > workStart) return "Terlambat";
    return "Tepat Waktu";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Tepat Waktu":
        return "text-success";
      case "Terlambat":
        return "text-warning";
      case "Tidak Hadir":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 sm:pb-20">
      <MobileHeader 
        title={
          isAdmin && !showUserList 
            ? `Rekap: ${selectedUser?.full_name}` 
            : isAdmin 
              ? "Rekap Semua User" 
              : "Rekap Presensi"
        } 
      />

      <div className="p-4 space-y-4">
        {/* Admin: Show user list or selected user's attendance */}
        {isAdmin ? (
          showUserList ? (
            <>
              {/* User List View for Admin */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Pilih User untuk Melihat Rekap
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <LoadingSpinner message="Memuat daftar user..." />
                  ) : users.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">Tidak ada data user</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {users.map((userProfile, index) => (
                        <div
                          key={userProfile.id}
                          className={`p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors ${
                            index !== users.length - 1
                              ? "border-b border-border"
                              : ""
                          }`}
                          onClick={() => handleUserSelect(userProfile)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-primary" />
                              <p className="font-medium text-foreground">
                                {userProfile.full_name}
                              </p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>{userProfile.position} • {userProfile.department}</p>
                              <p>NIP: {userProfile.employee_id}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Selected User's Attendance View */}
              <Card className="shadow-card border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleBackToUserList}
                      className="p-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filter Periode
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedUser?.full_name} - {selectedUser?.position}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    onClick={() => fetchAttendanceRecords(selectedUser?.user_id)}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Memuat..." : "Tampilkan Data"}
                  </Button>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="shadow-card border-0">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-success">
                      {records.filter((r) => getStatus(r) === "Tepat Waktu").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Tepat Waktu</p>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-0">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-warning">
                      {records.filter((r) => getStatus(r) === "Terlambat").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Terlambat</p>
                  </CardContent>
                </Card>
                <Card className="shadow-card border-0">
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">
                      {records.filter((r) => getStatus(r) === "Tidak Hadir").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Tidak Hadir</p>
                  </CardContent>
                </Card>
              </div>

              {/* Records List */}
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Riwayat Kehadiran</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <LoadingSpinner message="Memuat data..." />
                  ) : records.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">Tidak ada data presensi</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {records.map((record, index) => {
                        const status = getStatus(record);
                        const date = parseISO(record.date);

                        return (
                          <div
                            key={record.id}
                            className={`p-4 flex items-center justify-between hover:bg-muted/30 ${
                              index !== records.length - 1
                                ? "border-b border-border"
                                : ""
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-foreground">
                                  {format(date, "EEEE, dd MMM yyyy", { locale: id })}
                                </p>
                                <div
                                  className={`px-2 py-1 rounded-md text-xs font-medium ${getWorkTypeColor(record.work_type)}`}
                                >
                                  {record.work_type}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>
                                  Masuk:{" "}
                                  {record.clock_in_time
                                    ? format(parseISO(record.clock_in_time), "HH:mm")
                                    : "--:--"}
                                </span>
                                <span>
                                  Pulang:{" "}
                                  {record.clock_out_time
                                    ? format(parseISO(record.clock_out_time), "HH:mm")
                                    : "--:--"}
                                </span>
                              </div>
                              <p
                                className={`text-sm font-medium ${getStatusColor(status)}`}
                              >
                                {status}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )
        ) : (
          <>
            {/* Regular User View */}
            <Card className="shadow-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter Periode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Input
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Button
                  onClick={() => fetchAttendanceRecords()}
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Memuat..." : "Tampilkan Data"}
                </Button>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="shadow-card border-0">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-success">
                    {records.filter((r) => getStatus(r) === "Tepat Waktu").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Tepat Waktu</p>
                </CardContent>
              </Card>
              <Card className="shadow-card border-0">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-warning">
                    {records.filter((r) => getStatus(r) === "Terlambat").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Terlambat</p>
                </CardContent>
              </Card>
              <Card className="shadow-card border-0">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {records.filter((r) => getStatus(r) === "Tidak Hadir").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Tidak Hadir</p>
                </CardContent>
              </Card>
            </div>

            {/* Records List */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Kehadiran</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <LoadingSpinner message="Memuat data..." />
                ) : records.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">Tidak ada data presensi</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {records.map((record, index) => {
                      const status = getStatus(record);
                      const date = parseISO(record.date);

                      return (
                        <div
                          key={record.id}
                          className={`p-4 flex items-center justify-between hover:bg-muted/30 ${
                            index !== records.length - 1
                              ? "border-b border-border"
                              : ""
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-foreground">
                                {format(date, "EEEE, dd MMM yyyy", { locale: id })}
                              </p>
                              <div
                                className={`px-2 py-1 rounded-md text-xs font-medium ${getWorkTypeColor(record.work_type)}`}
                              >
                                {record.work_type}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                Masuk:{" "}
                                {record.clock_in_time
                                  ? format(parseISO(record.clock_in_time), "HH:mm")
                                  : "--:--"}
                              </span>
                              <span>
                                Pulang:{" "}
                                {record.clock_out_time
                                  ? format(parseISO(record.clock_out_time), "HH:mm")
                                  : "--:--"}
                              </span>
                            </div>
                            <p
                              className={`text-sm font-medium ${getStatusColor(status)}`}
                            >
                              {status}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
