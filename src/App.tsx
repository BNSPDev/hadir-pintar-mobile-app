import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useRoutes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { NetworkStatus } from "@/components/NetworkStatus";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AttendanceHistory from "./pages/AttendanceHistory";
import NotFound from "./pages/NotFound";
import routes from "./tempo-routes";

// Configure React Query with better defaults for production
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const AppRoutes: React.FC = () => {
  // Create combined routes array with protected routes
  const appRoutes = React.useMemo(
    () => [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      { path: "/login", element: <Login /> },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "/attendance-history",
        element: (
          <ProtectedRoute>
            <AttendanceHistory />
          </ProtectedRoute>
        ),
      },
      ...(import.meta.env.VITE_TEMPO
        ? [{ path: "/tempobook/*", element: null }]
        : []),
      { path: "*", element: <NotFound /> },
    ],
    [],
  );

  // Combine tempo routes with app routes if VITE_TEMPO is enabled
  const allRoutes = React.useMemo(
    () => (import.meta.env.VITE_TEMPO ? [...routes, ...appRoutes] : appRoutes),
    [appRoutes],
  );

  return useRoutes(allRoutes);
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NetworkStatus />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
