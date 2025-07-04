import { Clock } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  showTime?: boolean;
}

export function MobileHeader({ title, showTime = true }: MobileHeaderProps) {
  const now = new Date();
  const timeString = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-primary text-primary-foreground p-4 rounded-b-3xl shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <img
            src="/logo-bnsp.png"
            alt="BNSP Logo"
            className="w-10 h-10 object-contain bg-white rounded-lg p-1"
          />
          <div>
            <span className="text-xs font-medium opacity-90 block">
              BADAN NASIONAL SERTIFIKASI PROFESI
            </span>
            <span className="text-xs font-bold opacity-100 block">
              E-PRESENSI ANGGOTA BNSP
            </span>
          </div>
        </div>
        {showTime && (
          <div className="flex items-center gap-1 text-right">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-bold">{timeString}</span>
          </div>
        )}
      </div>
      <h1 className="text-lg font-bold">{title}</h1>
    </div>
  );
}
