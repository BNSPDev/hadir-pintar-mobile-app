import { Navigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { 
  User,
  Info,
  FileText,
  Shield,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout Berhasil",
        description: "Sampai jumpa lagi!",
      });
    } catch (error) {
      toast({
        title: "Gagal Logout",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { icon: User, label: 'Profil', action: () => {} },
    { icon: Info, label: 'Tentang Aplikasi', action: () => {} },
    { icon: FileText, label: 'Ketentuan Layanan', action: () => {} },
    { icon: Shield, label: 'Kebijakan Privasi', action: () => {} },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <MobileHeader title="Akun" />
      
      <div className="p-4 space-y-6">
        {/* User Profile Card */}
        <Card className="shadow-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-bold text-xl text-foreground">
                  {profile?.full_name || 'Loading...'}
                </h2>
                <p className="text-sm font-medium text-primary mb-1">
                  {profile?.position || 'STAFF'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.department || 'Department'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">Info Lainnya</h3>
          
          <Card className="shadow-card border-0">
            <CardContent className="p-0">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors ${
                      index !== menuItems.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="flex-1 font-medium text-foreground">{item.label}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground font-semibold"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Keluar dari Akun
            </Button>
          </CardContent>
        </Card>

        {/* App Version */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">e-Presensi Kemnaker v2.1.4</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}