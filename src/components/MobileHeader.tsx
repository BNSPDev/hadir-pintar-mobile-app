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
    <div className="bg-gradient-to-br from-primary to-primary-light text-primary-foreground p-6 rounded-b-[2rem] shadow-header relative overflow-hidden">
      {/* Subtle geometric pattern overlay inspired by BNSP logo */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-accent/5 to-secondary/10 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-soft">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fda75669088f743d3b0d001a5b0efe69b%2F0b024383d832423f81e5d60abdb3f7b0?format=webp&width=800"
                alt="BNSP Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <span className="text-xs font-semibold opacity-90 block text-primary-foreground/90 leading-tight tracking-wide">
                BADAN NASIONAL SERTIFIKASI PROFESI
              </span>
              <span className="text-xs font-bold text-accent block mt-0.5 tracking-wider">
                E-PRESENSI ANGGOTA
              </span>
            </div>
          </div>
          {showTime && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-primary-foreground">
                {timeString}
              </span>
            </div>
          )}
        </div>

        <div className="border-l-4 border-accent pl-4">
          <h1 className="text-xl font-bold text-primary-foreground leading-tight">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
}
