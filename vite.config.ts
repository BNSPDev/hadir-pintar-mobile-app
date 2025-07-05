import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production optimizations - using default esbuild minifier
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for better caching
          vendor: ["react", "react-dom"],
          // UI components chunk
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          // Supabase chunk
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
    // Enable source maps in development
    sourcemap: mode === "development",
    // Optimize bundle size
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@supabase/supabase-js",
      "date-fns",
      "lucide-react",
    ],
  },
}));
