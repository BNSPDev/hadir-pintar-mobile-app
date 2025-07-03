import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';
import { ClockOutModal } from '@/components/ClockOutModal';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isWorkingHours, isLateArrival, getAttendanceMessage } from '@/utils/workHours';
import { 
  Building2, 
  Car, 
  Calendar, 
  Heart,
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', user?.id)
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setTodayRecord(data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleClockIn = async (workType: 'WFO' | 'DL' | 'Cuti' | 'Sakit') => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      const nowISO = now.toISOString();

      const { error } = await supabase
        .from('attendance_records')
        .insert({
          user_id: user?.id,
          date: today,
          clock_in_time: nowISO,
          work_type: workType,
          status: 'active'
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
        .from('attendance_records')
        .update({
          clock_out_time: nowISO,
          daily_report: report,
          status: 'completed'
        })
        .eq('id', todayRecord?.id);

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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const workTypeOptions = [
    { type: 'WFO' as const, label: 'WFO', icon: Building2, color: 'bg-attendance-wfo' },
    { type: 'DL' as const, label: 'DL', icon: Car, color: 'bg-attendance-dl' },
    { type: 'Cuti' as const, label: 'Cuti', icon: Calendar, color: 'bg-attendance-cuti' },
    { type: 'Sakit' as const, label: 'Sakit', icon: Heart, color: 'bg-attendance-sakit' },
  ];

  const indonesianDate = format(currentTime, 'EEEE, dd MMMM yyyy', { locale: id });
  const timeString = format(currentTime, 'HH:mm:ss');

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title={profile?.full_name || 'User'} />
      
      <div className="p-4 space-y-6">
        {/* User Profile Card */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">
                  {profile?.full_name || 'Loading...'}
                </h2>
                <p className="text-sm font-medium text-primary">
                  {profile?.position || 'STAFF'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.department || 'Department'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Time */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">{indonesianDate}</p>
            <p className="text-3xl font-bold text-primary">{timeString}</p>
          </CardContent>
        </Card>

        {/* Attendance Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {!todayRecord?.clock_in_time ? (
            <Button
              onClick={() => setShowWorkTypeSelector(true)}
              className="h-20 bg-attendance-wfo hover:bg-attendance-wfo/90 text-white font-semibold text-lg"
              disabled={loading}
            >
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto mb-1" />
                Masuk
              </div>
            </Button>
          ) : (
            <Button
              disabled
              className="h-20 bg-success text-success-foreground font-semibold text-lg"
            >
              <div className="text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                <div className="text-xs">
                  {format(new Date(todayRecord.clock_in_time), 'HH:mm')}
                </div>
              </div>
            </Button>
          )}

          <Button
            onClick={() => setShowClockOutModal(true)}
            disabled={!todayRecord?.clock_in_time || !!todayRecord?.clock_out_time}
            className="h-20 bg-warning hover:bg-warning/90 text-warning-foreground font-semibold text-lg disabled:opacity-50"
          >
            <div className="text-center">
              <Clock className="w-6 h-6 mx-auto mb-1" />
              Pulang
            </div>
          </Button>
        </div>

        {/* Work Type Selector Modal */}
        {showWorkTypeSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-bold text-lg mb-4 text-center">Pilih Tipe Kerja</h3>
              <div className="grid grid-cols-2 gap-3">
                {workTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.type}
                      onClick={() => handleClockIn(option.type)}
                      className={`h-20 ${option.color} hover:opacity-90 text-white font-semibold`}
                      disabled={loading}
                    >
                      <div className="text-center">
                        <Icon className="w-6 h-6 mx-auto mb-2" />
                        {option.label}
                      </div>
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowWorkTypeSelector(false)}
                className="w-full mt-4"
                disabled={loading}
              >
                Batal
              </Button>
            </div>
          </div>
        )}

        {/* Today's Activity Report */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Laporkan Kegiatan Hari Ini</h3>
                <p className="text-sm text-muted-foreground">
                  Jangan lupa untuk selalu melaporkan pekerjaanmu setiap harian.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Rekap Presensi</h3>
              <Button variant="link" className="text-primary p-0 h-auto" onClick={() => navigate('/attendance-history')}>
                Lihat Semua
              </Button>
            </div>
            
            <div className="space-y-3">
              {todayRecord ? (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">
                      {format(new Date(), 'EEEE, dd MMM yyyy', { locale: id })}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Jam Masuk: {todayRecord.clock_in_time ? format(new Date(todayRecord.clock_in_time), 'HH:mm') : '-'}</span>
                      <span>Jam Pulang: {todayRecord.clock_out_time ? format(new Date(todayRecord.clock_out_time), 'HH:mm') : '-'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada data presensi hari ini</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Clock Out Modal */}
        <ClockOutModal
          isOpen={showClockOutModal}
          onClose={() => setShowClockOutModal(false)}
          onSubmit={handleClockOut}
          loading={loading}
        />
      </div>

      <BottomNav />
    </div>
  );
}