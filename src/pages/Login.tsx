import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  // Get the intended destination from location state
  const from = (location.state as any)?.from?.pathname || "/";

  if (user) {
    return <Navigate to={from} replace />;
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
        // Navigation will be handled by the Navigate component when user state changes
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

      <div className="p-4 pt-8 pb-8">
        <Card className="w-full max-w-md mx-auto shadow-lg border-border bg-card">
          <CardHeader className="text-center pb-6 px-6 pt-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="relative bg-primary/5 rounded-2xl p-4 shadow-sm border border-primary/10">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fda75669088f743d3b0d001a5b0efe69b%2F0b024383d832423f81e5d60abdb3f7b0?format=webp&width=800"
                    alt="BNSP Logo"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-card-foreground mb-3">
              E-Presensi Anggota BNSP
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">
              Masukkan kredensial untuk melanjutkan
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-8">
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
                  className="h-12 bg-background border-2 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="h-12 bg-background border-2 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md mt-8"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
