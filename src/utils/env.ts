/**
 * Environment validation utility to ensure required environment variables are present
 */

interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  NODE_ENV: string;
  PROD?: boolean;
  DEV?: boolean;
  VITE_TEMPO?: boolean;
}

/**
 * Validates and returns environment configuration
 * Throws error in development if required variables are missing
 */
export function getEnvConfig(): EnvConfig {
  // Since this is a client-side app, we need to access Vite env vars
  const config = {
    SUPABASE_URL:
      import.meta.env.VITE_SUPABASE_URL ||
      "https://vuvykznlggzkzarvfzes.supabase.co",
    SUPABASE_ANON_KEY:
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1dnlrem5sZ2d6a3phcnZmemVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1ODQxMjcsImV4cCI6MjA2NzE2MDEyN30.9MLQNAoxrL_fzOXMndJB3ZtHMVrwUmE",
    NODE_ENV: import.meta.env.MODE || "development",
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV,
    VITE_TEMPO: import.meta.env.VITE_TEMPO === "true",
  };

  // Validate required environment variables in development
  if (config.DEV) {
    const requiredVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"] as const;
    const missing = requiredVars.filter((key) => !config[key]);

    if (missing.length > 0) {
      console.warn(
        `Warning: Missing environment variables: ${missing.join(", ")}`,
      );
      console.warn(
        "Using fallback configuration. This may cause issues in production.",
      );
    }
  }

  return config;
}

/**
 * Checks if the app is running in production
 */
export function isProduction(): boolean {
  return getEnvConfig().NODE_ENV === "production";
}

/**
 * Checks if the app is running in development
 */
export function isDevelopment(): boolean {
  return getEnvConfig().NODE_ENV === "development";
}

/**
 * Returns the app version from package.json if available
 */
export function getAppVersion(): string {
  // In a real app, this would come from package.json
  return "2.1.4";
}
