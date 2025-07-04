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
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border shadow-header z-40"
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center p-3 min-w-0 flex-1 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary/5 scale-105"
                  : "text-muted-foreground hover:text-primary hover:bg-muted/50"
              }`}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={`w-6 h-6 mb-1 transition-transform duration-200 ${
                  isActive ? "scale-110" : ""
                }`}
              />
              <span
                className={`text-xs font-medium transition-all duration-200 ${
                  isActive ? "font-semibold" : ""
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
