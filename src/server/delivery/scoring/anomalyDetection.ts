/**
 * Atlas Score — Anomaly Detection Module
 *
 * Z-score analysis, moving averages, peer comparison, trend analysis,
 * and auto-suspend logic for detecting driver behavior anomalies.
 *
 * ZERO external dependencies. Pure functions only.
 */

import { logger } from "~/server/logger";
import type { DriverMetrics, DriverTier } from "./driverScoring";
import { calculateDriverScore, determineDriverTier } from "./driverScoring";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface Anomaly {
  metricName: string;
  value: number;
  zScore: number;
  severity: AlertSeverity;
  message: string;
  timestamp: number;
}

export interface ZoneAverages {
  zoneId: string;
  averageRating: number;
  averageCompletionRate: number;
  averageOnTimeRate: number;
  averageAcceptanceRate: number;
  averageCancellationRate: number;
  driverCount: number;
}

export interface PeerComparisonResult {
  driverId: string;
  zoneId: string;
  metrics: Record<
    string,
    { driverValue: number; zoneAverage: number; percentile: number }
  >;
  overallPercentile: number;
  isOutlier: boolean;
}

export interface AggregatedAnomalies {
  driverId: string;
  anomalies: Anomaly[];
  riskLevel: AlertSeverity;
  shouldAutoSuspend: boolean;
  suspendReason: string | null;
}

export interface MovingAverageResult {
  values: number[];
  average: number;
  standardDeviation: number;
  latest: number;
  trend: "rising" | "falling" | "stable";
}

export interface TrendAnalysisResult {
  slope: number;
  intercept: number;
  rSquared: number;
  direction: "improving" | "declining" | "stable";
  confidence: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const Z_SCORE_THRESHOLDS = {
  low: 1.5,
  medium: 2.0,
  high: 2.5,
  critical: 3.0,
} as const;

const AUTO_SUSPEND_RULES = {
  maxCriticalAnomalies: 2,
  maxHighAnomalies: 5,
  maxTotalAnomalies: 10,
  minDeliveriesForSuspend: 10,
} as const;

// ---------------------------------------------------------------------------
// Z-Score Analysis
// ---------------------------------------------------------------------------

/**
 * Calculate the z-score for a value given mean and standard deviation.
 */
export function calculateZScore(
  value: number,
  mean: number,
  stdDev: number,
): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Determine severity based on absolute z-score.
 */
export function getSeverityFromZScore(zScore: number): AlertSeverity {
  const absZ = Math.abs(zScore);
  if (absZ >= Z_SCORE_THRESHOLDS.critical) return "critical";
  if (absZ >= Z_SCORE_THRESHOLDS.high) return "high";
  if (absZ >= Z_SCORE_THRESHOLDS.medium) return "medium";
  if (absZ >= Z_SCORE_THRESHOLDS.low) return "low";
  return "low";
}

/**
 * Detect anomalies in a series of metric values.
 */
export function detectAnomalies(
  values: number[],
  metricName: string,
  referenceTime?: number,
): Anomaly[] {
  if (values.length < 3) return [];

  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: Anomaly[] = [];
  const now = referenceTime ?? Date.now();

  for (const value of values) {
    const zScore = calculateZScore(value, mean, stdDev);
    if (Math.abs(zScore) >= Z_SCORE_THRESHOLDS.low) {
      anomalies.push({
        metricName,
        value,
        zScore: Math.round(zScore * 100) / 100,
        severity: getSeverityFromZScore(zScore),
        message: `${metricName}: value ${value.toFixed(2)} is ${Math.abs(zScore).toFixed(2)} standard deviations from mean ${mean.toFixed(2)}`,
        timestamp: now,
      });
    }
  }

  return anomalies;
}

// ---------------------------------------------------------------------------
// Moving Average
// ---------------------------------------------------------------------------

/**
 * Calculate a simple moving average over a window.
 */
export function calculateMovingAverage(
  values: number[],
  windowSize: number,
): MovingAverageResult {
  if (values.length === 0) {
    return {
      values: [],
      average: 0,
      standardDeviation: 0,
      latest: 0,
      trend: "stable",
    };
  }

  const effectiveWindow = Math.min(windowSize, values.length);
  const maValues: number[] = [];

  for (let i = effectiveWindow - 1; i < values.length; i++) {
    const window = values.slice(i - effectiveWindow + 1, i + 1);
    const avg = window.reduce((s, v) => s + v, 0) / window.length;
    maValues.push(Math.round(avg * 100) / 100);
  }

  const average =
    maValues.length > 0
      ? maValues.reduce((s, v) => s + v, 0) / maValues.length
      : 0;

  const variance =
    maValues.length > 0
      ? maValues.reduce((s, v) => s + (v - average) ** 2, 0) / maValues.length
      : 0;

  const latest = maValues.length > 0 ? maValues[maValues.length - 1]! : 0;

  // Determine trend from last 3 MA values
  let trend: MovingAverageResult["trend"] = "stable";
  if (maValues.length >= 3) {
    const last3 = maValues.slice(-3);
    const increasing = last3[2]! > last3[0]!;
    const decreasing = last3[2]! < last3[0]!;
    const diff = Math.abs(last3[2]! - last3[0]!);
    if (diff > average * 0.05) {
      trend = increasing ? "rising" : decreasing ? "falling" : "stable";
    }
  }

  return {
    values: maValues,
    average: Math.round(average * 100) / 100,
    standardDeviation: Math.round(Math.sqrt(variance) * 100) / 100,
    latest,
    trend,
  };
}

// ---------------------------------------------------------------------------
// Peer Comparison
// ---------------------------------------------------------------------------

/**
 * Compare a driver's metrics to zone averages and determine percentile.
 */
export function compareToPeers(
  metrics: DriverMetrics,
  zoneAverages: ZoneAverages,
): PeerComparisonResult {
  const completionRate =
    metrics.totalDeliveries > 0
      ? (metrics.completedDeliveries / metrics.totalDeliveries) * 100
      : 0;

  const onTimeRate =
    metrics.completedDeliveries > 0
      ? (metrics.onTimeDeliveries / metrics.completedDeliveries) * 100
      : 0;

  const acceptanceRate =
    metrics.offeredOrders > 0
      ? (metrics.acceptedOrders / metrics.offeredOrders) * 100
      : 0;

  const cancellationRate =
    metrics.totalDeliveries > 0
      ? (metrics.cancelledOrders / metrics.totalDeliveries) * 100
      : 0;

  // Simple percentile estimation: driver value / zone average * 50
  // (50 = average, 100 = 2x average, 0 = 0)
  const calcPercentile = (driverVal: number, zoneAvg: number) => {
    if (zoneAvg === 0) return 50;
    return Math.min(100, Math.max(0, (driverVal / zoneAvg) * 50));
  };

  // For cancellation, lower is better so invert
  const calcInversePercentile = (driverVal: number, zoneAvg: number) => {
    if (zoneAvg === 0) return driverVal === 0 ? 100 : 0;
    return Math.min(100, Math.max(0, 100 - (driverVal / zoneAvg) * 50));
  };

  const metricsMap: Record<
    string,
    { driverValue: number; zoneAverage: number; percentile: number }
  > = {
    rating: {
      driverValue: metrics.averageRating,
      zoneAverage: zoneAverages.averageRating,
      percentile: calcPercentile(metrics.averageRating, zoneAverages.averageRating),
    },
    completionRate: {
      driverValue: completionRate,
      zoneAverage: zoneAverages.averageCompletionRate,
      percentile: calcPercentile(completionRate, zoneAverages.averageCompletionRate),
    },
    onTimeRate: {
      driverValue: onTimeRate,
      zoneAverage: zoneAverages.averageOnTimeRate,
      percentile: calcPercentile(onTimeRate, zoneAverages.averageOnTimeRate),
    },
    acceptanceRate: {
      driverValue: acceptanceRate,
      zoneAverage: zoneAverages.averageAcceptanceRate,
      percentile: calcPercentile(acceptanceRate, zoneAverages.averageAcceptanceRate),
    },
    cancellationRate: {
      driverValue: cancellationRate,
      zoneAverage: zoneAverages.averageCancellationRate,
      percentile: calcInversePercentile(
        cancellationRate,
        zoneAverages.averageCancellationRate,
      ),
    },
  };

  const percentiles = Object.values(metricsMap).map((m) => m.percentile);
  const overallPercentile =
    percentiles.reduce((s, v) => s + v, 0) / percentiles.length;

  // Outlier if overall percentile is below 20 or above 90
  const isOutlier = overallPercentile < 20 || overallPercentile > 90;

  return {
    driverId: metrics.driverId,
    zoneId: zoneAverages.zoneId,
    metrics: metricsMap,
    overallPercentile: Math.round(overallPercentile * 100) / 100,
    isOutlier,
  };
}

// ---------------------------------------------------------------------------
// Trend Analysis (Linear Regression)
// ---------------------------------------------------------------------------

/**
 * Perform linear regression on a data series to detect trends.
 */
export function analyzeTrend(values: number[]): TrendAnalysisResult {
  if (values.length < 2) {
    return {
      slope: 0,
      intercept: values.length > 0 ? values[0]! : 0,
      rSquared: 0,
      direction: "stable",
      confidence: 0,
    };
  }

  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i]!;
    sumXY += i * values[i]!;
    sumX2 += i * i;
    sumY2 += values[i]! ** 2;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) {
    return { slope: 0, intercept: sumY / n, rSquared: 0, direction: "stable", confidence: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const yMean = sumY / n;
  const ssTotal = sumY2 - n * yMean * yMean;
  const ssResidual = values.reduce(
    (sum, y, i) => sum + (y - (intercept + slope * i)) ** 2,
    0,
  );
  const rSquared = ssTotal === 0 ? 0 : Math.max(0, 1 - ssResidual / ssTotal);

  let direction: TrendAnalysisResult["direction"];
  if (slope > 0.5) direction = "improving";
  else if (slope < -0.5) direction = "declining";
  else direction = "stable";

  return {
    slope: Math.round(slope * 1000) / 1000,
    intercept: Math.round(intercept * 100) / 100,
    rSquared: Math.round(rSquared * 1000) / 1000,
    direction,
    confidence: Math.round(rSquared * 100),
  };
}

// ---------------------------------------------------------------------------
// Auto-Suspend Logic
// ---------------------------------------------------------------------------

/**
 * Aggregate anomalies for a driver and determine if auto-suspend is warranted.
 */
export function aggregateAnomalies(
  driverId: string,
  anomalies: Anomaly[],
  totalDeliveries: number,
): AggregatedAnomalies {
  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const highCount = anomalies.filter((a) => a.severity === "high").length;

  let shouldAutoSuspend = false;
  let suspendReason: string | null = null;

  if (totalDeliveries >= AUTO_SUSPEND_RULES.minDeliveriesForSuspend) {
    if (criticalCount >= AUTO_SUSPEND_RULES.maxCriticalAnomalies) {
      shouldAutoSuspend = true;
      suspendReason = `${criticalCount} critical anomalies detected (threshold: ${AUTO_SUSPEND_RULES.maxCriticalAnomalies})`;
    } else if (highCount >= AUTO_SUSPEND_RULES.maxHighAnomalies) {
      shouldAutoSuspend = true;
      suspendReason = `${highCount} high-severity anomalies detected (threshold: ${AUTO_SUSPEND_RULES.maxHighAnomalies})`;
    } else if (anomalies.length >= AUTO_SUSPEND_RULES.maxTotalAnomalies) {
      shouldAutoSuspend = true;
      suspendReason = `${anomalies.length} total anomalies detected (threshold: ${AUTO_SUSPEND_RULES.maxTotalAnomalies})`;
    }
  }

  let riskLevel: AlertSeverity = "low";
  if (criticalCount > 0) riskLevel = "critical";
  else if (highCount > 0) riskLevel = "high";
  else if (anomalies.some((a) => a.severity === "medium")) riskLevel = "medium";

  if (shouldAutoSuspend) {
    logger.info(
      `Auto-suspend triggered for driver ${driverId}: ${suspendReason}`,
      "AtlasScore",
    );
  }

  return {
    driverId,
    anomalies,
    riskLevel,
    shouldAutoSuspend,
    suspendReason,
  };
}

/**
 * Run a full anomaly detection pipeline for a driver's metric history.
 */
export function runAnomalyPipeline(
  driverId: string,
  metricHistory: Record<string, number[]>,
  totalDeliveries: number,
): AggregatedAnomalies {
  const allAnomalies: Anomaly[] = [];

  for (const [metricName, values] of Object.entries(metricHistory)) {
    const anomalies = detectAnomalies(values, metricName);
    allAnomalies.push(...anomalies);
  }

  return aggregateAnomalies(driverId, allAnomalies, totalDeliveries);
}
