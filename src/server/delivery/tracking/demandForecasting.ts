/**
 * Demand Forecasting & Surge Pricing Module
 *
 * Predicts delivery demand, calculates surge pricing, and computes
 * delivery fees for the FeastQR delivery platform.
 *
 * Morocco-specific features:
 * - Friday prayer time detection (12:00-14:00)
 * - Ramadan iftar surge handling
 * - Moroccan holiday calendar
 * - COD-first pricing (centimes, MAD currency)
 * - Time periods tuned to Moroccan meal patterns
 *
 * All monetary values are in centimes (1 MAD = 100 centimes).
 * This follows the FeastQR convention of storing prices as integers.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimePeriod =
  | "morning_rush"
  | "midday"
  | "afternoon"
  | "evening_rush"
  | "night"
  | "friday_prayer"
  | "ramadan_iftar";

export type DemandLevel =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high"
  | "extreme";

export interface ZoneStats {
  zoneId: string;
  activeOrders: number;
  availableDrivers: number;
  averageWaitMinutes: number;
  demandLevel: DemandLevel;
}

export interface SurgeConfig {
  baseMultiplier: number;
  maxMultiplier: number;
  demandThreshold: number;
  supplyThreshold: number;
}

export interface SurgeResult {
  multiplier: number;
  reason: string;
  demandLevel: DemandLevel;
}

export interface DeliveryFeeResult {
  baseFee: number;
  distanceFee: number;
  surgeFee: number;
  totalFee: number;
  currency: string;
}

export interface HourlyDemand {
  hour: number;
  expectedOrders: number;
  confidence: number;
}

export interface DemandForecast {
  zoneId: string;
  date: string;
  hourlyDemand: HourlyDemand[];
  peakHours: number[];
  totalExpected: number;
}

export interface IncentiveResult {
  type: string;
  amount: number;
  reason: string;
  eligibleDrivers: number;
}

export interface WeatherImpact {
  condition: string;
  demandMultiplier: number;
  supplyMultiplier: number;
}

// ---------------------------------------------------------------------------
// Morocco Holiday Calendar
// ---------------------------------------------------------------------------

/**
 * Moroccan national holidays (month/day pairs).
 *
 * These are the fixed-date secular holidays. Islamic holidays (Eid al-Fitr,
 * Eid al-Adha, Mawlid, Islamic New Year) are not included because they
 * follow the Hijri calendar and shift each year. Those should be handled
 * by a separate Hijri calendar integration in production.
 *
 * Holiday impact on delivery:
 * - Demand typically spikes 30-50% on holiday evenings
 * - Morning demand may drop as restaurants open late
 * - Many restaurants close, reducing supply
 */
export const MOROCCO_HOLIDAYS: Array<{ month: number; day: number; name: string }> = [
  { month: 1, day: 1, name: "New Year" },
  { month: 5, day: 1, name: "Labour Day" },
  { month: 7, day: 30, name: "Throne Day" },
  { month: 8, day: 21, name: "Youth Day" },
  { month: 11, day: 6, name: "Green March" },
  { month: 11, day: 18, name: "Independence Day" },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_SURGE_CONFIG: SurgeConfig = {
  baseMultiplier: 1.0,
  maxMultiplier: 3.0,
  demandThreshold: 0.8,
  supplyThreshold: 0.3,
};

/** Base delivery fee in centimes (10 MAD) */
export const BASE_DELIVERY_FEE_CENTIMES = 1000;

/** Per-kilometer fee in centimes (3 MAD/km) */
export const PER_KM_FEE_CENTIMES = 300;

/** Minimum delivery fee in centimes (10 MAD) */
export const MIN_DELIVERY_FEE_CENTIMES = 1000;

/** Maximum delivery fee in centimes (50 MAD) */
export const MAX_DELIVERY_FEE_CENTIMES = 5000;

/** Peak hour bonus multiplier for delivery fee */
const PEAK_HOUR_FEE_MULTIPLIER = 1.25;

/** Demand levels mapped to order-to-driver ratios */
const DEMAND_THRESHOLDS = {
  very_low: 0.2,
  low: 0.5,
  moderate: 0.8,
  high: 1.2,
  very_high: 2.0,
  // Anything above 2.0 is extreme
};

/** Time period multipliers affecting expected demand */
const TIME_PERIOD_MULTIPLIERS: Record<TimePeriod, number> = {
  morning_rush: 0.8,
  midday: 1.2,
  afternoon: 0.6,
  evening_rush: 1.5,
  night: 0.4,
  friday_prayer: 0.3,
  ramadan_iftar: 2.5,
};

/**
 * Weather condition impacts on demand and driver supply.
 *
 * In Morocco:
 * - Rain is rare in most cities but causes significant disruption
 * - Heat waves (chergui wind) reduce driver availability
 * - Sandstorms (mainly southern cities) make delivery nearly impossible
 */
const WEATHER_IMPACTS: Record<string, { demandMultiplier: number; supplyMultiplier: number }> = {
  clear: { demandMultiplier: 1.0, supplyMultiplier: 1.0 },
  cloudy: { demandMultiplier: 1.05, supplyMultiplier: 0.95 },
  rain: { demandMultiplier: 1.4, supplyMultiplier: 0.6 },
  heavy_rain: { demandMultiplier: 1.6, supplyMultiplier: 0.3 },
  hot: { demandMultiplier: 1.2, supplyMultiplier: 0.7 },
  extreme_heat: { demandMultiplier: 1.3, supplyMultiplier: 0.4 },
  sandstorm: { demandMultiplier: 0.5, supplyMultiplier: 0.1 },
  windy: { demandMultiplier: 1.1, supplyMultiplier: 0.8 },
  fog: { demandMultiplier: 1.1, supplyMultiplier: 0.7 },
};

// ---------------------------------------------------------------------------
// Time Period Classification
// ---------------------------------------------------------------------------

/**
 * Classify the current time into a delivery demand time period.
 *
 * Morocco has distinct meal and activity patterns:
 * - Morning rush (07:00-10:00): Breakfast deliveries, mostly cafes
 * - Midday (11:00-14:00): Lunch - highest weekday demand
 * - Afternoon (14:00-17:00): Low demand, some snack/coffee orders
 * - Evening rush (18:00-22:00): Dinner - highest overall demand
 * - Night (22:00-07:00): Late-night orders, limited restaurant supply
 *
 * Special periods override the standard classification:
 * - Friday prayer (12:00-14:00 on Fridays): Very low demand
 * - Ramadan iftar (approximate sunset time, March-April): Extreme demand
 *
 * @param date - Date/time to classify
 * @returns The applicable time period
 */
export function classifyTimePeriod(date: Date): TimePeriod {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const dayOfWeek = date.getDay(); // 0=Sunday, 5=Friday

  // Check Ramadan iftar (simplified: March/April, 18:00-20:00)
  const month = date.getMonth(); // 0-indexed
  if ((month === 2 || month === 3) && hour >= 18 && hour < 20) {
    return "ramadan_iftar";
  }

  // Check Friday prayer time (12:00-14:00 on Fridays)
  if (dayOfWeek === 5 && hour >= 12 && hour < 14) {
    return "friday_prayer";
  }

  // Standard time periods
  const timeInMinutes = hour * 60 + minute;

  // Morning rush: 07:00-10:00
  if (timeInMinutes >= 420 && timeInMinutes < 600) {
    return "morning_rush";
  }

  // Midday: 11:00-14:00
  if (timeInMinutes >= 660 && timeInMinutes < 840) {
    return "midday";
  }

  // Afternoon: 14:00-17:00
  if (timeInMinutes >= 840 && timeInMinutes < 1020) {
    return "afternoon";
  }

  // Evening rush: 18:00-22:00
  if (timeInMinutes >= 1080 && timeInMinutes < 1320) {
    return "evening_rush";
  }

  // Night: everything else (22:00-07:00 and 10:00-11:00, 17:00-18:00 gaps)
  return "night";
}

// ---------------------------------------------------------------------------
// Demand Level Classification
// ---------------------------------------------------------------------------

/**
 * Classify the demand level based on the order-to-driver ratio.
 *
 * The ratio represents how many active orders exist per available driver.
 * Lower ratios mean excess driver capacity; higher ratios mean orders
 * are waiting longer for assignment.
 *
 * Thresholds:
 * - < 0.2: very_low - More drivers than needed, consider reducing fleet
 * - 0.2-0.5: low - Healthy surplus, short wait times
 * - 0.5-0.8: moderate - Balanced, normal operations
 * - 0.8-1.2: high - Starting to strain, consider activating reserve drivers
 * - 1.2-2.0: very_high - Significant wait times, surge pricing kicks in
 * - > 2.0: extreme - Critical shortage, maximum surge, emergency measures
 *
 * @param ratio - Active orders divided by available drivers
 * @returns Classified demand level
 */
export function getDemandLevel(ratio: number): DemandLevel {
  if (ratio < DEMAND_THRESHOLDS.very_low) return "very_low";
  if (ratio < DEMAND_THRESHOLDS.low) return "low";
  if (ratio < DEMAND_THRESHOLDS.moderate) return "moderate";
  if (ratio < DEMAND_THRESHOLDS.high) return "high";
  if (ratio < DEMAND_THRESHOLDS.very_high) return "very_high";
  return "extreme";
}

/**
 * Calculate the demand-to-supply ratio.
 *
 * Handles edge cases:
 * - Zero drivers: returns Infinity (no supply)
 * - Zero orders: returns 0 (no demand)
 * - Both zero: returns 0 (no activity)
 *
 * @param activeOrders - Number of pending/active orders in the zone
 * @param availableDrivers - Number of idle/available drivers in the zone
 * @returns Ratio of orders to drivers
 */
export function calculateDemandSupplyRatio(
  activeOrders: number,
  availableDrivers: number,
): number {
  if (activeOrders === 0) return 0;
  if (availableDrivers === 0) return Infinity;
  return activeOrders / availableDrivers;
}

// ---------------------------------------------------------------------------
// Surge Pricing
// ---------------------------------------------------------------------------

/**
 * Calculate the surge pricing multiplier based on demand-supply dynamics.
 *
 * Surge pricing serves two purposes:
 * 1. Demand management: Higher prices reduce order volume during peaks
 * 2. Supply incentive: Higher earnings attract more drivers to work
 *
 * The algorithm:
 * 1. If ratio < demandThreshold: no surge (multiplier = baseMultiplier)
 * 2. If ratio >= demandThreshold: surge increases linearly
 * 3. If availableDrivers / totalCapacity < supplyThreshold: supply squeeze bonus
 * 4. Final multiplier capped at maxMultiplier
 *
 * Morocco considerations:
 * - Surge is communicated in MAD to customers upfront
 * - Maximum 3x surge to maintain affordability (Morocco price sensitivity)
 * - Ramadan iftar gets gentler surge (cultural sensitivity)
 *
 * @param ratio - Demand-to-supply ratio
 * @param config - Surge configuration (default: DEFAULT_SURGE_CONFIG)
 * @returns Surge result with multiplier, reason, and demand level
 */
export function calculateSurgeMultiplier(
  ratio: number,
  config?: SurgeConfig,
): SurgeResult {
  const cfg = config ?? DEFAULT_SURGE_CONFIG;
  const demandLevel = getDemandLevel(ratio);

  // No surge if demand is below threshold
  if (ratio <= cfg.demandThreshold) {
    return {
      multiplier: cfg.baseMultiplier,
      reason: "Normal demand levels",
      demandLevel,
    };
  }

  // Calculate surge based on how far above threshold we are
  const excessRatio = ratio - cfg.demandThreshold;
  const surgeRange = cfg.maxMultiplier - cfg.baseMultiplier;

  // Linear interpolation: excess of 2.0 above threshold = max surge
  const surgeProgress = Math.min(excessRatio / 2.0, 1.0);
  const multiplier = cfg.baseMultiplier + surgeRange * surgeProgress;

  // Cap at maximum
  const cappedMultiplier = Math.min(multiplier, cfg.maxMultiplier);
  const roundedMultiplier = Math.round(cappedMultiplier * 100) / 100;

  let reason: string;
  if (demandLevel === "extreme") {
    reason = `Extreme demand: ${ratio.toFixed(1)} orders per driver`;
  } else if (demandLevel === "very_high") {
    reason = `Very high demand: ${ratio.toFixed(1)} orders per driver`;
  } else {
    reason = `High demand: ${ratio.toFixed(1)} orders per driver`;
  }

  logger.info(
    `Surge calculated: ${roundedMultiplier}x (ratio: ${ratio.toFixed(2)}, level: ${demandLevel})`,
    "demandForecasting",
  );

  return {
    multiplier: roundedMultiplier,
    reason,
    demandLevel,
  };
}

// ---------------------------------------------------------------------------
// Delivery Fee Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the total delivery fee for an order.
 *
 * Fee structure:
 * 1. Base fee: 10 MAD (covers fixed costs: insurance, platform)
 * 2. Distance fee: 3 MAD/km (covers fuel, vehicle wear)
 * 3. Surge fee: Additional charge during high demand
 * 4. Peak hour premium: 25% extra during peak hours
 *
 * The fee is capped between MIN (10 MAD) and MAX (50 MAD) to ensure:
 * - Drivers always earn a minimum viable amount
 * - Customers are never charged an excessive amount
 *
 * All values in centimes (integer arithmetic to avoid floating point issues).
 *
 * @param distanceKm - Delivery distance in kilometers
 * @param surgeMultiplier - Current surge multiplier (default 1.0)
 * @param isPeakHour - Whether the order is during peak hours
 * @returns Detailed fee breakdown
 */
export function calculateDeliveryFee(
  distanceKm: number,
  surgeMultiplier?: number,
  isPeakHour?: boolean,
): DeliveryFeeResult {
  const surge = surgeMultiplier ?? 1.0;
  const peak = isPeakHour ?? false;

  // Base fee
  const baseFee = BASE_DELIVERY_FEE_CENTIMES;

  // Distance fee
  const rawDistanceFee = Math.round(distanceKm * PER_KM_FEE_CENTIMES);

  // Apply peak hour multiplier to distance fee
  const distanceFee = peak
    ? Math.round(rawDistanceFee * PEAK_HOUR_FEE_MULTIPLIER)
    : rawDistanceFee;

  // Surge fee (applied to base + distance)
  const subtotal = baseFee + distanceFee;
  const surgedTotal = Math.round(subtotal * surge);
  const surgeFee = surgedTotal - subtotal;

  // Total with caps
  const rawTotal = surgedTotal;
  const totalFee = Math.max(
    MIN_DELIVERY_FEE_CENTIMES,
    Math.min(rawTotal, MAX_DELIVERY_FEE_CENTIMES),
  );

  logger.info(
    `Delivery fee: ${totalFee} centimes (base: ${baseFee}, dist: ${distanceFee}, surge: ${surgeFee})`,
    "demandForecasting",
  );

  return {
    baseFee,
    distanceFee,
    surgeFee: Math.max(surgeFee, 0),
    totalFee,
    currency: "MAD",
  };
}

// ---------------------------------------------------------------------------
// Demand Forecasting
// ---------------------------------------------------------------------------

/**
 * Forecast demand for a specific hour based on historical data.
 *
 * Uses a simple weighted average of historical observations for the same
 * hour across multiple days. More recent data gets higher weight.
 *
 * The historical data is expected as a 2D array where each inner array
 * represents one day's hourly order counts (24 values, index 0 = midnight).
 *
 * @param historicalData - Array of daily order count arrays (each has 24 values)
 * @param hour - Hour to forecast (0-23)
 * @returns Hourly demand prediction with confidence
 */
export function forecastHourlyDemand(
  historicalData: number[][],
  hour: number,
): HourlyDemand {
  if (historicalData.length === 0) {
    return { hour, expectedOrders: 0, confidence: 0 };
  }

  // Extract values for the target hour from each day
  const hourValues: number[] = [];
  for (const dayData of historicalData) {
    const value = dayData[hour];
    if (value !== undefined && value >= 0) {
      hourValues.push(value);
    }
  }

  if (hourValues.length === 0) {
    return { hour, expectedOrders: 0, confidence: 0 };
  }

  // Weighted average: more recent days get higher weight
  // Weights: last day = n, second-to-last = n-1, ... first day = 1
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < hourValues.length; i++) {
    const weight = i + 1; // More recent = higher weight
    const value = hourValues[i];
    if (value !== undefined) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  const expectedOrders = totalWeight > 0
    ? Math.round(weightedSum / totalWeight)
    : 0;

  // Confidence based on data quantity and consistency
  const mean = hourValues.reduce((s, v) => s + v, 0) / hourValues.length;
  const variance =
    hourValues.reduce((s, v) => s + (v - mean) ** 2, 0) / hourValues.length;
  const stdDev = Math.sqrt(variance);
  const coeffOfVariation = mean > 0 ? stdDev / mean : 1;

  // More data + lower variation = higher confidence
  const dataConfidence = Math.min(hourValues.length / 14, 1); // Caps at 2 weeks
  const variationConfidence = Math.max(1 - coeffOfVariation, 0);
  const confidence = Math.round(
    ((dataConfidence * 0.4 + variationConfidence * 0.6) * 100),
  ) / 100;

  return {
    hour,
    expectedOrders,
    confidence: Math.max(Math.min(confidence, 1), 0),
  };
}

/**
 * Generate a complete daily demand forecast for a delivery zone.
 *
 * Produces 24 hourly predictions and identifies peak hours. This is used
 * by the operations team to plan driver schedules and inventory.
 *
 * @param zoneId - Delivery zone identifier
 * @param historicalData - Historical daily order count arrays
 * @param date - Forecast date (YYYY-MM-DD format)
 * @returns Full daily forecast with peak hours and total expected orders
 */
export function generateDailyForecast(
  zoneId: string,
  historicalData: number[][],
  date: string,
): DemandForecast {
  const hourlyDemand: HourlyDemand[] = [];
  let totalExpected = 0;

  for (let hour = 0; hour < 24; hour++) {
    const forecast = forecastHourlyDemand(historicalData, hour);
    hourlyDemand.push(forecast);
    totalExpected += forecast.expectedOrders;
  }

  // Identify peak hours (top 20% of expected orders)
  const sortedByOrders = [...hourlyDemand]
    .filter((h) => h.expectedOrders > 0)
    .sort((a, b) => b.expectedOrders - a.expectedOrders);

  const peakCount = Math.max(Math.ceil(sortedByOrders.length * 0.2), 1);
  const peakHours = sortedByOrders
    .slice(0, peakCount)
    .map((h) => h.hour)
    .sort((a, b) => a - b);

  logger.info(
    `Forecast for zone ${zoneId} on ${date}: ${totalExpected} total orders, peaks at hours ${peakHours.join(", ")}`,
    "demandForecasting",
  );

  return {
    zoneId,
    date,
    hourlyDemand,
    peakHours,
    totalExpected,
  };
}

// ---------------------------------------------------------------------------
// Morocco Calendar Helpers
// ---------------------------------------------------------------------------

/**
 * Approximate Ramadan detection.
 *
 * Ramadan follows the Hijri calendar and shifts ~11 days earlier each
 * Gregorian year. This simplified check uses March-April as an approximate
 * window. A production system should use proper Hijri calendar conversion.
 *
 * Impact on delivery:
 * - Daytime demand drops significantly (fasting)
 * - Iftar time (sunset) creates the largest daily demand spike
 * - Late-night demand increases (suhoor meals, socializing)
 *
 * @param date - Date to check
 * @returns true if the date is approximately during Ramadan
 */
export function isRamadan(date: Date): boolean {
  const month = date.getMonth(); // 0-indexed: March=2, April=3
  return month === 2 || month === 3;
}

/**
 * Check if the given time falls during Friday prayer.
 *
 * Friday (Jumu'ah) prayer is the most important weekly religious observance
 * in Morocco. Between 12:00-14:00 on Fridays:
 * - Most businesses close temporarily
 * - Streets are quiet near mosques
 * - Delivery demand drops to near zero
 * - Many drivers are also at prayer
 *
 * @param date - Date/time to check
 * @returns true if during Friday prayer time
 */
export function isFridayPrayer(date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0=Sunday, 5=Friday
  if (dayOfWeek !== 5) return false;

  const hour = date.getHours();
  return hour >= 12 && hour < 14;
}

/**
 * Check if a date is a Moroccan national holiday.
 *
 * Only checks fixed-date secular holidays. Islamic holidays are not
 * included due to Hijri calendar variability.
 *
 * @param date - Date to check
 * @returns true if the date is a national holiday
 */
export function isMoroccanHoliday(date: Date): boolean {
  const month = date.getMonth() + 1; // Convert to 1-indexed
  const day = date.getDate();

  return MOROCCO_HOLIDAYS.some((h) => h.month === month && h.day === day);
}

// ---------------------------------------------------------------------------
// Time Period Multipliers
// ---------------------------------------------------------------------------

/**
 * Get the demand multiplier for a given time period.
 *
 * These multipliers represent how demand deviates from the baseline:
 * - 1.0 = average demand
 * - > 1.0 = above average (evening rush, midday lunch)
 * - < 1.0 = below average (night, afternoon lull, Friday prayer)
 *
 * The Ramadan iftar multiplier (2.5x) is the highest because the
 * entire country breaks fast simultaneously, creating a massive
 * synchronized demand spike.
 *
 * @param period - Time period classification
 * @returns Demand multiplier for the period
 */
export function getTimePeriodMultiplier(period: TimePeriod): number {
  return TIME_PERIOD_MULTIPLIERS[period];
}

// ---------------------------------------------------------------------------
// Weather Impact
// ---------------------------------------------------------------------------

/**
 * Calculate the impact of weather on delivery demand and driver supply.
 *
 * Weather affects both sides of the marketplace:
 *
 * Demand side:
 * - Bad weather increases demand (people don't want to go out)
 * - Extreme weather (sandstorm) decreases demand (even delivery is affected)
 *
 * Supply side:
 * - Almost all weather conditions reduce driver availability
 * - Motorcycle drivers (common in Morocco) are most affected by rain
 * - Extreme heat reduces willingness to work outdoors
 *
 * @param condition - Weather condition string
 * @returns Impact multipliers for demand and supply
 */
export function calculateWeatherImpact(condition: string): WeatherImpact {
  const normalized = condition.toLowerCase().replace(/\s+/g, "_");
  const impact = WEATHER_IMPACTS[normalized];

  if (!impact) {
    logger.warn(
      `Unknown weather condition: "${condition}", using clear defaults`,
      undefined,
      "demandForecasting",
    );
    return {
      condition,
      demandMultiplier: 1.0,
      supplyMultiplier: 1.0,
    };
  }

  return {
    condition,
    demandMultiplier: impact.demandMultiplier,
    supplyMultiplier: impact.supplyMultiplier,
  };
}

// ---------------------------------------------------------------------------
// Driver Incentives
// ---------------------------------------------------------------------------

/**
 * Suggest incentives to balance supply and demand in a zone.
 *
 * When driver supply is insufficient, the platform can offer incentives:
 * - Peak hour bonuses: Extra payment during high-demand periods
 * - Streak bonuses: Complete N consecutive deliveries for a bonus
 * - Zone bonuses: Extra payment for delivering in underserved areas
 * - Guarantee minimums: Promise minimum earnings per hour
 *
 * The suggestions are based on the current zone stats and time period.
 * The operations team reviews and activates them manually.
 *
 * @param zoneStats - Current zone demand/supply statistics
 * @param timePeriod - Current time period
 * @returns Array of suggested incentives
 */
export function suggestIncentives(
  zoneStats: ZoneStats,
  timePeriod: TimePeriod,
): IncentiveResult[] {
  const incentives: IncentiveResult[] = [];

  const ratio = calculateDemandSupplyRatio(
    zoneStats.activeOrders,
    zoneStats.availableDrivers,
  );

  // No incentives needed if supply is adequate
  if (ratio < 0.8) {
    return incentives;
  }

  // Peak hour bonus when demand is high
  if (ratio > 1.0 && (timePeriod === "evening_rush" || timePeriod === "midday")) {
    const bonusAmount = ratio > 2.0 ? 2000 : 1000; // 20 or 10 MAD
    incentives.push({
      type: "peak_hour_bonus",
      amount: bonusAmount,
      reason: `High demand during ${timePeriod.replace("_", " ")} in zone ${zoneStats.zoneId}`,
      eligibleDrivers: Math.max(
        Math.ceil(zoneStats.activeOrders - zoneStats.availableDrivers),
        1,
      ),
    });
  }

  // Zone bonus when wait times are high
  if (zoneStats.averageWaitMinutes > 20) {
    incentives.push({
      type: "zone_bonus",
      amount: 1500, // 15 MAD
      reason: `Long wait times (${Math.round(zoneStats.averageWaitMinutes)} min) in zone ${zoneStats.zoneId}`,
      eligibleDrivers: Math.max(
        Math.ceil(zoneStats.activeOrders * 0.5),
        1,
      ),
    });
  }

  // Streak bonus during extreme demand
  if (zoneStats.demandLevel === "extreme" || zoneStats.demandLevel === "very_high") {
    incentives.push({
      type: "streak_bonus",
      amount: 3000, // 30 MAD for completing 5 consecutive deliveries
      reason: `${zoneStats.demandLevel} demand requires sustained driver engagement`,
      eligibleDrivers: zoneStats.availableDrivers,
    });
  }

  // Ramadan iftar special bonus
  if (timePeriod === "ramadan_iftar") {
    incentives.push({
      type: "ramadan_bonus",
      amount: 2500, // 25 MAD
      reason: "Ramadan iftar surge requires maximum driver availability",
      eligibleDrivers: Math.max(
        Math.ceil(zoneStats.activeOrders * 0.75),
        1,
      ),
    });
  }

  // Minimum guarantee when demand is very high but drivers are scarce
  if (ratio > 1.5 && zoneStats.availableDrivers < 5) {
    incentives.push({
      type: "minimum_guarantee",
      amount: 8000, // 80 MAD/hour minimum
      reason: `Critical driver shortage (${zoneStats.availableDrivers} available) with ${zoneStats.activeOrders} orders`,
      eligibleDrivers: Math.max(
        Math.ceil(zoneStats.activeOrders - zoneStats.availableDrivers + 2),
        3,
      ),
    });
  }

  logger.info(
    `Suggested ${incentives.length} incentives for zone ${zoneStats.zoneId} (ratio: ${ratio.toFixed(2)})`,
    "demandForecasting",
  );

  return incentives;
}

// ---------------------------------------------------------------------------
// Driver Earnings
// ---------------------------------------------------------------------------

/**
 * Calculate the peak hour bonus for a driver's earnings.
 *
 * Peak hour bonuses are applied on top of base delivery earnings to
 * incentivize drivers to work during high-demand periods.
 *
 * Bonus rates by time period:
 * - evening_rush: +50% (highest regular demand)
 * - midday: +30% (lunch rush)
 * - ramadan_iftar: +75% (cultural significance + extreme demand)
 * - friday_prayer: +0% (no deliveries happening)
 * - morning_rush: +20% (moderate demand)
 * - afternoon: +0% (low demand)
 * - night: +25% (late-night premium for antisocial hours)
 *
 * @param baseEarnings - Base delivery earnings in centimes
 * @param timePeriod - Current time period
 * @returns Bonus amount in centimes
 */
export function calculatePeakHourBonus(
  baseEarnings: number,
  timePeriod: TimePeriod,
): number {
  const bonusRates: Record<TimePeriod, number> = {
    evening_rush: 0.5,
    midday: 0.3,
    ramadan_iftar: 0.75,
    friday_prayer: 0,
    morning_rush: 0.2,
    afternoon: 0,
    night: 0.25,
  };

  const rate = bonusRates[timePeriod];
  return Math.round(baseEarnings * rate);
}

/**
 * Estimate a driver's total earnings for a set of deliveries.
 *
 * Provides an earnings estimate based on:
 * - Number of deliveries completed
 * - Average distance per delivery
 * - Average surge multiplier during the period
 *
 * This is used for:
 * - Showing estimated earnings to drivers before they start a shift
 * - Calculating actual pay for completed delivery batches
 * - Driver acquisition marketing (show earning potential)
 *
 * Drivers earn:
 * 1. Base fee per delivery
 * 2. Per-km fee for each delivery
 * 3. Surge bonus (proportional to surge multiplier)
 *
 * The driver receives approximately 80% of the delivery fee
 * (the platform takes a 20% commission).
 *
 * @param deliveries - Number of deliveries
 * @param avgDistanceKm - Average distance per delivery in km
 * @param avgSurge - Average surge multiplier during the period
 * @returns Estimated total earnings in centimes
 */
export function estimateDriverEarnings(
  deliveries: number,
  avgDistanceKm: number,
  avgSurge: number,
): number {
  if (deliveries <= 0) return 0;

  const driverCommissionRate = 0.8; // Driver gets 80%

  let totalEarnings = 0;

  for (let i = 0; i < deliveries; i++) {
    const fee = calculateDeliveryFee(avgDistanceKm, avgSurge, false);
    totalEarnings += fee.totalFee;
  }

  const driverEarnings = Math.round(totalEarnings * driverCommissionRate);

  logger.info(
    `Estimated driver earnings: ${driverEarnings} centimes for ${deliveries} deliveries (avg ${avgDistanceKm}km, ${avgSurge}x surge)`,
    "demandForecasting",
  );

  return driverEarnings;
}

// ---------------------------------------------------------------------------
// Zone Summary
// ---------------------------------------------------------------------------

/**
 * Get an aggregate summary of demand across multiple delivery zones.
 *
 * Used by the operations dashboard to get a bird's-eye view of the
 * entire delivery network's health. Identifies critical zones that
 * need immediate attention (high wait times, extreme demand).
 *
 * @param zones - Array of zone statistics
 * @returns Aggregate summary with critical zone identification
 */
export function getZoneDemandSummary(zones: ZoneStats[]): {
  totalOrders: number;
  totalDrivers: number;
  avgWait: number;
  criticalZones: string[];
} {
  if (zones.length === 0) {
    return {
      totalOrders: 0,
      totalDrivers: 0,
      avgWait: 0,
      criticalZones: [],
    };
  }

  let totalOrders = 0;
  let totalDrivers = 0;
  let totalWaitWeighted = 0;
  const criticalZones: string[] = [];

  for (const zone of zones) {
    totalOrders += zone.activeOrders;
    totalDrivers += zone.availableDrivers;
    totalWaitWeighted += zone.averageWaitMinutes * zone.activeOrders;

    // A zone is critical if demand is very_high/extreme OR wait > 25 min
    if (
      zone.demandLevel === "extreme" ||
      zone.demandLevel === "very_high" ||
      zone.averageWaitMinutes > 25
    ) {
      criticalZones.push(zone.zoneId);
    }
  }

  const avgWait = totalOrders > 0
    ? Math.round((totalWaitWeighted / totalOrders) * 10) / 10
    : 0;

  return {
    totalOrders,
    totalDrivers,
    avgWait,
    criticalZones,
  };
}

// ---------------------------------------------------------------------------
// Advanced Forecasting Helpers
// ---------------------------------------------------------------------------

/**
 * Detect weekly seasonality patterns in historical data.
 *
 * Analyzes how demand varies by day of week. In Morocco:
 * - Friday: Lower midday demand (prayer), higher evening
 * - Saturday: Moderate (many people work half-day)
 * - Sunday: Higher than weekdays (family outings, restaurant visits)
 *
 * @param historicalData - At least 7 days of data (arrays of 24 hourly counts)
 * @returns Day-of-week multipliers (index 0 = Sunday)
 */
function detectWeeklyPattern(historicalData: number[][]): number[] {
  if (historicalData.length < 7) {
    return [1, 1, 1, 1, 1, 1, 1]; // Insufficient data
  }

  // Calculate total daily orders for each day
  const dailyTotals = historicalData.map((day) =>
    day.reduce((sum, hourCount) => sum + hourCount, 0),
  );

  // Overall average daily total
  const overallAvg =
    dailyTotals.reduce((sum, total) => sum + total, 0) / dailyTotals.length;

  if (overallAvg === 0) {
    return [1, 1, 1, 1, 1, 1, 1];
  }

  // Group by day of week (assuming first entry is a known day)
  // Since we don't know the start day, return uniform multipliers
  // In production, each data point would have a date attached
  const dayMultipliers = [1, 1, 1, 1, 1, 1, 1];

  // With 7+ days, we can compute per-day averages
  for (let dayIdx = 0; dayIdx < 7 && dayIdx < dailyTotals.length; dayIdx++) {
    const dayTotal = dailyTotals[dayIdx];
    if (dayTotal !== undefined) {
      dayMultipliers[dayIdx] = dayTotal / overallAvg;
    }
  }

  return dayMultipliers;
}

/**
 * Estimate the number of additional drivers needed to meet target wait times.
 *
 * Uses Little's Law: L = lambda * W
 * Where L = average customers in system, lambda = arrival rate, W = wait time
 *
 * To reduce wait time, we need to increase throughput (more drivers).
 *
 * @param currentOrders - Current active orders
 * @param currentDrivers - Current available drivers
 * @param currentWaitMinutes - Current average wait time
 * @param targetWaitMinutes - Desired average wait time
 * @returns Number of additional drivers needed (0 if already meeting target)
 */
function estimateDriversNeeded(
  currentOrders: number,
  currentDrivers: number,
  currentWaitMinutes: number,
  targetWaitMinutes: number,
): number {
  if (currentWaitMinutes <= targetWaitMinutes) return 0;
  if (currentOrders === 0) return 0;

  // Current throughput: orders served per minute per driver
  const throughputPerDriver = currentDrivers > 0
    ? currentOrders / (currentDrivers * currentWaitMinutes)
    : 0;

  if (throughputPerDriver <= 0) {
    // Cannot estimate without meaningful throughput data
    return Math.ceil(currentOrders * 0.5); // Rough heuristic: 50% of orders
  }

  // Required drivers = orders / (throughput_per_driver * target_wait)
  const requiredDrivers = currentOrders / (throughputPerDriver * targetWaitMinutes);
  const additionalDrivers = Math.ceil(requiredDrivers - currentDrivers);

  return Math.max(additionalDrivers, 0);
}

/**
 * Calculate expected revenue for a forecasted period.
 *
 * Uses demand forecast to estimate delivery fee revenue. Considers:
 * - Expected order volume per hour
 * - Average delivery distance
 * - Surge pricing during peak hours
 *
 * @param forecast - Daily demand forecast
 * @param avgDistanceKm - Average delivery distance
 * @returns Expected revenue in centimes
 */
function estimatePeriodRevenue(
  forecast: DemandForecast,
  avgDistanceKm: number,
): number {
  let totalRevenue = 0;

  for (const hourlyData of forecast.hourlyDemand) {
    const isPeak = forecast.peakHours.includes(hourlyData.hour);
    const surgeMultiplier = isPeak ? 1.3 : 1.0; // Conservative peak estimate

    const fee = calculateDeliveryFee(avgDistanceKm, surgeMultiplier, isPeak);
    totalRevenue += fee.totalFee * hourlyData.expectedOrders;
  }

  return totalRevenue;
}

/**
 * Analyze demand trends over multiple days.
 *
 * Determines if demand is growing, declining, or stable by comparing
 * recent averages to historical averages.
 *
 * @param historicalData - Daily order count arrays
 * @returns Trend analysis with direction and magnitude
 */
function analyzeDemandTrend(historicalData: number[][]): {
  direction: "growing" | "declining" | "stable";
  percentChange: number;
  recentAvg: number;
  historicalAvg: number;
} {
  if (historicalData.length < 4) {
    return {
      direction: "stable",
      percentChange: 0,
      recentAvg: 0,
      historicalAvg: 0,
    };
  }

  // Split into recent (last 25%) and historical (first 75%)
  const splitIndex = Math.floor(historicalData.length * 0.75);
  const historicalPortion = historicalData.slice(0, splitIndex);
  const recentPortion = historicalData.slice(splitIndex);

  const calcDailyAvg = (data: number[][]) => {
    if (data.length === 0) return 0;
    const dailyTotals = data.map((day) =>
      day.reduce((sum, h) => sum + h, 0),
    );
    return dailyTotals.reduce((sum, d) => sum + d, 0) / dailyTotals.length;
  };

  const historicalAvg = calcDailyAvg(historicalPortion);
  const recentAvg = calcDailyAvg(recentPortion);

  if (historicalAvg === 0) {
    return {
      direction: recentAvg > 0 ? "growing" : "stable",
      percentChange: recentAvg > 0 ? 100 : 0,
      recentAvg,
      historicalAvg,
    };
  }

  const percentChange = ((recentAvg - historicalAvg) / historicalAvg) * 100;

  let direction: "growing" | "declining" | "stable";
  if (percentChange > 5) {
    direction = "growing";
  } else if (percentChange < -5) {
    direction = "declining";
  } else {
    direction = "stable";
  }

  return {
    direction,
    percentChange: Math.round(percentChange * 10) / 10,
    recentAvg: Math.round(recentAvg * 10) / 10,
    historicalAvg: Math.round(historicalAvg * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Pricing Strategy Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate a dynamic minimum order value based on demand conditions.
 *
 * During very low demand periods, a higher minimum order value helps
 * ensure profitability per delivery. During high demand, the minimum
 * can be lowered to capture more orders.
 *
 * @param baseMOV - Base minimum order value in centimes
 * @param demandLevel - Current demand level
 * @returns Adjusted minimum order value in centimes
 */
function calculateDynamicMinOrder(
  baseMOV: number,
  demandLevel: DemandLevel,
): number {
  const adjustments: Record<DemandLevel, number> = {
    very_low: 1.5,   // Raise minimum during low demand
    low: 1.2,
    moderate: 1.0,    // Keep as-is
    high: 0.9,
    very_high: 0.8,   // Lower minimum to capture demand
    extreme: 0.7,
  };

  const multiplier = adjustments[demandLevel];
  return Math.round(baseMOV * multiplier);
}

/**
 * Determine if a promotion should be activated based on demand conditions.
 *
 * Low demand periods are good opportunities for promotions to drive orders.
 * High demand periods should not have promotions (they're not needed and
 * would reduce per-order revenue).
 *
 * @param demandLevel - Current demand level
 * @param timePeriod - Current time period
 * @returns Whether to activate demand-generation promotions
 */
function shouldActivatePromotion(
  demandLevel: DemandLevel,
  timePeriod: TimePeriod,
): { activate: boolean; reason: string } {
  // Never promote during already-high demand
  if (
    demandLevel === "high" ||
    demandLevel === "very_high" ||
    demandLevel === "extreme"
  ) {
    return {
      activate: false,
      reason: `Demand already ${demandLevel}, promotions not needed`,
    };
  }

  // Don't promote during Friday prayer (no one is ordering)
  if (timePeriod === "friday_prayer") {
    return {
      activate: false,
      reason: "Friday prayer period - market is inactive",
    };
  }

  // Promote during afternoon lull
  if (timePeriod === "afternoon" && (demandLevel === "very_low" || demandLevel === "low")) {
    return {
      activate: true,
      reason: "Afternoon lull with low demand - promotion can drive orders",
    };
  }

  // Promote during late night if demand is very low
  if (timePeriod === "night" && demandLevel === "very_low") {
    return {
      activate: true,
      reason: "Late night low demand - promotion can attract late-night orders",
    };
  }

  // General low demand promotion
  if (demandLevel === "very_low") {
    return {
      activate: true,
      reason: "Very low demand - promotion recommended to stimulate orders",
    };
  }

  return {
    activate: false,
    reason: "Current conditions do not warrant promotions",
  };
}

// ---------------------------------------------------------------------------
// Capacity Planning
// ---------------------------------------------------------------------------

/**
 * Calculate the optimal number of drivers for a zone at a given time.
 *
 * Uses the demand forecast and target service levels to determine
 * how many drivers should be online.
 *
 * Target: Each driver handles ~2-3 deliveries per hour in Morocco
 * (accounting for traffic, restaurant wait times, etc.)
 *
 * @param expectedOrders - Expected orders per hour
 * @param targetWaitMinutes - Target maximum wait time for customers
 * @returns Recommended number of active drivers
 */
function calculateOptimalDriverCount(
  expectedOrders: number,
  targetWaitMinutes: number = 15,
): number {
  if (expectedOrders === 0) return 0;

  // Average delivery time in Morocco: 30-40 minutes (including pickup)
  const avgDeliveryTimeMinutes = 35;

  // Each driver can complete ~1.7 deliveries per hour
  const deliveriesPerDriverPerHour = 60 / avgDeliveryTimeMinutes;

  // Need enough drivers to handle all orders within target wait time
  const driversForThroughput = Math.ceil(
    expectedOrders / deliveriesPerDriverPerHour,
  );

  // Add buffer for wait time target
  const waitBuffer = targetWaitMinutes < 15 ? 1.3 : 1.1;
  const adjustedDrivers = Math.ceil(driversForThroughput * waitBuffer);

  // Minimum 1 driver if any orders expected
  return Math.max(adjustedDrivers, 1);
}

/**
 * Generate a driver schedule recommendation for a full day.
 *
 * Creates a 24-hour staffing plan showing how many drivers should be
 * online each hour to meet service level targets.
 *
 * @param forecast - Daily demand forecast
 * @param targetWaitMinutes - Target wait time for customers
 * @returns Array of 24 recommended driver counts (index = hour)
 */
function generateDriverSchedule(
  forecast: DemandForecast,
  targetWaitMinutes: number = 15,
): number[] {
  const schedule: number[] = [];

  for (const hourData of forecast.hourlyDemand) {
    const drivers = calculateOptimalDriverCount(
      hourData.expectedOrders,
      targetWaitMinutes,
    );
    schedule.push(drivers);
  }

  return schedule;
}

// ---------------------------------------------------------------------------
// Export internal helpers for testing
// ---------------------------------------------------------------------------

export {
  detectWeeklyPattern,
  estimateDriversNeeded,
  estimatePeriodRevenue,
  analyzeDemandTrend,
  calculateDynamicMinOrder,
  shouldActivatePromotion,
  calculateOptimalDriverCount,
  generateDriverSchedule,
};
