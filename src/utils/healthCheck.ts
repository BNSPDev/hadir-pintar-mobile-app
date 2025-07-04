import { supabase } from "@/integrations/supabase/client";
import { getEnvConfig } from "./env";

export interface HealthCheckResult {
  status: "healthy" | "warning" | "error";
  message: string;
  details?: Record<string, any>;
}

export interface SystemHealth {
  overall: "healthy" | "warning" | "error";
  checks: {
    database: HealthCheckResult;
    authentication: HealthCheckResult;
    environment: HealthCheckResult;
    network: HealthCheckResult;
  };
  timestamp: string;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return {
      status: "healthy",
      message: "Database connection successful",
      details: { connected: true },
    };
  } catch (error: any) {
    return {
      status: "error",
      message: "Database connection failed",
      details: { error: error.message },
    };
  }
}

/**
 * Check authentication system
 */
async function checkAuthentication(): Promise<HealthCheckResult> {
  try {
    const { data, error } = await supabase.auth.getSession();

    return {
      status: "healthy",
      message: "Authentication system operational",
      details: {
        sessionActive: !!data.session,
        userAuthenticated: !!data.session?.user,
      },
    };
  } catch (error: any) {
    return {
      status: "error",
      message: "Authentication system error",
      details: { error: error.message },
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment(): HealthCheckResult {
  try {
    const config = getEnvConfig();
    const warnings = [];

    if (!config.SUPABASE_URL.startsWith("https://")) {
      warnings.push("Supabase URL should use HTTPS");
    }

    if (config.DEV && !config.SUPABASE_ANON_KEY) {
      warnings.push("Supabase anonymous key is missing");
    }

    return {
      status: warnings.length > 0 ? "warning" : "healthy",
      message:
        warnings.length > 0
          ? `Environment has ${warnings.length} warning(s)`
          : "Environment configuration is valid",
      details: {
        nodeEnv: config.NODE_ENV,
        hasSupabaseUrl: !!config.SUPABASE_URL,
        hasSupabaseKey: !!config.SUPABASE_ANON_KEY,
        warnings,
      },
    };
  } catch (error: any) {
    return {
      status: "error",
      message: "Environment configuration error",
      details: { error: error.message },
    };
  }
}

/**
 * Check network connectivity
 */
async function checkNetwork(): Promise<HealthCheckResult> {
  try {
    const startTime = performance.now();

    // Test basic network connectivity
    const response = await fetch("https://www.google.com/favicon.ico", {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-cache",
    });

    const endTime = performance.now();
    const latency = endTime - startTime;

    return {
      status: latency > 5000 ? "warning" : "healthy",
      message:
        latency > 5000
          ? "Network latency is high"
          : "Network connection is good",
      details: {
        latency: Math.round(latency),
        online: navigator.onLine,
      },
    };
  } catch (error: any) {
    return {
      status: "error",
      message: "Network connectivity issues detected",
      details: {
        error: error.message,
        online: navigator.onLine,
      },
    };
  }
}

/**
 * Run comprehensive health check
 */
export async function runHealthCheck(): Promise<SystemHealth> {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkAuthentication(),
    checkNetwork(),
  ]);

  const healthResults = {
    database:
      checks[0].status === "fulfilled"
        ? checks[0].value
        : { status: "error" as const, message: "Health check failed" },
    authentication:
      checks[1].status === "fulfilled"
        ? checks[1].value
        : { status: "error" as const, message: "Health check failed" },
    environment: checkEnvironment(),
    network:
      checks[2].status === "fulfilled"
        ? checks[2].value
        : { status: "error" as const, message: "Health check failed" },
  };

  // Determine overall health
  const statuses = Object.values(healthResults).map((check) => check.status);
  const overall = statuses.includes("error")
    ? "error"
    : statuses.includes("warning")
      ? "warning"
      : "healthy";

  return {
    overall,
    checks: healthResults,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Monitor system health periodically
 */
export function startHealthMonitoring(intervalMs: number = 300000) {
  // 5 minutes
  if (typeof window === "undefined") return;

  const monitor = async () => {
    try {
      const health = await runHealthCheck();

      if (health.overall === "error") {
        console.error("System health check failed:", health);
      } else if (health.overall === "warning") {
        console.warn("System health has warnings:", health);
      }

      // Store health status in localStorage for debugging
      localStorage.setItem("lastHealthCheck", JSON.stringify(health));
    } catch (error) {
      console.error("Health monitoring failed:", error);
    }
  };

  // Run initial check
  monitor();

  // Set up periodic monitoring
  const intervalId = setInterval(monitor, intervalMs);

  // Cleanup function
  return () => clearInterval(intervalId);
}
