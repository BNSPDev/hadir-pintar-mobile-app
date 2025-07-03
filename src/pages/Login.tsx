import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileHeader } from '@/components/MobileHeader';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          description: error.message === 'Invalid login credentials' 
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
        <Card className="w-full max-w-md mx-auto shadow-card border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-foreground">
              Hadir Pintar
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Masukkan kredensial untuk melanjutkan
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  required
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="h-12"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sedang Masuk...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Demo: gunakan email dan password apapun untuk login
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}