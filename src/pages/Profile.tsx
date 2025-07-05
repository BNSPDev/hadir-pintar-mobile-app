import { Navigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileHeader } from "@/components/MobileHeader";
import { BottomNav } from "@/components/BottomNav";
import { EditProfileModal } from "@/components/EditProfileModal";
import { AboutModal } from "@/components/AboutModal";
import { TermsModal } from "@/components/TermsModal";
import { PrivacyModal } from "@/components/PrivacyModal";
import { AdminModal } from "@/components/AdminModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  User,
  Info,
  FileText,
  Shield,
  LogOut,
  ChevronRight,
  Edit,
  Settings,
} from "lucide-react";

export default function Profile() {
  // All hooks must be called at the top level, before any return/conditional
  const { user, signOut, loading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    fetchProfile,
  } = useProfile();
  const {
    userRole,
    loading: roleLoading,
    error: roleError,
    isAdmin,
    updateRole,
    fetchUserRole,
  } = useUserRole();
  const { toast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // All hooks are above this line. Now safe to use returns/conditionals.

  // Tampilkan loading spinner jika masih loading
  if (authLoading) {
    return <LoadingSpinner fullScreen message="Memeriksa autentikasi..." />;
  }

  // Redirect ke halaman login jika tidak ada user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Tampilkan loading spinner saat memuat data profil/role
  if (profileLoading || roleLoading) {
    return <LoadingSpinner fullScreen message="Memuat data profil..." />;
  }

  // Tampilkan pesan error jika ada masalah
  if (profileError || roleError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <h2 className="font-bold text-xl text-destructive mb-4">
            Gagal Memuat Data
          </h2>
          {profileError && (
            <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md">
              <p className="font-medium">Gagal memuat profil:</p>
              <p className="text-sm">{profileError}</p>
            </div>
          )}
          {roleError && (
            <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-md">
              <p className="font-medium">Gagal memuat peran pengguna:</p>
              <p className="text-sm">{roleError}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            {profileError && (
              <Button
                onClick={fetchProfile}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Muat Ulang Profil
              </Button>
            )}
            {roleError && (
              <Button
                onClick={fetchUserRole}
                variant="default"
                className="w-full sm:w-auto"
              >
                Muat Ulang Peran
              </Button>
            )}
          </div>
        </div>
      </div>
    );
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
    { icon: User, label: "Edit Profil", action: () => setShowEditModal(true) },
    ...(isAdmin()
      ? [
          {
            icon: Settings,
            label: "Panel Admin",
            action: () => setShowAdminModal(true),
          },
        ]
      : []),
    {
      icon: Info,
      label: "Tentang Aplikasi",
      action: () => setShowAboutModal(true),
    },
    {
      icon: FileText,
      label: "Ketentuan Layanan",
      action: () => setShowTermsModal(true),
    },
    {
      icon: Shield,
      label: "Kebijakan Privasi",
      action: () => setShowPrivacyModal(true),
    },
  ];

  return (
    <div className="min-h-screen pb-32 sm:pb-24 bg-background">
      <MobileHeader title="Akun" />
      <div className="p-4 space-y-6 mt-2">
        {/* User Profile Card */}
        <Card className="shadow-card border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-20 h-20 ring-2 ring-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {profile?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="font-bold text-xl text-foreground">
                  {profile?.full_name || "Loading..."}
                </h2>
                <p className="text-sm font-medium text-primary mb-1">
                  {profile?.position || "STAFF"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.department || "Department"}
                </p>
                {isAdmin() && (
                  <div className="mt-2">
                    <span className="px-3 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium">
                      Administrator
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground px-1">
            Info Lainnya
          </h3>

          <Card className="shadow-card border border-border bg-card">
            <CardContent className="p-0">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-all duration-200 ${
                      index !== menuItems.length - 1
                        ? "border-b border-border/50"
                        : ""
                    }`}
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="flex-1 font-medium text-foreground">
                      {item.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Card className="shadow-card border border-border bg-card">
          <CardContent className="p-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground font-semibold transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Keluar dari Akun
            </Button>
          </CardContent>
        </Card>

        {/* App Version */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            E-Presensi Anggota BNSP v2.1.4
          </p>
        </div>
      </div>
      {/* Modals */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onProfileUpdate={fetchProfile}
      />
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
      <BottomNav />
    </div>
  );
}
