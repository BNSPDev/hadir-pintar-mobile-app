import { Clock } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  showTime?: boolean;
}

export function MobileHeader({ title, showTime = true }: MobileHeaderProps) {
  const now = new Date();
  const timeString = now.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="bg-primary text-primary-foreground p-4 rounded-b-3xl shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="text-xs font-medium opacity-90">
            KEMENTERIAN KETENAGAKERJAAN<br />
            REPUBLIK INDONESIA
          </span>
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