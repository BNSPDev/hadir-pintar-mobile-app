import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { ClockOutModal } from "@/components/ClockOutModal";
import { ActivityReportModal } from "@/components/ActivityReportModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  isWorkingHours,
  isLateArrival,
  getAttendanceMessage,
} from "@/utils/workHours";
import {
  Building2,
  Car,
  Calendar,
  Heart,
  CheckCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface AttendanceRecord {
  id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  work_type: string;
  status: string;
  daily_report?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [showWorkTypeSelector, setShowWorkTypeSelector] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance
  useEffect(() => {
    if (user) {
      fetchTodayAttendance();
    }
  }, [user]);

  const fetchTodayAttendance = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", user?.id)
        .eq("date", today)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setTodayRecord(data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  const handleClockIn = async (workType: "WFO" | "DL" | "Cuti" | "Sakit") => {
    setLoading(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const now = new Date();
      const nowISO = now.toISOString();

      const { error } = await supabase.from("attendance_records").insert({
        user_id: user?.id,
        date: today,
        clock_in_time: nowISO,
        work_type: workType,
        status: "active",
      });

      if (error) throw error;

      const message = getAttendanceMessage(now, true);
      const isLate = isLateArrival(now);

      toast({
        title: "Absen Masuk Berhasil",
        description: message,
        variant: isLate ? "destructive" : "default",
      });

      setShowWorkTypeSelector(false);
      fetchTodayAttendance();
    } catch (error: any) {
      toast({
        title: "Gagal Absen Masuk",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async (report: string) => {
    setLoading(true);
    try {
      const now = new Date();
      const nowISO = now.toISOString();

      const { error } = await supabase
        .from("attendance_records")
        .update({
          clock_out_time: nowISO,
          daily_report: report,
          status: "completed",
        })
        .eq("id", todayRecord?.id);

      if (error) throw error;

      const message = getAttendanceMessage(now, false);

      toast({
        title: "Absen Pulang Berhasil",
        description: message,
      });

      setShowClockOutModal(false);
      fetchTodayAttendance();
    } catch (error: any) {
      toast({
        title: "Gagal Absen Pulang",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return <LoadingSpinner fullScreen message="Memuat dashboard..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const workTypeOptions = [
    {
      type: "WFO" as const,
      label: "WFO",
      icon: Building2,
      color: "bg-attendance-wfo",
    },
    { type: "DL" as const, label: "DL", icon: Car, color: "bg-attendance-dl" },
    {
      type: "Cuti" as const,
      label: "Cuti",
      icon: Calendar,
      color: "bg-attendance-cuti",
    },
    {
      type: "Sakit" as const,
      label: "Sakit",
      icon: Heart,
      color: "bg-attendance-sakit",
    },
  ];

  const indonesianDate = format(currentTime, "EEEE, dd MMMM yyyy", {
    locale: id,
  });
  const timeString = format(currentTime, "HH:mm:ss");

  return (
    <div className="min-h-screen pb-32 sm:pb-24 bg-background">
      <MobileHeader title={profile?.full_name || "User"} />
      <div className="p-4 space-y-6 mt-4">
        {/* User Profile Card */}
        <Card className="shadow-md border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16 ring-2 ring-primary/20 shadow-sm">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-xl text-foreground truncate">
                  {profile?.full_name || "Loading..."}
                </h2>
                <p className="text-sm font-semibold text-secondary">
                  {profile?.position || "STAFF"}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {profile?.department || "Department"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Time */}
        <Card className="shadow-md border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3 font-medium tracking-wide">
              {indonesianDate}
            </p>
            <p className="text-4xl font-bold text-primary tracking-tight">
              {timeString}
            </p>
          </CardContent>
        </Card>

        {/* Attendance Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {!todayRecord?.clock_in_time ? (
            <Button
              onClick={() => setShowWorkTypeSelector(true)}
              className="h-24 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-lg border-2 border-secondary/30 shadow-md"
              disabled={loading}
            >
              <div className="text-center">
                <Clock className="w-8 h-8 mx-auto mb-2" />
                <span className="text-base font-bold">Masuk</span>
              </div>
            </Button>
          ) : (
            <Button
              disabled
              className="h-24 bg-success text-success-foreground font-bold text-lg shadow-md border-2 border-success/30"
            >
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-bold">
                  Masuk: {format(new Date(todayRecord.clock_in_time), "HH:mm")}
                </div>
              </div>
            </Button>
          )}

          <Button
            onClick={() => setShowClockOutModal(true)}
            disabled={
              !todayRecord?.clock_in_time || !!todayRecord?.clock_out_time
            }
            className="h-24 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground border-2 border-accent/30 shadow-md"
          >
            <div className="text-center">
              <Clock className="w-8 h-8 mx-auto mb-2" />
              <span className="text-base font-bold">Pulang</span>
            </div>
          </Button>
        </div>

        {/* Work Type Selector Modal */}
        {showWorkTypeSelector && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-border">
              <h3 className="font-bold text-xl mb-6 text-center text-foreground">
                Pilih Tipe Kerja
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {workTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.type}
                      onClick={() => handleClockIn(option.type)}
                      className={`h-24 ${option.color} hover:opacity-90 text-white font-bold border-2 border-white/30 shadow-md`}
                      disabled={loading}
                    >
                      <div className="text-center">
                        <Icon className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-base font-bold">
                          {option.label}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowWorkTypeSelector(false)}
                size="lg"
                className="w-full mt-6 font-bold text-foreground"
                disabled={loading}
              >
                Batal
              </Button>
            </div>
          </div>
        )}

        {/* Today's Activity Report */}
        <Card
          className="shadow-card border border-border bg-gradient-card cursor-pointer hover:bg-muted/20 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] backdrop-blur-sm"
          onClick={() => setShowActivityModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-foreground mb-1">
                  Laporkan Kegiatan Hari Ini
                </h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Jangan lupa untuk selalu melaporkan pekerjaanmu setiap harian.
                </p>
              </div>
              <div className="bg-accent/10 rounded-full p-2">
                <ChevronRight className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card className="shadow-card border border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Rekap Presensi</h3>
              <Button
                variant="link"
                className="text-primary p-0 h-auto hover:text-primary/80"
                onClick={() => navigate("/attendance-history")}
              >
                Lihat Semua
              </Button>
            </div>

            <div className="space-y-3">
              {todayRecord ? (
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50">
                  <div>
                    <p className="font-medium text-foreground">
                      {format(new Date(), "EEEE, dd MMM yyyy", { locale: id })}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>
                        Jam Masuk:{" "}
                        {todayRecord.clock_in_time
                          ? format(new Date(todayRecord.clock_in_time), "HH:mm")
                          : "-"}
                      </span>
                      <span>
                        Jam Pulang:{" "}
                        {todayRecord.clock_out_time
                          ? format(
                              new Date(todayRecord.clock_out_time),
                              "HH:mm",
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary" />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada data presensi hari ini</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <ClockOutModal
          isOpen={showClockOutModal}
          onClose={() => setShowClockOutModal(false)}
          onSubmit={handleClockOut}
          loading={loading}
        />

        <ActivityReportModal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
        />
      </div>
      <BottomNav />
    </div>
  );
}
