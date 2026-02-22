/**
 * Application health monitoring and metrics collection.
 *
 * Provides:
 * - In-memory metric recording (response times, error counts, query latencies)
 * - Comprehensive health status checks (DB, Supabase Auth, memory, AI providers)
 * - Typed interfaces for health responses
 *
 * No external dependencies - uses in-memory storage with automatic eviction.
 * Wire into external monitoring (Datadog, Grafana) by extending recordMetric.
 */

import { db } from "~/server/db";
import { getServiceSupabase } from "~/server/supabase/supabaseClient";
import { logger } from "~/server/logger";
import { env } from "~/env.mjs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricEntry {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

export interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs?: number;
  message?: string;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  checks: HealthCheck[];
  aiProviders: {
    openai: boolean;
    anthropic: boolean;
    google: boolean;
  };
}

// ---------------------------------------------------------------------------
// MetricsCollector
// ---------------------------------------------------------------------------

const MAX_METRIC_ENTRIES = 10_000;

class MetricsCollector {
  private metrics: MetricEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = MAX_METRIC_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });

    // Evict oldest entries when exceeding max
    if (this.metrics.length > this.maxEntries) {
      this.metrics = this.metrics.slice(-this.maxEntries);
    }
  }

  getMetrics(name: string, sinceMs?: number): MetricEntry[] {
    const cutoff = sinceMs ? Date.now() - sinceMs : 0;

    return this.metrics.filter(
      (m) => m.name === name && m.timestamp >= cutoff,
    );
  }

  getAverage(name: string, sinceMs?: number): number | null {
    const entries = this.getMetrics(name, sinceMs);

    if (entries.length === 0) return null;

    const sum = entries.reduce((acc, e) => acc + e.value, 0);

    return sum / entries.length;
  }

  getCount(name: string, sinceMs?: number): number {
    return this.getMetrics(name, sinceMs).length;
  }

  getP95(name: string, sinceMs?: number): number | null {
    const entries = this.getMetrics(name, sinceMs);

    if (entries.length === 0) return null;

    const sorted = entries.map((e) => e.value).sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;

    return sorted[Math.max(0, index)]!;
  }

  clear(): void {
    this.metrics = [];
  }

  summary(): { totalMetrics: number; metricNames: string[] } {
    const names = new Set(this.metrics.map((m) => m.name));

    return {
      totalMetrics: this.metrics.length,
      metricNames: Array.from(names),
    };
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// ---------------------------------------------------------------------------
// Convenience: recordMetric
// ---------------------------------------------------------------------------

/**
 * Record a named metric with an optional tag set.
 * Use for API response times, DB query durations, error counts, etc.
 *
 * @example
 *   recordMetric("api.response_time", 142, { route: "/menu", method: "GET" });
 *   recordMetric("db.query_time", 8, { query: "findMenu" });
 *   recordMetric("api.error", 1, { route: "/menu", code: "404" });
 */
export function recordMetric(
  name: string,
  value: number,
  tags?: Record<string, string>,
): void {
  metrics.record(name, value, tags);
}

// ---------------------------------------------------------------------------
// AI Provider availability
// ---------------------------------------------------------------------------

export function checkAiProviders(): {
  openai: boolean;
  anthropic: boolean;
  google: boolean;
} {
  return {
    openai:
      env.OPENAI_API_KEY.length > 0 &&
      env.OPENAI_API_KEY !== "placeholder",
    anthropic:
      env.ANTHROPIC_API_KEY.length > 0 &&
      env.ANTHROPIC_API_KEY !== "placeholder",
    google:
      env.GOOGLE_AI_API_KEY.length > 0 &&
      env.GOOGLE_AI_API_KEY !== "placeholder",
  };
}

// ---------------------------------------------------------------------------
// Individual health checks
// ---------------------------------------------------------------------------

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;

    const latencyMs = Date.now() - start;

    recordMetric("health.db_latency", latencyMs);

    // Consider degraded if DB response takes >500ms
    if (latencyMs > 500) {
      return {
        name: "database",
        status: "degraded",
        latencyMs,
        message: `High latency: ${latencyMs}ms`,
      };
    }

    return { name: "database", status: "healthy", latencyMs };
  } catch (error) {
    logger.error("Health check: database unreachable", error, "monitoring");

    return {
      name: "database",
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function checkSupabaseAuth(): Promise<HealthCheck> {
  const start = Date.now();

  try {
    const supabase = getServiceSupabase();

    // Light-weight call: list users with limit 0 just to verify connectivity
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    const latencyMs = Date.now() - start;

    recordMetric("health.supabase_auth_latency", latencyMs);

    if (error) {
      return {
        name: "supabase_auth",
        status: "degraded",
        latencyMs,
        message: error.message,
      };
    }

    if (latencyMs > 1_000) {
      return {
        name: "supabase_auth",
        status: "degraded",
        latencyMs,
        message: `High latency: ${latencyMs}ms`,
      };
    }

    return { name: "supabase_auth", status: "healthy", latencyMs };
  } catch (error) {
    logger.error(
      "Health check: Supabase Auth unreachable",
      error,
      "monitoring",
    );

    return {
      name: "supabase_auth",
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Overall status derivation
// ---------------------------------------------------------------------------

function deriveOverallStatus(
  checks: HealthCheck[],
): "healthy" | "degraded" | "unhealthy" {
  const hasUnhealthy = checks.some((c) => c.status === "unhealthy");

  if (hasUnhealthy) return "unhealthy";

  const hasDegraded = checks.some((c) => c.status === "degraded");

  if (hasDegraded) return "degraded";

  return "healthy";
}

// ---------------------------------------------------------------------------
// getHealthStatus - Comprehensive health check
// ---------------------------------------------------------------------------

const APP_VERSION = "0.1.0";

/**
 * Run all health checks and return a comprehensive status report.
 * Used by the /api/health endpoint.
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const [dbCheck, authCheck] = await Promise.all([
    checkDatabase(),
    checkSupabaseAuth(),
  ]);

  const checks = [dbCheck, authCheck];
  const mem = process.memoryUsage();

  return {
    status: deriveOverallStatus(checks),
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    uptime: process.uptime(),
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    },
    checks,
    aiProviders: checkAiProviders(),
  };
}

// ---------------------------------------------------------------------------
// Metric name constants for consistent usage
// ---------------------------------------------------------------------------

export const METRIC = {
  API_RESPONSE_TIME: "api.response_time",
  API_ERROR: "api.error",
  DB_QUERY_TIME: "db.query_time",
  HEALTH_DB_LATENCY: "health.db_latency",
  HEALTH_AUTH_LATENCY: "health.supabase_auth_latency",
} as const;
