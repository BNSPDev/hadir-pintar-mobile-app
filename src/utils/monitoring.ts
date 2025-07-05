/**
 * Application monitoring and health check utilities
 */

import { supabase } from "@/integrations/supabase/client";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: boolean;
    auth: boolean;
    storage: boolean;
  };
  performance: {
    responseTime: number;
    memoryUsage?: number;
  };
}

/**
 * Performs comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheck> {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();

  const services = {
    database: false,
    auth: false,
    storage: false,
  };

  try {
    // Test database connection
    const { error: dbError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);
    services.database = !dbError;

    // Test auth service
    const { data: authData } = await supabase.auth.getSession();
    services.auth = true; // If no error, auth is working

    // Test storage (local storage)
    try {
      localStorage.setItem("health-check", "test");
      localStorage.removeItem("health-check");
      services.storage = true;
    } catch {
      services.storage = false;
    }
  } catch (error) {
    console.error("Health check failed:", error);
  }

  const responseTime = performance.now() - startTime;
  const healthyServices = Object.values(services).filter(Boolean).length;
  const totalServices = Object.keys(services).length;

  let status: HealthCheck["status"] = "healthy";
  if (healthyServices === 0) {
    status = "unhealthy";
  } else if (healthyServices < totalServices) {
    status = "degraded";
  }

  return {
    status,
    timestamp,
    services,
    performance: {
      responseTime,
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
    },
  };
}

/**
 * Logs performance metrics
 */
export function logPerformance(
  metric: string,
  value: number,
  unit: string = "ms",
) {
  if (import.meta.env.DEV) {
    console.log(`Performance [${metric}]: ${value}${unit}`);
  }
}

/**
 * Error reporting utility
 */
export function reportError(error: Error, context?: Record<string, any>) {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context,
  };

  // In development, log to console
  if (import.meta.env.DEV) {
    console.error("Error Report:", errorReport);
  }

  // In production, you would send this to an error tracking service
  // Example: Sentry, LogRocket, etc.
  if (import.meta.env.PROD) {
    // Example: window.Sentry?.captureException(error, { extra: errorReport });
  }
}

/**
 * Network connectivity check
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const response = await fetch("/manifest.json", {
      method: "HEAD",
      cache: "no-cache",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Application metadata for debugging
 */
export function getAppMetadata() {
  return {
    version: "2.1.4",
    buildTime: import.meta.env.VITE_BUILD_TIME || "unknown",
    environment: import.meta.env.MODE,
    features: {
      tempo: import.meta.env.VITE_TEMPO === "true",
    },
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    },
    screen: {
      width: screen.width,
      height: screen.height,
      colorDepth: screen.colorDepth,
    },
  };
}
