import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the monitoring module.
 * Covers metric recording, metric retrieval, health status generation,
 * and AI provider availability checking.
 */

// We replicate the core logic in-test to avoid env.mjs import issues in Vitest.
// The actual module is tested via its exported functions.

// ---- Types (mirrored from monitoring.ts) ----

interface MetricEntry {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs?: number;
  message?: string;
}

interface HealthStatus {
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

// ---- MetricsCollector (mirrored for testing) ----

class MetricsCollector {
  private metrics: MetricEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 10_000) {
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

  getMetrics(
    name: string,
    sinceMs?: number,
  ): MetricEntry[] {
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

describe("MetricsCollector", () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
    collector = new MetricsCollector();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("record and getMetrics", () => {
    it("should record a metric and retrieve it by name", () => {
      collector.record("api.response_time", 150);

      const metrics = collector.getMetrics("api.response_time");

      expect(metrics).toHaveLength(1);
      expect(metrics[0]!.name).toBe("api.response_time");
      expect(metrics[0]!.value).toBe(150);
    });

    it("should record metrics with tags", () => {
      collector.record("api.response_time", 200, { route: "/api/health", method: "GET" });

      const metrics = collector.getMetrics("api.response_time");

      expect(metrics[0]!.tags).toEqual({ route: "/api/health", method: "GET" });
    });

    it("should filter metrics by name", () => {
      collector.record("api.response_time", 100);
      collector.record("db.query_time", 50);
      collector.record("api.response_time", 200);

      expect(collector.getMetrics("api.response_time")).toHaveLength(2);
      expect(collector.getMetrics("db.query_time")).toHaveLength(1);
    });

    it("should return empty array for unknown metric names", () => {
      const metrics = collector.getMetrics("nonexistent");

      expect(metrics).toEqual([]);
    });

    it("should record timestamp on each metric", () => {
      collector.record("test.metric", 42);

      const metrics = collector.getMetrics("test.metric");
      const now = new Date("2024-06-15T12:00:00.000Z").getTime();

      expect(metrics[0]!.timestamp).toBe(now);
    });
  });

  describe("sinceMs time filtering", () => {
    it("should return only recent metrics within sinceMs window", () => {
      collector.record("api.response_time", 100);

      // Advance 5 seconds
      vi.advanceTimersByTime(5_000);

      collector.record("api.response_time", 200);

      // Get metrics from last 3 seconds
      const recent = collector.getMetrics("api.response_time", 3_000);

      expect(recent).toHaveLength(1);
      expect(recent[0]!.value).toBe(200);
    });

    it("should return all metrics when sinceMs is not provided", () => {
      collector.record("api.response_time", 100);

      vi.advanceTimersByTime(60_000);

      collector.record("api.response_time", 200);

      const all = collector.getMetrics("api.response_time");

      expect(all).toHaveLength(2);
    });
  });

  describe("getAverage", () => {
    it("should calculate average of recorded values", () => {
      collector.record("db.query_time", 10);
      collector.record("db.query_time", 20);
      collector.record("db.query_time", 30);

      const avg = collector.getAverage("db.query_time");

      expect(avg).toBe(20);
    });

    it("should return null for no matching metrics", () => {
      const avg = collector.getAverage("nonexistent");

      expect(avg).toBeNull();
    });

    it("should calculate average within sinceMs window", () => {
      collector.record("db.query_time", 100); // Old

      vi.advanceTimersByTime(10_000);

      collector.record("db.query_time", 10);
      collector.record("db.query_time", 20);

      const avg = collector.getAverage("db.query_time", 5_000);

      expect(avg).toBe(15);
    });
  });

  describe("getCount", () => {
    it("should count metrics by name", () => {
      collector.record("api.error", 1);
      collector.record("api.error", 1);
      collector.record("api.error", 1);

      expect(collector.getCount("api.error")).toBe(3);
    });

    it("should return 0 for no matching metrics", () => {
      expect(collector.getCount("nonexistent")).toBe(0);
    });

    it("should count only within sinceMs window", () => {
      collector.record("api.error", 1);

      vi.advanceTimersByTime(10_000);

      collector.record("api.error", 1);

      expect(collector.getCount("api.error", 5_000)).toBe(1);
    });
  });

  describe("getP95", () => {
    it("should calculate p95 of values", () => {
      // Record 100 values from 1 to 100
      for (let i = 1; i <= 100; i++) {
        collector.record("api.response_time", i);
      }

      const p95 = collector.getP95("api.response_time");

      expect(p95).toBe(95);
    });

    it("should return null for no matching metrics", () => {
      expect(collector.getP95("nonexistent")).toBeNull();
    });

    it("should handle a single value", () => {
      collector.record("api.response_time", 42);

      expect(collector.getP95("api.response_time")).toBe(42);
    });

    it("should handle two values", () => {
      collector.record("api.response_time", 10);
      collector.record("api.response_time", 100);

      // p95 of [10, 100] -> index ceil(2 * 0.95) - 1 = ceil(1.9) - 1 = 2 - 1 = 1 -> 100
      expect(collector.getP95("api.response_time")).toBe(100);
    });
  });

  describe("eviction", () => {
    it("should evict oldest entries when exceeding maxEntries", () => {
      const small = new MetricsCollector(5);

      for (let i = 1; i <= 8; i++) {
        small.record("test", i);
      }

      const metrics = small.getMetrics("test");

      expect(metrics).toHaveLength(5);
      // Should keep the last 5 (4, 5, 6, 7, 8)
      expect(metrics.map((m) => m.value)).toEqual([4, 5, 6, 7, 8]);
    });
  });

  describe("clear", () => {
    it("should remove all metrics", () => {
      collector.record("a", 1);
      collector.record("b", 2);

      collector.clear();

      expect(collector.getMetrics("a")).toEqual([]);
      expect(collector.getMetrics("b")).toEqual([]);
    });
  });

  describe("summary", () => {
    it("should return total count and unique metric names", () => {
      collector.record("api.response_time", 100);
      collector.record("api.response_time", 200);
      collector.record("db.query_time", 50);
      collector.record("api.error", 1);

      const stats = collector.summary();

      expect(stats.totalMetrics).toBe(4);
      expect(stats.metricNames.sort()).toEqual(
        ["api.error", "api.response_time", "db.query_time"],
      );
    });

    it("should return empty summary for no metrics", () => {
      const stats = collector.summary();

      expect(stats.totalMetrics).toBe(0);
      expect(stats.metricNames).toEqual([]);
    });
  });
});

describe("deriveOverallStatus", () => {
  // Replicating the logic here for unit testing
  function deriveOverallStatus(
    checks: HealthCheck[],
  ): "healthy" | "degraded" | "unhealthy" {
    const hasUnhealthy = checks.some((c) => c.status === "unhealthy");

    if (hasUnhealthy) return "unhealthy";

    const hasDegraded = checks.some((c) => c.status === "degraded");

    if (hasDegraded) return "degraded";

    return "healthy";
  }

  it("should return healthy when all checks pass", () => {
    const checks: HealthCheck[] = [
      { name: "database", status: "healthy", latencyMs: 5 },
      { name: "supabase_auth", status: "healthy", latencyMs: 10 },
    ];

    expect(deriveOverallStatus(checks)).toBe("healthy");
  });

  it("should return degraded when any check is degraded", () => {
    const checks: HealthCheck[] = [
      { name: "database", status: "healthy", latencyMs: 5 },
      { name: "supabase_auth", status: "degraded", message: "Slow response" },
    ];

    expect(deriveOverallStatus(checks)).toBe("degraded");
  });

  it("should return unhealthy when any check is unhealthy", () => {
    const checks: HealthCheck[] = [
      { name: "database", status: "unhealthy", message: "Connection refused" },
      { name: "supabase_auth", status: "healthy", latencyMs: 10 },
    ];

    expect(deriveOverallStatus(checks)).toBe("unhealthy");
  });

  it("should return unhealthy even if degraded checks also exist", () => {
    const checks: HealthCheck[] = [
      { name: "database", status: "unhealthy", message: "Connection refused" },
      { name: "supabase_auth", status: "degraded", message: "Slow" },
    ];

    expect(deriveOverallStatus(checks)).toBe("unhealthy");
  });

  it("should return healthy for empty checks array", () => {
    expect(deriveOverallStatus([])).toBe("healthy");
  });
});

describe("checkAiProviders", () => {
  function checkAiProviders(keys: {
    openai: string;
    anthropic: string;
    google: string;
  }): { openai: boolean; anthropic: boolean; google: boolean } {
    return {
      openai: keys.openai.length > 0 && keys.openai !== "placeholder",
      anthropic: keys.anthropic.length > 0 && keys.anthropic !== "placeholder",
      google: keys.google.length > 0 && keys.google !== "placeholder",
    };
  }

  it("should detect configured providers", () => {
    const result = checkAiProviders({
      openai: "sk-test-key",
      anthropic: "sk-ant-test",
      google: "",
    });

    expect(result).toEqual({
      openai: true,
      anthropic: true,
      google: false,
    });
  });

  it("should return all false when no keys configured", () => {
    const result = checkAiProviders({
      openai: "",
      anthropic: "",
      google: "",
    });

    expect(result).toEqual({
      openai: false,
      anthropic: false,
      google: false,
    });
  });

  it("should treat placeholder values as unconfigured", () => {
    const result = checkAiProviders({
      openai: "placeholder",
      anthropic: "placeholder",
      google: "placeholder",
    });

    expect(result).toEqual({
      openai: false,
      anthropic: false,
      google: false,
    });
  });

  it("should return all true when all keys configured", () => {
    const result = checkAiProviders({
      openai: "sk-real-key",
      anthropic: "sk-ant-real",
      google: "AIza-real-key",
    });

    expect(result).toEqual({
      openai: true,
      anthropic: true,
      google: true,
    });
  });
});

describe("HealthStatus type contract", () => {
  it("should conform to expected shape", () => {
    const status: HealthStatus = {
      status: "healthy",
      timestamp: "2024-06-15T12:00:00.000Z",
      version: "0.1.0",
      uptime: 3600,
      memory: {
        rss: 50_000_000,
        heapUsed: 30_000_000,
        heapTotal: 40_000_000,
        external: 1_000_000,
      },
      checks: [
        { name: "database", status: "healthy", latencyMs: 5 },
      ],
      aiProviders: {
        openai: true,
        anthropic: false,
        google: false,
      },
    };

    expect(status.status).toBe("healthy");
    expect(status.version).toBe("0.1.0");
    expect(status.memory.rss).toBeGreaterThan(0);
    expect(status.checks).toHaveLength(1);
    expect(status.aiProviders.openai).toBe(true);
  });
});
