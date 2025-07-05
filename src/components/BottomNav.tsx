import { Home, User, FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      icon: Home,
      label: "Beranda",
      path: "/",
      ariaLabel: "Navigasi ke halaman beranda",
    },
    {
      icon: FileText,
      label: "Rekap",
      path: "/attendance-history",
      ariaLabel: "Navigasi ke rekap presensi",
    },
    {
      icon: User,
      label: "Profil",
      path: "/profile",
      ariaLabel: "Navigasi ke halaman profil",
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t-2 border-border shadow-lg z-40"
      role="navigation"
      aria-label="Navigasi utama"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around py-3 px-2 pb-6 sm:pb-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center p-3 min-w-0 flex-1 rounded-xl transition-colors duration-150 relative ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`w-6 h-6 mb-1 ${isActive ? "text-primary" : ""}`}
              />
              <span
                className={`text-xs font-medium ${
                  isActive ? "font-bold text-primary" : ""
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
