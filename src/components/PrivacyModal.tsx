import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md h-[80vh] bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg text-card-foreground">
            Kebijakan Privasi
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

        <CardContent className="flex-1">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  1. Informasi yang Dikumpulkan
                </h3>
                <p className="text-muted-foreground mb-2">
                  Kami mengumpulkan informasi berikut:
                </p>
                <ul className="text-muted-foreground list-disc list-inside space-y-1">
                  <li>Data pribadi (nama, jabatan, unit kerja)</li>
                  <li>Data presensi (waktu masuk, pulang)</li>
                  <li>Laporan kegiatan harian</li>
                  <li>Informasi perangkat dan lokasi</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  2. Penggunaan Informasi
                </h3>
                <p className="text-muted-foreground mb-2">
                  Informasi yang dikumpulkan digunakan untuk:
                </p>
                <ul className="text-muted-foreground list-disc list-inside space-y-1">
                  <li>Pencatatan kehadiran karyawan</li>
                  <li>Pembuatan laporan presensi</li>
                  <li>Evaluasi kinerja</li>
                  <li>Perbaikan layanan aplikasi</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  3. Perlindungan Data
                </h3>
                <p className="text-muted-foreground">
                  BNSP berkomitmen melindungi data pribadi pengguna dengan
                  menerapkan langkah-langkah keamanan yang sesuai standar
                  industri.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  4. Berbagi Informasi
                </h3>
                <p className="text-muted-foreground">
                  Data pribadi tidak akan dibagikan kepada pihak ketiga tanpa
                  persetujuan, kecuali untuk keperluan hukum atau peraturan yang
                  berlaku.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  5. Hak Pengguna
                </h3>
                <p className="text-muted-foreground mb-2">
                  Pengguna memiliki hak untuk:
                </p>
                <ul className="text-muted-foreground list-disc list-inside space-y-1">
                  <li>Mengakses data pribadi mereka</li>
                  <li>Memperbarui informasi yang tidak akurat</li>
                  <li>Meminta penghapusan data (sesuai ketentuan)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  6. Kontak
                </h3>
                <p className="text-muted-foreground">
                  Untuk pertanyaan mengenai kebijakan privasi ini, hubungi tim
                  IT BNSP melalui email resmi atau sistem internal.
                </p>
              </section>
            </div>
          </ScrollArea>

          <div className="mt-4">
            <Button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Tutup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
