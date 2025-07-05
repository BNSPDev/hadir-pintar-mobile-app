import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { validateDailyReport } from "@/utils/validation";
import { X } from "lucide-react";

interface ClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (report: string) => void;
  loading: boolean;
}

export function ClockOutModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
}: ClockOutModalProps) {
  const [report, setReport] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (report.trim()) {
      onSubmit(report.trim());
      setReport("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Laporkan Kegiatan Hari Ini</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Silakan tuliskan ringkasan kegiatan yang telah Anda lakukan hari
                ini:
              </p>
              <Textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Contoh: Menghadiri meeting tim, menyelesaikan laporan bulanan, koordinasi dengan departemen lain..."
                className="min-h-[120px] resize-none"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || !report.trim()}
                className="flex-1"
              >
                {loading ? "Menyimpan..." : "Absen Pulang"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
