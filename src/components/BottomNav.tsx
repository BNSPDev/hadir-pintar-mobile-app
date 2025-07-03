import { Home, User, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Beranda', path: '/' },
    { icon: FileText, label: 'Rekap', path: '/attendance-history' },
    { icon: User, label: 'User', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center p-2 min-w-0 flex-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}