import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ActivityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSaved?: () => void; // Callback to refresh dashboard
}

interface ActivityReport {
  id: string;
  date: string;
  daily_report: string;
  work_type: string;
}

export function ActivityReportModal({
  isOpen,
  onClose,
  onReportSaved,
}: ActivityReportModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<ActivityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [newReport, setNewReport] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [todayReport, setTodayReport] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      fetchReports();
      fetchTodayReport();
    }
  }, [isOpen, user]);

  const fetchTodayReport = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("attendance_records")
        .select("daily_report")
        .eq("user_id", user?.id)
        .eq("date", today)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.daily_report) {
        setTodayReport(data.daily_report);
        setNewReport(data.daily_report);
      } else {
        setTodayReport("");
        setNewReport("");
      }
    } catch (error) {
      console.error("Error fetching today's report:", error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, date, daily_report, work_type")
        .eq("user_id", user?.id)
        .not("daily_report", "is", null)
        .order("date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!newReport.trim()) {
      toast({
        title: "Error",
        description: "Laporan kegiatan tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Check if attendance record exists for the selected date
      const { data: existingRecord, error: fetchError } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("user_id", user?.id)
        .eq("date", selectedDate)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from("attendance_records")
          .update({ daily_report: newReport.trim() })
          .eq("id", existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record without clock_out_time (report only)
        const { error } = await supabase.from("attendance_records").insert({
          user_id: user?.id,
          date: selectedDate,
          daily_report: newReport.trim(),
          work_type: "WFO",
          status: "report_only", // Special status for report-only records
        });

        if (error) throw error;
      }

      toast({
        title: "Berhasil",
        description: "Laporan kegiatan berhasil disimpan",
      });

      setNewReport("");
      fetchReports();

      // Call callback to refresh dashboard
      if (onReportSaved) {
        onReportSaved();
      }
    } catch (error: any) {
      toast({
        title: "Gagal",
        description:
          error.message || "Terjadi kesalahan saat menyimpan laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl h-[80vh] bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg text-card-foreground">
            Laporan Kegiatan Harian
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
          {/* Today's Report */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">
                Laporan Kegiatan Hari Ini
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                {format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })}
              </p>
              <Textarea
                value={newReport}
                onChange={(e) => setNewReport(e.target.value)}
                placeholder="Tuliskan kegiatan yang telah dilakukan hari ini..."
                className="min-h-[120px] bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              onClick={handleSubmitReport}
              disabled={loading || !newReport.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading
                ? "Menyimpan..."
                : todayReport
                  ? "Update Laporan"
                  : "Simpan Laporan"}
            </Button>
            {todayReport && (
              <p className="text-xs text-success text-center">
                ✅ Laporan hari ini sudah tersimpan. Saat absen pulang tidak
                perlu mengisi laporan lagi.
              </p>
            )}
          </div>

          {/* Reports History */}
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground mb-3">
              Riwayat Laporan
            </h3>
            <ScrollArea className="h-full">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Memuat laporan...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Belum ada laporan kegiatan
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 bg-muted/30 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-card-foreground">
                          {format(new Date(report.date), "EEEE, dd MMMM yyyy", {
                            locale: id,
                          })}
                        </p>
                        <div className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-md">
                          {report.work_type}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.daily_report}
                      </p>
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
