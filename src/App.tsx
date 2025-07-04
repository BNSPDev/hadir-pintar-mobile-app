import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useRoutes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AttendanceHistory from "./pages/AttendanceHistory";
import NotFound from "./pages/NotFound";
import routes from "tempo-routes";

const queryClient = new QueryClient();

function AppRoutes() {
  // Create combined routes array
  const appRoutes = [
    { path: "/", element: <Dashboard /> },
    { path: "/login", element: <Login /> },
    { path: "/profile", element: <Profile /> },
    { path: "/attendance-history", element: <AttendanceHistory /> },
    ...(import.meta.env.VITE_TEMPO
      ? [{ path: "/tempobook/*", element: null }]
      : []),
    { path: "*", element: <NotFound /> },
  ];

  // Combine tempo routes with app routes if VITE_TEMPO is enabled
  const allRoutes = import.meta.env.VITE_TEMPO
    ? [...routes, ...appRoutes]
    : appRoutes;

  return useRoutes(allRoutes);
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
