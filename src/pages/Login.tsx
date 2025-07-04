import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileHeader } from "@/components/MobileHeader";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Login Gagal",
          description:
            error.message === "Invalid login credentials"
              ? "Email atau password salah"
              : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Berhasil",
          description: "Selamat datang kembali!",
        });
      }
    } catch (error) {
      toast({
        title: "Terjadi Kesalahan",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Masuk ke Akun" showTime={false} />

      <div className="p-4 pt-8">
        <Card className="w-full max-w-md mx-auto shadow-card border-border bg-gradient-card backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-secondary rounded-2xl blur-sm opacity-20"></div>
                <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-soft">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fda75669088f743d3b0d001a5b0efe69b%2F0b024383d832423f81e5d60abdb3f7b0?format=webp&width=800"
                    alt="BNSP Logo"
                    className="w-12 h-12 object-contain"
                  />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-card-foreground mb-2">
              E-Presensi Anggota BNSP
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">
              Masukkan kredensial untuk melanjutkan
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="email"
                  className="text-card-foreground font-semibold text-sm"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  required
                  className="h-12 bg-input border-border text-foreground placeholder:text-muted-foreground transition-all duration-200 hover:border-secondary/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-card-foreground font-semibold text-sm"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="h-12 bg-input border-border text-foreground placeholder:text-muted-foreground transition-all duration-200 hover:border-secondary/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-semibold bg-gradient-primary hover:scale-[1.02] text-primary-foreground transition-all duration-200 border border-primary/20"
                style={{ textShadow: "1px 1px 3px rgba(0, 0, 0, 1)" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sedang Masuk...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
