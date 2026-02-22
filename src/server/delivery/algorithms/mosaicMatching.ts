/**
 * Mosaic Matching — Order-to-Driver Assignment Algorithm
 *
 * Multi-dimensional matching engine for the FeastQR Delivery Platform.
 * Morocco-specific: 9 city speed profiles, Friday prayer, Ramadan,
 * medina navigation, weather adjustments.
 *
 * Core capabilities:
 * - Haversine distance calculation
 * - Travel time estimation with city-specific speed profiles
 * - Multi-factor driver scoring (proximity, rating, load, tier)
 * - Batch order clustering
 * - Surge pricing
 * - Demand forecasting
 * - Zone management
 * - Reassignment evaluation
 *
 * ZERO external dependencies (no Prisma, no tRPC). Pure functions only.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CitySpeedProfile {
  name: string;
  averageSpeedKmh: number;
  peakHourMultiplier: number;
  medinaMultiplier: number;
  hasMediana: boolean;
}

export type TimePeriod =
  | "morning_rush"
  | "midday"
  | "afternoon"
  | "evening_rush"
  | "night"
  | "friday_prayer"
  | "ramadan_iftar";

export interface MatchingWeights {
  proximity: number;
  rating: number;
  loadBalance: number;
  tierBonus: number;
  acceptanceRate: number;
  specialization: number;
}

export interface DriverCandidate {
  id: string;
  location: Coordinates;
  rating: number;
  activeDeliveries: number;
  maxDeliveries: number;
  tier: string;
  acceptanceRate: number;
  vehicleType: string;
  isInMediana: boolean;
  lastDeliveryTime: number;
  specializations: string[];
}

export interface OrderInfo {
  id: string;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  estimatedValue: number;
  cuisine: string;
  isFragile: boolean;
  maxWaitMinutes: number;
  createdAt: number;
  priority: number;
}

export interface MatchResult {
  driverId: string;
  orderId: string;
  score: number;
  estimatedPickupMinutes: number;
  estimatedDeliveryMinutes: number;
  distanceKm: number;
  reasons: string[];
}

export interface BatchCluster {
  centroid: Coordinates;
  orders: OrderInfo[];
  radius: number;
}

export interface SurgePricingResult {
  multiplier: number;
  reason: string;
  basePrice: number;
  surgePrice: number;
}

export interface DemandForecast {
  zoneId: string;
  hour: number;
  expectedOrders: number;
  confidence: number;
  driversNeeded: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  center: Coordinates;
  radiusKm: number;
  demandLevel: "low" | "medium" | "high";
}

export interface ReassignmentEvaluation {
  shouldReassign: boolean;
  reason: string;
  newDriverId: string | null;
  expectedTimeSaving: number;
}

export interface AssignmentStats {
  totalOrders: number;
  assignedOrders: number;
  averageScore: number;
  averagePickupMinutes: number;
  averageDistanceKm: number;
}

// ---------------------------------------------------------------------------
// Constants — Morocco City Speed Profiles
// ---------------------------------------------------------------------------

export const CITY_PROFILES: Record<string, CitySpeedProfile> = {
  casablanca: {
    name: "Casablanca",
    averageSpeedKmh: 25,
    peakHourMultiplier: 0.6,
    medinaMultiplier: 0.3,
    hasMediana: true,
  },
  rabat: {
    name: "Rabat",
    averageSpeedKmh: 22,
    peakHourMultiplier: 0.65,
    medinaMultiplier: 0.35,
    hasMediana: true,
  },
  marrakech: {
    name: "Marrakech",
    averageSpeedKmh: 20,
    peakHourMultiplier: 0.55,
    medinaMultiplier: 0.25,
    hasMediana: true,
  },
  fes: {
    name: "Fès",
    averageSpeedKmh: 18,
    peakHourMultiplier: 0.6,
    medinaMultiplier: 0.2,
    hasMediana: true,
  },
  tangier: {
    name: "Tangier",
    averageSpeedKmh: 23,
    peakHourMultiplier: 0.65,
    medinaMultiplier: 0.3,
    hasMediana: true,
  },
  agadir: {
    name: "Agadir",
    averageSpeedKmh: 28,
    peakHourMultiplier: 0.7,
    medinaMultiplier: 0.4,
    hasMediana: false,
  },
  meknes: {
    name: "Meknès",
    averageSpeedKmh: 22,
    peakHourMultiplier: 0.65,
    medinaMultiplier: 0.3,
    hasMediana: true,
  },
  oujda: {
    name: "Oujda",
    averageSpeedKmh: 25,
    peakHourMultiplier: 0.7,
    medinaMultiplier: 0.35,
    hasMediana: false,
  },
  kenitra: {
    name: "Kénitra",
    averageSpeedKmh: 24,
    peakHourMultiplier: 0.65,
    medinaMultiplier: 0.35,
    hasMediana: false,
  },
};

export const DEFAULT_WEIGHTS: MatchingWeights = {
  proximity: 0.35,
  rating: 0.2,
  loadBalance: 0.15,
  tierBonus: 0.1,
  acceptanceRate: 0.1,
  specialization: 0.1,
};

export const MATCHING_CONSTANTS = {
  maxPickupDistanceKm: 10,
  maxActiveDeliveries: 3,
  earthRadiusKm: 6371,
  minScoreThreshold: 20,
  surgeBaseMultiplier: 1.0,
  surgeMaxMultiplier: 3.0,
  surgeDemandThreshold: 0.8,
  clusterRadiusKm: 2,
  reassessmentWindowMinutes: 15,
} as const;

// ---------------------------------------------------------------------------
// Core: Haversine Distance
// ---------------------------------------------------------------------------

/**
 * Calculate the great-circle distance between two points using haversine formula.
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = MATCHING_CONSTANTS.earthRadiusKm;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate bearing between two points.
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const dLng = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const y = Math.sin(dLng) * Math.cos(toLat);
  const x =
    Math.cos(fromLat) * Math.sin(toLat) -
    Math.sin(fromLat) * Math.cos(toLat) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

// ---------------------------------------------------------------------------
// Travel Time Estimation
// ---------------------------------------------------------------------------

/**
 * Classify the current time period for Morocco.
 */
export function classifyTimePeriod(date: Date): TimePeriod {
  const hour = date.getHours();
  const day = date.getDay(); // 0 = Sunday, 5 = Friday

  // Friday prayer (12:00–14:00)
  if (day === 5 && hour >= 12 && hour < 14) return "friday_prayer";

  if (hour >= 7 && hour < 10) return "morning_rush";
  if (hour >= 10 && hour < 13) return "midday";
  if (hour >= 13 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening_rush";
  return "night";
}

/**
 * Get contextual weights for the matching algorithm.
 */
export function getWeightsForContext(
  timePeriod: TimePeriod,
  baseWeights: MatchingWeights = DEFAULT_WEIGHTS,
): MatchingWeights {
  const weights = { ...baseWeights };

  switch (timePeriod) {
    case "morning_rush":
    case "evening_rush":
      // During rush, proximity matters more
      weights.proximity = Math.min(1, weights.proximity * 1.3);
      weights.rating *= 0.8;
      break;
    case "friday_prayer":
      // Fewer drivers, acceptance rate matters more
      weights.acceptanceRate = Math.min(1, weights.acceptanceRate * 1.5);
      weights.proximity *= 0.9;
      break;
    case "ramadan_iftar":
      // High demand, maximize throughput
      weights.loadBalance = Math.min(1, weights.loadBalance * 1.4);
      weights.proximity = Math.min(1, weights.proximity * 1.2);
      break;
    case "night":
      // Safety and reliability matter more at night
      weights.rating = Math.min(1, weights.rating * 1.3);
      weights.tierBonus = Math.min(1, weights.tierBonus * 1.2);
      break;
  }

  // Normalize weights to sum to 1
  const total = Object.values(weights).reduce((s, w) => s + w, 0);
  if (total > 0) {
    (Object.keys(weights) as (keyof MatchingWeights)[]).forEach((key) => {
      weights[key] = weights[key] / total;
    });
  }

  return weights;
}

/**
 * Estimate travel time in minutes between two points for a given city and conditions.
 */
export function estimateTravelTime(
  from: Coordinates,
  to: Coordinates,
  city: string = "casablanca",
  isMediana: boolean = false,
  timePeriod: TimePeriod = "midday",
): number {
  const distance = haversineDistance(from, to);
  const profile = CITY_PROFILES[city] ?? CITY_PROFILES.casablanca!;

  let effectiveSpeed = profile.averageSpeedKmh;

  // Apply medina slow-down
  if (isMediana && profile.hasMediana) {
    effectiveSpeed *= profile.medinaMultiplier;
  }

  // Apply peak hour slow-down
  if (timePeriod === "morning_rush" || timePeriod === "evening_rush") {
    effectiveSpeed *= profile.peakHourMultiplier;
  }

  // Friday prayer further slows traffic
  if (timePeriod === "friday_prayer") {
    effectiveSpeed *= 0.5;
  }

  // Ramadan iftar rush
  if (timePeriod === "ramadan_iftar") {
    effectiveSpeed *= 0.4;
  }

  // Minimum speed floor (walking speed)
  effectiveSpeed = Math.max(4, effectiveSpeed);

  const timeHours = distance / effectiveSpeed;
  return Math.round(timeHours * 60 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Mosaic Score Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate a composite matching score for a driver-order pair.
 */
export function calculateMosaicScore(
  driver: DriverCandidate,
  order: OrderInfo,
  weights: MatchingWeights = DEFAULT_WEIGHTS,
  city: string = "casablanca",
): number {
  // 1. Proximity score (closer is better)
  const distanceKm = haversineDistance(driver.location, order.pickupLocation);
  const maxDist = MATCHING_CONSTANTS.maxPickupDistanceKm;
  const proximityScore = Math.max(0, 100 * (1 - distanceKm / maxDist));

  // 2. Rating score (normalized 1-5 → 0-100)
  const ratingScore = ((driver.rating - 1) / 4) * 100;

  // 3. Load balance (fewer active deliveries → higher score)
  const loadRatio = driver.activeDeliveries / driver.maxDeliveries;
  const loadScore = Math.max(0, 100 * (1 - loadRatio));

  // 4. Tier bonus
  const tierScores: Record<string, number> = {
    bronze: 0,
    silver: 20,
    gold: 40,
    platinum: 60,
    diamond: 100,
  };
  const tierScore = tierScores[driver.tier] ?? 0;

  // 5. Acceptance rate (normalized to 0-100)
  const acceptanceScore = driver.acceptanceRate;

  // 6. Specialization bonus
  const specializationScore = driver.specializations.includes(order.cuisine)
    ? 100
    : 0;

  const total =
    proximityScore * weights.proximity +
    ratingScore * weights.rating +
    loadScore * weights.loadBalance +
    tierScore * weights.tierBonus +
    acceptanceScore * weights.acceptanceRate +
    specializationScore * weights.specialization;

  return Math.round(Math.max(0, Math.min(100, total)) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Driver Matching
// ---------------------------------------------------------------------------

/**
 * Find the best driver for an order from a list of candidates.
 */
export function findBestDriver(
  order: OrderInfo,
  drivers: DriverCandidate[],
  weights: MatchingWeights = DEFAULT_WEIGHTS,
  city: string = "casablanca",
): MatchResult | null {
  if (drivers.length === 0) return null;

  const eligible = drivers.filter((d) => {
    // Must have capacity
    if (d.activeDeliveries >= d.maxDeliveries) return false;
    // Must be within max pickup distance
    const dist = haversineDistance(d.location, order.pickupLocation);
    if (dist > MATCHING_CONSTANTS.maxPickupDistanceKm) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  let bestDriver: DriverCandidate | null = null;
  let bestScore = -1;

  for (const driver of eligible) {
    const score = calculateMosaicScore(driver, order, weights, city);
    if (score > bestScore) {
      bestScore = score;
      bestDriver = driver;
    }
  }

  if (!bestDriver || bestScore < MATCHING_CONSTANTS.minScoreThreshold) {
    return null;
  }

  const distanceKm = haversineDistance(bestDriver.location, order.pickupLocation);
  const deliveryDist = haversineDistance(order.pickupLocation, order.dropoffLocation);
  const pickupTime = estimateTravelTime(
    bestDriver.location,
    order.pickupLocation,
    city,
    bestDriver.isInMediana,
  );
  const deliveryTime = estimateTravelTime(
    order.pickupLocation,
    order.dropoffLocation,
    city,
  );

  const reasons: string[] = [];
  if (distanceKm < 2) reasons.push("Very close to pickup");
  if (bestDriver.rating >= 4.5) reasons.push("Highly rated driver");
  if (bestDriver.activeDeliveries === 0) reasons.push("Currently available");
  if (bestDriver.specializations.includes(order.cuisine)) {
    reasons.push(`Specializes in ${order.cuisine}`);
  }

  return {
    driverId: bestDriver.id,
    orderId: order.id,
    score: bestScore,
    estimatedPickupMinutes: pickupTime,
    estimatedDeliveryMinutes: deliveryTime,
    distanceKm: Math.round((distanceKm + deliveryDist) * 100) / 100,
    reasons,
  };
}

// ---------------------------------------------------------------------------
// Order Priority
// ---------------------------------------------------------------------------

/**
 * Calculate an order's priority score. Higher = more urgent.
 */
export function calculateOrderPriority(order: OrderInfo, now: number): number {
  let priority = order.priority * 10;

  // Time-based urgency: older orders get higher priority
  const waitMinutes = (now - order.createdAt) / 60000;
  if (waitMinutes > order.maxWaitMinutes) {
    priority += 50;
  } else if (waitMinutes > order.maxWaitMinutes * 0.7) {
    priority += 30;
  } else if (waitMinutes > order.maxWaitMinutes * 0.5) {
    priority += 15;
  }

  // Value-based: higher value orders get slight priority boost
  if (order.estimatedValue > 20000) priority += 10; // > 200 MAD
  if (order.estimatedValue > 50000) priority += 10; // > 500 MAD

  return Math.min(100, priority);
}

// ---------------------------------------------------------------------------
// Batch Clustering
// ---------------------------------------------------------------------------

/**
 * Cluster nearby orders for batch assignment.
 * Uses simple distance-based clustering.
 */
export function batchClusterOrders(
  orders: OrderInfo[],
  radiusKm: number = MATCHING_CONSTANTS.clusterRadiusKm,
): BatchCluster[] {
  if (orders.length === 0) return [];

  const assigned = new Set<string>();
  const clusters: BatchCluster[] = [];

  // Sort by priority descending
  const sorted = [...orders].sort(
    (a, b) => b.priority - a.priority,
  );

  for (const order of sorted) {
    if (assigned.has(order.id)) continue;

    const cluster: OrderInfo[] = [order];
    assigned.add(order.id);

    for (const other of sorted) {
      if (assigned.has(other.id)) continue;
      const dist = haversineDistance(
        order.pickupLocation,
        other.pickupLocation,
      );
      if (dist <= radiusKm) {
        cluster.push(other);
        assigned.add(other.id);
      }
    }

    // Calculate centroid
    const centroid: Coordinates = {
      lat: cluster.reduce((s, o) => s + o.pickupLocation.lat, 0) / cluster.length,
      lng: cluster.reduce((s, o) => s + o.pickupLocation.lng, 0) / cluster.length,
    };

    // Calculate radius
    const maxDist = Math.max(
      ...cluster.map((o) => haversineDistance(centroid, o.pickupLocation)),
    );

    clusters.push({ centroid, orders: cluster, radius: maxDist });
  }

  return clusters;
}

// ---------------------------------------------------------------------------
// ETA Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate a comprehensive delivery ETA.
 */
export function calculateDeliveryEta(
  driverLocation: Coordinates,
  pickupLocation: Coordinates,
  dropoffLocation: Coordinates,
  city: string = "casablanca",
  isMediana: boolean = false,
  prepTimeMinutes: number = 10,
): {
  pickupMinutes: number;
  prepMinutes: number;
  deliveryMinutes: number;
  totalMinutes: number;
} {
  const pickupMinutes = estimateTravelTime(
    driverLocation,
    pickupLocation,
    city,
    isMediana,
  );
  const deliveryMinutes = estimateTravelTime(
    pickupLocation,
    dropoffLocation,
    city,
    isMediana,
  );

  return {
    pickupMinutes,
    prepMinutes: prepTimeMinutes,
    deliveryMinutes,
    totalMinutes: Math.round((pickupMinutes + prepTimeMinutes + deliveryMinutes) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Route Optimization (Simple Nearest-Neighbor)
// ---------------------------------------------------------------------------

/**
 * Optimize a multi-stop delivery route using nearest-neighbor heuristic.
 */
export function optimizeBatchRoute(
  startLocation: Coordinates,
  stops: Coordinates[],
): { orderedStops: Coordinates[]; totalDistanceKm: number } {
  if (stops.length <= 1) {
    const totalDistanceKm =
      stops.length === 1 ? haversineDistance(startLocation, stops[0]!) : 0;
    return { orderedStops: [...stops], totalDistanceKm };
  }

  const remaining = [...stops];
  const ordered: Coordinates[] = [];
  let current = startLocation;
  let totalDistance = 0;

  while (remaining.length > 0) {
    let nearest = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineDistance(current, remaining[i]!);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }

    const next = remaining.splice(nearest, 1)[0]!;
    ordered.push(next);
    totalDistance += nearestDist;
    current = next;
  }

  return {
    orderedStops: ordered,
    totalDistanceKm: Math.round(totalDistance * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Surge Pricing
// ---------------------------------------------------------------------------

/**
 * Calculate surge pricing based on demand-supply ratio.
 */
export function calculateSurgePricing(
  activeOrders: number,
  availableDrivers: number,
  basePriceCentimes: number,
  city: string = "casablanca",
): SurgePricingResult {
  if (availableDrivers === 0 && activeOrders > 0) {
    return {
      multiplier: MATCHING_CONSTANTS.surgeMaxMultiplier,
      reason: "No drivers available — maximum surge applied",
      basePrice: basePriceCentimes,
      surgePrice: Math.round(basePriceCentimes * MATCHING_CONSTANTS.surgeMaxMultiplier),
    };
  }

  if (availableDrivers === 0 && activeOrders === 0) {
    return {
      multiplier: MATCHING_CONSTANTS.surgeBaseMultiplier,
      reason: "No demand — no surge",
      basePrice: basePriceCentimes,
      surgePrice: basePriceCentimes,
    };
  }

  const demandRatio = activeOrders / availableDrivers;
  let multiplier: number = MATCHING_CONSTANTS.surgeBaseMultiplier;
  let reason = "Normal demand";

  if (demandRatio > 3) {
    multiplier = MATCHING_CONSTANTS.surgeMaxMultiplier;
    reason = "Extreme demand — maximum surge";
  } else if (demandRatio > 2) {
    multiplier = 2.0;
    reason = "Very high demand — double surge";
  } else if (demandRatio > 1.5) {
    multiplier = 1.5;
    reason = "High demand — moderate surge";
  } else if (demandRatio > MATCHING_CONSTANTS.surgeDemandThreshold) {
    multiplier = 1.2;
    reason = "Elevated demand — light surge";
  }

  return {
    multiplier,
    reason,
    basePrice: basePriceCentimes,
    surgePrice: Math.round(basePriceCentimes * multiplier),
  };
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

/**
 * Rank drivers for a leaderboard by composite score.
 */
export function rankDriversForLeaderboard(
  drivers: DriverCandidate[],
): Array<{ driverId: string; rank: number; score: number }> {
  const scored = drivers
    .map((d) => {
      const score =
        d.rating * 20 + // 0-100
        d.acceptanceRate * 0.3 + // 0-30
        (d.tier === "diamond" ? 20 : d.tier === "platinum" ? 15 : d.tier === "gold" ? 10 : d.tier === "silver" ? 5 : 0);
      return { driverId: d.id, score: Math.round(score * 100) / 100 };
    })
    .sort((a, b) => b.score - a.score);

  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Zone Management
// ---------------------------------------------------------------------------

/**
 * Find which delivery zone a point falls in.
 */
export function findZoneForPoint(
  point: Coordinates,
  zones: DeliveryZone[],
): DeliveryZone | null {
  for (const zone of zones) {
    const dist = haversineDistance(point, zone.center);
    if (dist <= zone.radiusKm) return zone;
  }
  return null;
}

/**
 * Count available drivers in a zone.
 */
export function countDriversInZone(
  zone: DeliveryZone,
  drivers: DriverCandidate[],
): number {
  return drivers.filter((d) => {
    const dist = haversineDistance(d.location, zone.center);
    return dist <= zone.radiusKm;
  }).length;
}

// ---------------------------------------------------------------------------
// Demand Forecasting (Simple)
// ---------------------------------------------------------------------------

/**
 * Simple demand forecast based on historical order counts.
 */
export function forecastDemand(
  zoneId: string,
  hour: number,
  historicalCounts: number[],
  availableDrivers: number,
): DemandForecast {
  if (historicalCounts.length === 0) {
    return {
      zoneId,
      hour,
      expectedOrders: 0,
      confidence: 0,
      driversNeeded: 0,
    };
  }

  const avg =
    historicalCounts.reduce((s, v) => s + v, 0) / historicalCounts.length;
  const variance =
    historicalCounts.reduce((s, v) => s + (v - avg) ** 2, 0) /
    historicalCounts.length;
  const stdDev = Math.sqrt(variance);

  // Confidence based on consistency (lower variance = higher confidence)
  const cv = avg > 0 ? stdDev / avg : 1;
  const confidence = Math.round(Math.max(0, Math.min(100, 100 * (1 - cv))) * 100) / 100;

  const expectedOrders = Math.round(avg * 100) / 100;
  const driversNeeded = Math.max(0, Math.ceil(expectedOrders / 3) - availableDrivers);

  return { zoneId, hour, expectedOrders, confidence, driversNeeded };
}

// ---------------------------------------------------------------------------
// Reassignment Evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate whether an in-progress delivery should be reassigned.
 */
export function evaluateReassignment(
  currentDriverId: string,
  currentDriverLocation: Coordinates,
  pickupLocation: Coordinates,
  alternativeDrivers: DriverCandidate[],
  elapsedMinutes: number,
  maxWaitMinutes: number,
): ReassignmentEvaluation {
  if (elapsedMinutes < MATCHING_CONSTANTS.reassessmentWindowMinutes) {
    return {
      shouldReassign: false,
      reason: "Too early to reassess",
      newDriverId: null,
      expectedTimeSaving: 0,
    };
  }

  const currentEta = estimateTravelTime(currentDriverLocation, pickupLocation);

  if (currentEta + elapsedMinutes <= maxWaitMinutes) {
    return {
      shouldReassign: false,
      reason: "Current driver will arrive within acceptable time",
      newDriverId: null,
      expectedTimeSaving: 0,
    };
  }

  // Find a closer driver
  let bestAlt: DriverCandidate | null = null;
  let bestAltEta = Infinity;

  for (const alt of alternativeDrivers) {
    if (alt.id === currentDriverId) continue;
    if (alt.activeDeliveries >= alt.maxDeliveries) continue;
    const altEta = estimateTravelTime(alt.location, pickupLocation);
    if (altEta < bestAltEta) {
      bestAltEta = altEta;
      bestAlt = alt;
    }
  }

  if (!bestAlt || bestAltEta >= currentEta) {
    return {
      shouldReassign: false,
      reason: "No closer driver available",
      newDriverId: null,
      expectedTimeSaving: 0,
    };
  }

  const timeSaving = currentEta - bestAltEta;
  const shouldReassign = timeSaving > 5; // Only reassign if saving > 5 minutes

  return {
    shouldReassign,
    reason: shouldReassign
      ? `Found closer driver saving ${timeSaving.toFixed(1)} minutes`
      : `Time saving of ${timeSaving.toFixed(1)} min too small to justify reassignment`,
    newDriverId: shouldReassign ? bestAlt.id : null,
    expectedTimeSaving: Math.round(timeSaving * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

/**
 * Compute aggregate statistics from a batch of assignment results.
 */
export function computeAssignmentStats(
  results: MatchResult[],
  totalOrders: number,
): AssignmentStats {
  if (results.length === 0) {
    return {
      totalOrders,
      assignedOrders: 0,
      averageScore: 0,
      averagePickupMinutes: 0,
      averageDistanceKm: 0,
    };
  }

  const avgScore =
    results.reduce((s, r) => s + r.score, 0) / results.length;
  const avgPickup =
    results.reduce((s, r) => s + r.estimatedPickupMinutes, 0) / results.length;
  const avgDist =
    results.reduce((s, r) => s + r.distanceKm, 0) / results.length;

  return {
    totalOrders,
    assignedOrders: results.length,
    averageScore: Math.round(avgScore * 100) / 100,
    averagePickupMinutes: Math.round(avgPickup * 100) / 100,
    averageDistanceKm: Math.round(avgDist * 100) / 100,
  };
}
