import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg text-card-foreground">
            Tentang Aplikasi
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

        <CardContent className="space-y-4">
          <div className="text-center">
            <img
              src="/logo-bnsp.png"
              alt="BNSP Logo"
              className="w-16 h-16 object-contain mx-auto mb-4 bg-white rounded-lg p-2"
            />
            <h3 className="font-bold text-lg text-card-foreground mb-2">
              E-Presensi Anggota BNSP
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Aplikasi absensi digital untuk anggota Badan Nasional Sertifikasi
              Profesi
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-card-foreground">
                Versi Aplikasi:
              </p>
              <p className="text-muted-foreground">v2.1.4</p>
            </div>
            <div>
              <p className="font-medium text-card-foreground">
                Dikembangkan oleh:
              </p>
              <p className="text-muted-foreground">
                Badan Nasional Sertifikasi Profesi
              </p>
            </div>
            <div>
              <p className="font-medium text-card-foreground">Fitur Utama:</p>
              <ul className="text-muted-foreground list-disc list-inside space-y-1">
                <li>Absensi masuk dan pulang</li>
                <li>Laporan kegiatan harian</li>
                <li>Riwayat presensi</li>
                <li>Manajemen profil</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Tutup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
