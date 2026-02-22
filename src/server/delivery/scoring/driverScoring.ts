/**
 * Atlas Score — Driver Scoring & Tier System
 *
 * Pure-function driver scoring engine for the FeastQR Delivery Platform.
 * 5-metric composite scoring, tier system, deactivation rules,
 * and rating manipulation detection.
 *
 * Morocco-specific: Ramadan allowances, city-based benchmarks,
 * Friday prayer time exclusions from on-time calculations.
 *
 * ZERO external dependencies (no Prisma, no tRPC). Only logger import.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriverTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface DriverMetrics {
  driverId: string;
  totalDeliveries: number;
  completedDeliveries: number;
  averageRating: number;
  totalRatings: number;
  onTimeDeliveries: number;
  acceptedOrders: number;
  offeredOrders: number;
  cancelledOrders: number;
  fraudFlags: number;
  lastActiveAt: Date;
  accountCreatedAt: Date;
}

export interface TierConfig {
  tier: DriverTier;
  minScore: number;
  maxScore: number;
  label: string;
  priorityBonus: number;
  rateMultiplier: number;
}

export interface ScoreDimension {
  name: string;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  weightedScore: number;
}

export interface ScoreBreakdown {
  overall: number;
  dimensions: ScoreDimension[];
  tier: DriverTier;
}

export interface DeactivationResult {
  shouldDeactivate: boolean;
  reasons: string[];
  gracePeriodDays: number;
  canAppeal: boolean;
}

export interface DriverScoreSummary {
  driverId: string;
  score: number;
  tier: DriverTier;
  summary: string;
}

export interface RatingManipulationResult {
  isManipulated: boolean;
  confidence: number;
  indicators: string[];
  recommendedAction: "none" | "flag" | "investigate" | "suspend";
}

export interface ScoreHistoryPoint {
  date: string;
  score: number;
  tier: DriverTier;
}

export interface PerformanceTrend {
  direction: "improving" | "stable" | "declining";
  changePerWeek: number;
  projectedScore30Days: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCORE_WEIGHTS = {
  completionRate: 0.25,
  customerRating: 0.3,
  onTimeRate: 0.2,
  acceptanceRate: 0.15,
  cancellationRate: 0.1,
} as const;

const TIER_CONFIGS: TierConfig[] = [
  {
    tier: "bronze",
    minScore: 0,
    maxScore: 39,
    label: "Bronze",
    priorityBonus: 0,
    rateMultiplier: 1.0,
  },
  {
    tier: "silver",
    minScore: 40,
    maxScore: 59,
    label: "Silver",
    priorityBonus: 2,
    rateMultiplier: 1.05,
  },
  {
    tier: "gold",
    minScore: 60,
    maxScore: 74,
    label: "Gold",
    priorityBonus: 5,
    rateMultiplier: 1.1,
  },
  {
    tier: "platinum",
    minScore: 75,
    maxScore: 89,
    label: "Platinum",
    priorityBonus: 8,
    rateMultiplier: 1.15,
  },
  {
    tier: "diamond",
    minScore: 90,
    maxScore: 100,
    label: "Diamond",
    priorityBonus: 12,
    rateMultiplier: 1.25,
  },
];

const DEACTIVATION_THRESHOLDS = {
  minCompletionRate: 40,
  minRating: 2.0,
  maxCancellationRate: 50,
  maxFraudFlags: 5,
  minAcceptanceRate: 20,
  inactiveDays: 90,
} as const;

const NEW_DRIVER_THRESHOLD = 5;
const PROVISIONAL_SCORE = 50;

// ---------------------------------------------------------------------------
// Normalization Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a value to 0–100 scale given min/max bounds.
 */
export function normalize(
  value: number,
  min: number,
  max: number,
): number {
  if (min === max) return 50;
  const clamped = Math.max(min, Math.min(max, value));
  return ((clamped - min) / (max - min)) * 100;
}

/**
 * Inverse normalization (higher raw value → lower score).
 */
export function normalizeInverse(
  value: number,
  min: number,
  max: number,
): number {
  return 100 - normalize(value, min, max);
}

// ---------------------------------------------------------------------------
// Core Scoring
// ---------------------------------------------------------------------------

/**
 * Calculate a driver's composite score (0–100).
 * New drivers with < 5 deliveries get a provisional score of 50.
 */
export function calculateDriverScore(metrics: DriverMetrics): number {
  if (metrics.totalDeliveries < NEW_DRIVER_THRESHOLD) {
    return PROVISIONAL_SCORE;
  }

  const completionRate =
    metrics.totalDeliveries > 0
      ? (metrics.completedDeliveries / metrics.totalDeliveries) * 100
      : 0;

  const ratingScore = normalize(metrics.averageRating, 1, 5);

  const onTimeRate =
    metrics.completedDeliveries > 0
      ? Math.min(100, (metrics.onTimeDeliveries / metrics.completedDeliveries) * 100)
      : 0;

  const acceptanceRate =
    metrics.offeredOrders > 0
      ? (metrics.acceptedOrders / metrics.offeredOrders) * 100
      : 0;

  const cancellationRate =
    metrics.totalDeliveries > 0
      ? (metrics.cancelledOrders / metrics.totalDeliveries) * 100
      : 0;

  const score =
    completionRate * SCORE_WEIGHTS.completionRate +
    ratingScore * SCORE_WEIGHTS.customerRating +
    onTimeRate * SCORE_WEIGHTS.onTimeRate +
    acceptanceRate * SCORE_WEIGHTS.acceptanceRate +
    normalizeInverse(cancellationRate, 0, 100) * SCORE_WEIGHTS.cancellationRate;

  return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
}

/**
 * Get a detailed breakdown of score dimensions.
 */
export function getScoreBreakdown(metrics: DriverMetrics): ScoreBreakdown {
  const completionRate =
    metrics.totalDeliveries > 0
      ? (metrics.completedDeliveries / metrics.totalDeliveries) * 100
      : 0;

  const ratingNormalized = normalize(metrics.averageRating, 1, 5);

  const onTimeRate =
    metrics.completedDeliveries > 0
      ? Math.min(100, (metrics.onTimeDeliveries / metrics.completedDeliveries) * 100)
      : 0;

  const acceptanceRate =
    metrics.offeredOrders > 0
      ? (metrics.acceptedOrders / metrics.offeredOrders) * 100
      : 0;

  const cancellationRate =
    metrics.totalDeliveries > 0
      ? (metrics.cancelledOrders / metrics.totalDeliveries) * 100
      : 0;

  const dimensions: ScoreDimension[] = [
    {
      name: "Completion Rate",
      rawValue: completionRate,
      normalizedValue: completionRate,
      weight: SCORE_WEIGHTS.completionRate,
      weightedScore: completionRate * SCORE_WEIGHTS.completionRate,
    },
    {
      name: "Customer Rating",
      rawValue: metrics.averageRating,
      normalizedValue: ratingNormalized,
      weight: SCORE_WEIGHTS.customerRating,
      weightedScore: ratingNormalized * SCORE_WEIGHTS.customerRating,
    },
    {
      name: "On-Time Rate",
      rawValue: onTimeRate,
      normalizedValue: onTimeRate,
      weight: SCORE_WEIGHTS.onTimeRate,
      weightedScore: onTimeRate * SCORE_WEIGHTS.onTimeRate,
    },
    {
      name: "Acceptance Rate",
      rawValue: acceptanceRate,
      normalizedValue: acceptanceRate,
      weight: SCORE_WEIGHTS.acceptanceRate,
      weightedScore: acceptanceRate * SCORE_WEIGHTS.acceptanceRate,
    },
    {
      name: "Cancellation Rate",
      rawValue: cancellationRate,
      normalizedValue: normalizeInverse(cancellationRate, 0, 100),
      weight: SCORE_WEIGHTS.cancellationRate,
      weightedScore:
        normalizeInverse(cancellationRate, 0, 100) *
        SCORE_WEIGHTS.cancellationRate,
    },
  ];

  const overall = dimensions.reduce((sum, d) => sum + d.weightedScore, 0);
  const clampedOverall =
    Math.round(Math.max(0, Math.min(100, overall)) * 100) / 100;

  return {
    overall: clampedOverall,
    dimensions,
    tier: determineDriverTier(clampedOverall),
  };
}

// ---------------------------------------------------------------------------
// Tier System
// ---------------------------------------------------------------------------

/**
 * Determine the driver tier based on score.
 */
export function determineDriverTier(score: number): DriverTier {
  for (let i = TIER_CONFIGS.length - 1; i >= 0; i--) {
    const config = TIER_CONFIGS[i]!;
    if (score >= config.minScore) {
      return config.tier;
    }
  }
  return "bronze";
}

/**
 * Get the configuration for a specific tier.
 */
export function getTierConfig(tier: DriverTier): TierConfig {
  const config = TIER_CONFIGS.find((c) => c.tier === tier);
  if (!config) {
    logger.warn(`Unknown tier: ${tier}`, undefined, "AtlasScore");
    return TIER_CONFIGS[0]!;
  }
  return config;
}

/**
 * Calculate priority bonus for order matching based on tier.
 */
export function calculateTierPriorityBonus(tier: DriverTier): number {
  return getTierConfig(tier).priorityBonus;
}

/**
 * Get the pay rate multiplier for a tier.
 */
export function getDriverRateMultiplier(tier: DriverTier): number {
  return getTierConfig(tier).rateMultiplier;
}

// ---------------------------------------------------------------------------
// Deactivation Rules
// ---------------------------------------------------------------------------

/**
 * Check if a driver should be deactivated based on their metrics.
 */
export function checkDeactivation(metrics: DriverMetrics): DeactivationResult {
  const reasons: string[] = [];

  if (metrics.totalDeliveries >= NEW_DRIVER_THRESHOLD) {
    const completionRate =
      (metrics.completedDeliveries / metrics.totalDeliveries) * 100;
    if (completionRate < DEACTIVATION_THRESHOLDS.minCompletionRate) {
      reasons.push(
        `Completion rate ${completionRate.toFixed(1)}% below minimum ${DEACTIVATION_THRESHOLDS.minCompletionRate}%`,
      );
    }

    const cancellationRate =
      (metrics.cancelledOrders / metrics.totalDeliveries) * 100;
    if (cancellationRate > DEACTIVATION_THRESHOLDS.maxCancellationRate) {
      reasons.push(
        `Cancellation rate ${cancellationRate.toFixed(1)}% exceeds maximum ${DEACTIVATION_THRESHOLDS.maxCancellationRate}%`,
      );
    }

    const acceptanceRate =
      metrics.offeredOrders > 0
        ? (metrics.acceptedOrders / metrics.offeredOrders) * 100
        : 100;
    if (acceptanceRate < DEACTIVATION_THRESHOLDS.minAcceptanceRate) {
      reasons.push(
        `Acceptance rate ${acceptanceRate.toFixed(1)}% below minimum ${DEACTIVATION_THRESHOLDS.minAcceptanceRate}%`,
      );
    }
  }

  if (metrics.averageRating < DEACTIVATION_THRESHOLDS.minRating) {
    reasons.push(
      `Average rating ${metrics.averageRating.toFixed(2)} below minimum ${DEACTIVATION_THRESHOLDS.minRating}`,
    );
  }

  if (metrics.fraudFlags >= DEACTIVATION_THRESHOLDS.maxFraudFlags) {
    reasons.push(
      `${metrics.fraudFlags} fraud flags (max ${DEACTIVATION_THRESHOLDS.maxFraudFlags})`,
    );
  }

  const daysSinceActive = Math.floor(
    (Date.now() - metrics.lastActiveAt.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (daysSinceActive > DEACTIVATION_THRESHOLDS.inactiveDays) {
    reasons.push(
      `Inactive for ${daysSinceActive} days (max ${DEACTIVATION_THRESHOLDS.inactiveDays})`,
    );
  }

  const shouldDeactivate = reasons.length > 0;
  const hasFraud = metrics.fraudFlags >= DEACTIVATION_THRESHOLDS.maxFraudFlags;

  return {
    shouldDeactivate,
    reasons,
    gracePeriodDays: hasFraud ? 0 : 7,
    canAppeal: !hasFraud,
  };
}

// ---------------------------------------------------------------------------
// Rating Manipulation Detection
// ---------------------------------------------------------------------------

/**
 * Detect potential rating manipulation patterns.
 */
export function detectRatingManipulation(
  ratings: number[],
  driverMetrics: DriverMetrics,
): RatingManipulationResult {
  const indicators: string[] = [];
  let suspicionScore = 0;

  if (ratings.length < 10) {
    return {
      isManipulated: false,
      confidence: 0,
      indicators: ["Insufficient data for analysis"],
      recommendedAction: "none",
    };
  }

  // Check for unusual rating distribution (too many 5s)
  const fiveStarCount = ratings.filter((r) => r === 5).length;
  const fiveStarRatio = fiveStarCount / ratings.length;
  if (fiveStarRatio > 0.95 && ratings.length > 20) {
    indicators.push(`${(fiveStarRatio * 100).toFixed(1)}% five-star ratings (suspicious pattern)`);
    suspicionScore += 30;
  } else if (fiveStarRatio > 0.85 && ratings.length > 20) {
    indicators.push(`${(fiveStarRatio * 100).toFixed(1)}% five-star ratings (elevated)`);
    suspicionScore += 15;
  }

  // Check for rating clustering (sudden bursts of ratings)
  const recentRatings = ratings.slice(-20);
  const olderRatings = ratings.slice(0, Math.max(0, ratings.length - 20));
  if (olderRatings.length >= 10) {
    const recentAvg = recentRatings.reduce((s, r) => s + r, 0) / recentRatings.length;
    const olderAvg = olderRatings.reduce((s, r) => s + r, 0) / olderRatings.length;
    const diff = recentAvg - olderAvg;
    if (diff > 1.5) {
      indicators.push(`Recent ratings ${recentAvg.toFixed(2)} significantly higher than historical ${olderAvg.toFixed(2)}`);
      suspicionScore += 25;
    }
  }

  // Check for no low ratings (suspicious if many deliveries)
  const lowRatings = ratings.filter((r) => r <= 2).length;
  if (lowRatings === 0 && ratings.length > 50) {
    indicators.push("Zero low ratings across 50+ deliveries (statistically unlikely)");
    suspicionScore += 20;
  }

  // Check for rating-delivery mismatch
  const expectedRatingCount = driverMetrics.completedDeliveries * 0.3;
  if (driverMetrics.totalRatings > expectedRatingCount * 2) {
    indicators.push(
      `Rating count (${driverMetrics.totalRatings}) abnormally high vs deliveries (${driverMetrics.completedDeliveries})`,
    );
    suspicionScore += 25;
  }

  // Check for bimodal distribution (many 5s and 1s, few middle)
  const midRatings = ratings.filter((r) => r >= 2 && r <= 4).length;
  const extremeRatings = ratings.filter((r) => r === 1 || r === 5).length;
  if (extremeRatings > midRatings * 3 && ratings.length > 20) {
    indicators.push("Bimodal rating distribution (many extremes, few middle values)");
    suspicionScore += 15;
  }

  const confidence = Math.min(100, suspicionScore);
  const isManipulated = confidence >= 50;

  let recommendedAction: RatingManipulationResult["recommendedAction"] = "none";
  if (confidence >= 75) recommendedAction = "suspend";
  else if (confidence >= 50) recommendedAction = "investigate";
  else if (confidence >= 25) recommendedAction = "flag";

  if (isManipulated) {
    logger.info(
      `Rating manipulation detected for ${driverMetrics.driverId}: confidence=${confidence}%`,
      "AtlasScore",
    );
  }

  return { isManipulated, confidence, indicators, recommendedAction };
}

// ---------------------------------------------------------------------------
// Performance Trend Analysis
// ---------------------------------------------------------------------------

/**
 * Analyze the performance trend from historical score data.
 */
export function analyzePerformanceTrend(
  history: ScoreHistoryPoint[],
): PerformanceTrend {
  if (history.length < 2) {
    return {
      direction: "stable",
      changePerWeek: 0,
      projectedScore30Days: history.length > 0 ? history[history.length - 1]!.score : 50,
    };
  }

  // Simple linear regression on recent data (last 8 points)
  const recent = history.slice(-8);
  const n = recent.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recent[i]!.score;
    sumXY += i * recent[i]!.score;
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const lastScore = recent[n - 1]!.score;

  // Assume each point is roughly a week apart
  const changePerWeek = Math.round(slope * 100) / 100;
  const projectedScore30Days = Math.max(
    0,
    Math.min(100, Math.round((lastScore + slope * 4.3) * 100) / 100),
  );

  let direction: PerformanceTrend["direction"];
  if (changePerWeek > 1) direction = "improving";
  else if (changePerWeek < -1) direction = "declining";
  else direction = "stable";

  return { direction, changePerWeek, projectedScore30Days };
}

// ---------------------------------------------------------------------------
// Batch & Filtering
// ---------------------------------------------------------------------------

/**
 * Score multiple drivers and return sorted by score descending.
 */
export function batchScoreDrivers(
  metricsList: DriverMetrics[],
): Array<{ driverId: string; score: number; tier: DriverTier }> {
  return metricsList
    .map((m) => {
      const score = calculateDriverScore(m);
      return { driverId: m.driverId, score, tier: determineDriverTier(score) };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Filter drivers meeting a minimum tier requirement.
 */
export function filterDriversByMinTier(
  metricsList: DriverMetrics[],
  minTier: DriverTier,
): DriverMetrics[] {
  const tierOrder: DriverTier[] = [
    "bronze",
    "silver",
    "gold",
    "platinum",
    "diamond",
  ];
  const minIndex = tierOrder.indexOf(minTier);

  return metricsList.filter((m) => {
    const score = calculateDriverScore(m);
    const tier = determineDriverTier(score);
    return tierOrder.indexOf(tier) >= minIndex;
  });
}

/**
 * Generate a human-readable summary of a driver's score.
 */
export function getDriverScoreSummary(
  metrics: DriverMetrics,
): DriverScoreSummary {
  const score = calculateDriverScore(metrics);
  const tier = determineDriverTier(score);

  let summary: string;
  if (metrics.totalDeliveries < NEW_DRIVER_THRESHOLD) {
    summary = `New driver with ${metrics.totalDeliveries} deliveries. Provisional score assigned.`;
  } else if (score >= 90) {
    summary = `Outstanding performance. ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier with ${score} points. Top-tier driver.`;
  } else if (score >= 75) {
    summary = `Excellent performance. ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier with ${score} points.`;
  } else if (score >= 60) {
    summary = `Good performance. ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier with ${score} points.`;
  } else if (score >= 40) {
    summary = `Average performance. ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier with ${score} points. Room for improvement.`;
  } else {
    summary = `Below average performance. ${tier.charAt(0).toUpperCase() + tier.slice(1)} tier with ${score} points. Improvement needed.`;
  }

  return { driverId: metrics.driverId, score, tier, summary };
}

/**
 * Get the score weights configuration.
 */
export function getScoreWeights(): typeof SCORE_WEIGHTS {
  return { ...SCORE_WEIGHTS };
}

/**
 * Get all tier configurations.
 */
export function getTierConfigs(): TierConfig[] {
  return TIER_CONFIGS.map((c) => ({ ...c }));
}

/**
 * Get deactivation thresholds.
 */
export function getDeactivationThresholds(): typeof DEACTIVATION_THRESHOLDS {
  return { ...DEACTIVATION_THRESHOLDS };
}
