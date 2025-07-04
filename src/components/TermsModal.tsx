import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md h-[80vh] bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg text-card-foreground">
            Ketentuan Layanan
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
                  1. Penggunaan Aplikasi
                </h3>
                <p className="text-muted-foreground">
                  Aplikasi E-Presensi Anggota BNSP digunakan khusus untuk
                  pencatatan kehadiran anggota BNSP. Pengguna wajib menggunakan
                  aplikasi sesuai dengan ketentuan yang berlaku.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  2. Akun Pengguna
                </h3>
                <p className="text-muted-foreground">
                  Setiap pengguna bertanggung jawab atas keamanan akun dan kata
                  sandi mereka. Dilarang berbagi informasi akun dengan pihak
                  lain.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  3. Data dan Privasi
                </h3>
                <p className="text-muted-foreground">
                  Data presensi dan informasi pribadi pengguna akan dijaga
                  kerahasiaannya sesuai dengan kebijakan privasi BNSP.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  4. Kewajiban Pengguna
                </h3>
                <ul className="text-muted-foreground list-disc list-inside space-y-1">
                  <li>Melakukan absensi sesuai jadwal kerja</li>
                  <li>Mengisi laporan kegiatan harian dengan benar</li>
                  <li>Menjaga keakuratan data profil</li>
                  <li>Tidak menyalahgunakan sistem</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  5. Sanksi
                </h3>
                <p className="text-muted-foreground">
                  Pelanggaran terhadap ketentuan ini dapat mengakibatkan
                  pembekuan akses atau sanksi sesuai peraturan yang berlaku di
                  BNSP.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-card-foreground mb-2">
                  6. Perubahan Ketentuan
                </h3>
                <p className="text-muted-foreground">
                  BNSP berhak mengubah ketentuan layanan ini sewaktu-waktu.
                  Pengguna akan diberitahu mengenai perubahan yang signifikan.
                </p>
              </section>
            </div>
          </ScrollArea>

          <div className="mt-4">
            <Button
              onClick={onClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Saya Mengerti
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
