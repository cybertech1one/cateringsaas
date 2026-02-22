/**
 * Incentive Engine — Quests, Bonuses, Streaks & Budget Management
 *
 * Driver incentive system: quests, peak hour bonuses, weather bonuses,
 * streak bonuses, zone incentives, budget caps, and Ramadan iftar bonuses.
 *
 * Morocco-specific: Ramadan schedule, Friday prayer, city-based incentives.
 *
 * ZERO external dependencies. Pure functions only.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IncentiveType =
  | "quest"
  | "peak_hour"
  | "weather"
  | "streak"
  | "zone"
  | "ramadan"
  | "referral"
  | "milestone"
  | "first_delivery"
  | "comeback";

export type QuestStatus = "available" | "in_progress" | "completed" | "expired" | "claimed";

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "light_rain"
  | "heavy_rain"
  | "sandstorm"
  | "extreme_heat";

export interface Quest {
  id: string;
  type: IncentiveType;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  rewardCentimes: number;
  expiresAt: number;
  status: QuestStatus;
  conditions: QuestCondition[];
}

export interface QuestCondition {
  type: "min_deliveries" | "min_rating" | "zone" | "time_window" | "consecutive";
  value: string | number;
}

export interface PeakHourBonus {
  startHour: number;
  endHour: number;
  multiplier: number;
  bonusCentimes: number;
  isActive: boolean;
}

export interface WeatherBonus {
  condition: WeatherCondition;
  bonusCentimes: number;
  multiplier: number;
  active: boolean;
}

export interface StreakBonus {
  currentStreak: number;
  bonusCentimes: number;
  multiplier: number;
  nextMilestone: number;
  nextMilestoneBonus: number;
}

export interface ZoneIncentive {
  zoneId: string;
  zoneName: string;
  bonusCentimes: number;
  multiplier: number;
  reason: string;
  validUntil: number;
}

export interface IncentiveResult {
  type: IncentiveType;
  amount: number;
  reason: string;
}

export interface IncentiveBudget {
  dailyBudgetCentimes: number;
  spentTodayCentimes: number;
  remainingCentimes: number;
  utilizationPercent: number;
  isExhausted: boolean;
}

export interface DriverIncentiveSummary {
  driverId: string;
  activeQuests: Quest[];
  currentStreak: number;
  todayEarnings: number;
  todayBonuses: number;
  availableIncentives: IncentiveResult[];
  totalIncentivesClaimed: number;
}

export interface RamadanIftarBonus {
  isActive: boolean;
  startHour: number;
  endHour: number;
  bonusCentimes: number;
  multiplier: number;
}

export interface MilestoneReward {
  milestone: number;
  rewardCentimes: number;
  title: string;
  claimed: boolean;
}

export interface IncentiveCampaign {
  id: string;
  name: string;
  type: IncentiveType;
  startDate: number;
  endDate: number;
  budgetCentimes: number;
  spentCentimes: number;
  isActive: boolean;
  targetZones: string[];
  rewards: IncentiveResult[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PEAK_HOURS: PeakHourBonus[] = [
  { startHour: 11, endHour: 14, multiplier: 1.3, bonusCentimes: 300, isActive: true },
  { startHour: 18, endHour: 22, multiplier: 1.5, bonusCentimes: 500, isActive: true },
];

const WEATHER_BONUSES: Record<WeatherCondition, WeatherBonus> = {
  clear: { condition: "clear", bonusCentimes: 0, multiplier: 1.0, active: false },
  cloudy: { condition: "cloudy", bonusCentimes: 0, multiplier: 1.0, active: false },
  light_rain: { condition: "light_rain", bonusCentimes: 300, multiplier: 1.2, active: true },
  heavy_rain: { condition: "heavy_rain", bonusCentimes: 700, multiplier: 1.5, active: true },
  sandstorm: { condition: "sandstorm", bonusCentimes: 1000, multiplier: 1.8, active: true },
  extreme_heat: { condition: "extreme_heat", bonusCentimes: 500, multiplier: 1.3, active: true },
};

const STREAK_MILESTONES = [
  { count: 5, bonus: 500, label: "5 in a row" },
  { count: 10, bonus: 1500, label: "10 streak" },
  { count: 20, bonus: 4000, label: "20 streak" },
  { count: 50, bonus: 15000, label: "50 marathon" },
  { count: 100, bonus: 50000, label: "Century" },
];

const DELIVERY_MILESTONES: MilestoneReward[] = [
  { milestone: 10, rewardCentimes: 2000, title: "First 10 Deliveries", claimed: false },
  { milestone: 50, rewardCentimes: 5000, title: "Half Century", claimed: false },
  { milestone: 100, rewardCentimes: 10000, title: "Century Mark", claimed: false },
  { milestone: 500, rewardCentimes: 30000, title: "500 Club", claimed: false },
  { milestone: 1000, rewardCentimes: 75000, title: "1000 Legend", claimed: false },
  { milestone: 5000, rewardCentimes: 250000, title: "Elite 5000", claimed: false },
];

const DEFAULT_DAILY_BUDGET = 5000000; // 50,000 MAD total daily incentive budget

const RAMADAN_IFTAR_CONFIG: RamadanIftarBonus = {
  isActive: false,
  startHour: 17,
  endHour: 21,
  bonusCentimes: 800,
  multiplier: 1.6,
};

const FIRST_DELIVERY_BONUS = 2000; // 20 MAD
const COMEBACK_BONUS = 1500; // 15 MAD (for drivers returning after 7+ days)
const REFERRAL_BONUS = 5000; // 50 MAD per referred driver

// ---------------------------------------------------------------------------
// Peak Hour Bonuses
// ---------------------------------------------------------------------------

/**
 * Check if the current hour qualifies for a peak bonus.
 */
export function getPeakHourBonus(hour: number): PeakHourBonus | null {
  for (const peak of PEAK_HOURS) {
    if (hour >= peak.startHour && hour < peak.endHour && peak.isActive) {
      return peak;
    }
  }
  return null;
}

/**
 * Calculate peak hour bonus for a delivery.
 */
export function calculatePeakBonus(
  basePayCentimes: number,
  hour: number,
): { bonus: number; multiplier: number; isPeak: boolean } {
  const peak = getPeakHourBonus(hour);
  if (!peak) {
    return { bonus: 0, multiplier: 1.0, isPeak: false };
  }

  const bonus = peak.bonusCentimes + Math.round(basePayCentimes * (peak.multiplier - 1));
  return { bonus, multiplier: peak.multiplier, isPeak: true };
}

// ---------------------------------------------------------------------------
// Weather Bonuses
// ---------------------------------------------------------------------------

/**
 * Get the weather bonus for current conditions.
 */
export function getWeatherBonus(condition: WeatherCondition): WeatherBonus {
  return WEATHER_BONUSES[condition] ?? WEATHER_BONUSES.clear;
}

/**
 * Calculate weather bonus for a delivery.
 */
export function calculateWeatherBonus(
  basePayCentimes: number,
  condition: WeatherCondition,
): { bonus: number; multiplier: number } {
  const weatherBonus = getWeatherBonus(condition);
  if (!weatherBonus.active) {
    return { bonus: 0, multiplier: 1.0 };
  }

  const bonus =
    weatherBonus.bonusCentimes +
    Math.round(basePayCentimes * (weatherBonus.multiplier - 1));
  return { bonus, multiplier: weatherBonus.multiplier };
}

// ---------------------------------------------------------------------------
// Streak Bonuses
// ---------------------------------------------------------------------------

/**
 * Calculate the streak bonus for a consecutive delivery count.
 */
export function calculateStreakBonus(consecutiveDeliveries: number): StreakBonus {
  let currentBonus = 0;
  let currentMultiplier = 1.0;

  for (const milestone of STREAK_MILESTONES) {
    if (consecutiveDeliveries >= milestone.count) {
      currentBonus = milestone.bonus;
      currentMultiplier = 1 + milestone.count * 0.01;
    }
  }

  // Find next milestone
  const nextMilestone = STREAK_MILESTONES.find(
    (m) => m.count > consecutiveDeliveries,
  );

  return {
    currentStreak: consecutiveDeliveries,
    bonusCentimes: currentBonus,
    multiplier: Math.round(currentMultiplier * 100) / 100,
    nextMilestone: nextMilestone?.count ?? 0,
    nextMilestoneBonus: nextMilestone?.bonus ?? 0,
  };
}

/**
 * Check if a streak was broken (gap in deliveries).
 */
export function isStreakBroken(
  lastDeliveryTime: number,
  maxGapHours: number = 12,
  now: number = Date.now(),
): boolean {
  const gapMs = now - lastDeliveryTime;
  const gapHours = gapMs / (60 * 60 * 1000);
  return gapHours > maxGapHours;
}

// ---------------------------------------------------------------------------
// Zone Incentives
// ---------------------------------------------------------------------------

/**
 * Generate zone incentives based on demand levels.
 */
export function generateZoneIncentives(
  zones: Array<{
    zoneId: string;
    zoneName: string;
    demandLevel: "low" | "medium" | "high" | "critical";
    driverCount: number;
  }>,
  validDurationMinutes: number = 30,
  now: number = Date.now(),
): ZoneIncentive[] {
  return zones
    .filter((z) => z.demandLevel === "high" || z.demandLevel === "critical")
    .map((z) => {
      const isCritical = z.demandLevel === "critical";
      return {
        zoneId: z.zoneId,
        zoneName: z.zoneName,
        bonusCentimes: isCritical ? 1000 : 500,
        multiplier: isCritical ? 1.5 : 1.2,
        reason: `${z.demandLevel} demand in ${z.zoneName} (${z.driverCount} drivers available)`,
        validUntil: now + validDurationMinutes * 60 * 1000,
      };
    });
}

/**
 * Check if a zone incentive is still valid.
 */
export function isZoneIncentiveValid(
  incentive: ZoneIncentive,
  now: number = Date.now(),
): boolean {
  return now < incentive.validUntil;
}

// ---------------------------------------------------------------------------
// Ramadan Iftar Bonuses
// ---------------------------------------------------------------------------

/**
 * Check if Ramadan iftar bonus is active at the given time.
 */
export function isRamadanIftarActive(
  hour: number,
  isRamadan: boolean,
): boolean {
  if (!isRamadan) return false;
  return hour >= RAMADAN_IFTAR_CONFIG.startHour && hour < RAMADAN_IFTAR_CONFIG.endHour;
}

/**
 * Calculate Ramadan iftar bonus.
 */
export function calculateRamadanBonus(
  basePayCentimes: number,
  hour: number,
  isRamadan: boolean,
): { bonus: number; multiplier: number; isActive: boolean } {
  if (!isRamadanIftarActive(hour, isRamadan)) {
    return { bonus: 0, multiplier: 1.0, isActive: false };
  }

  const bonus =
    RAMADAN_IFTAR_CONFIG.bonusCentimes +
    Math.round(basePayCentimes * (RAMADAN_IFTAR_CONFIG.multiplier - 1));

  return {
    bonus,
    multiplier: RAMADAN_IFTAR_CONFIG.multiplier,
    isActive: true,
  };
}

// ---------------------------------------------------------------------------
// Quest Management
// ---------------------------------------------------------------------------

/**
 * Create a new quest for a driver.
 */
export function createQuest(
  id: string,
  type: IncentiveType,
  title: string,
  description: string,
  targetCount: number,
  rewardCentimes: number,
  durationHours: number,
  conditions: QuestCondition[] = [],
  now: number = Date.now(),
): Quest {
  return {
    id,
    type,
    title,
    description,
    targetCount,
    currentCount: 0,
    rewardCentimes,
    expiresAt: now + durationHours * 60 * 60 * 1000,
    status: "available",
    conditions,
  };
}

/**
 * Update quest progress.
 */
export function updateQuestProgress(
  quest: Quest,
  increment: number = 1,
  now: number = Date.now(),
): Quest {
  if (quest.status === "completed" || quest.status === "expired" || quest.status === "claimed") {
    return quest;
  }

  if (now > quest.expiresAt) {
    return { ...quest, status: "expired" };
  }

  const newCount = Math.min(quest.targetCount, quest.currentCount + increment);
  const newStatus: QuestStatus =
    newCount >= quest.targetCount ? "completed" : "in_progress";

  return {
    ...quest,
    currentCount: newCount,
    status: newStatus,
  };
}

/**
 * Claim a completed quest reward.
 */
export function claimQuestReward(quest: Quest): {
  success: boolean;
  rewardCentimes: number;
  message: string;
} {
  if (quest.status !== "completed") {
    return {
      success: false,
      rewardCentimes: 0,
      message: `Quest is ${quest.status}, not completed`,
    };
  }

  return {
    success: true,
    rewardCentimes: quest.rewardCentimes,
    message: `Claimed ${quest.rewardCentimes} centimes for "${quest.title}"`,
  };
}

/**
 * Generate daily quests for a driver.
 */
export function generateDailyQuests(
  driverId: string,
  totalDeliveries: number,
  now: number = Date.now(),
): Quest[] {
  const quests: Quest[] = [];
  const hoursUntilMidnight = 24 - new Date(now).getHours();

  // Basic delivery quest
  quests.push(
    createQuest(
      `daily-${driverId}-deliveries-${new Date(now).toISOString().slice(0, 10)}`,
      "quest",
      "Daily Deliveries",
      "Complete 5 deliveries today",
      5,
      1500,
      hoursUntilMidnight,
      [{ type: "min_deliveries", value: 5 }],
      now,
    ),
  );

  // Peak hour quest
  quests.push(
    createQuest(
      `daily-${driverId}-peak-${new Date(now).toISOString().slice(0, 10)}`,
      "peak_hour",
      "Peak Performer",
      "Complete 3 deliveries during peak hours",
      3,
      2000,
      hoursUntilMidnight,
      [{ type: "time_window", value: "peak" }],
      now,
    ),
  );

  // Rating quest (for experienced drivers)
  if (totalDeliveries >= 20) {
    quests.push(
      createQuest(
        `daily-${driverId}-rating-${new Date(now).toISOString().slice(0, 10)}`,
        "quest",
        "5-Star Sprint",
        "Get 3 five-star ratings today",
        3,
        2500,
        hoursUntilMidnight,
        [{ type: "min_rating", value: 5 }],
        now,
      ),
    );
  }

  return quests;
}

// ---------------------------------------------------------------------------
// Milestone Rewards
// ---------------------------------------------------------------------------

/**
 * Check for milestone achievements.
 */
export function checkMilestones(
  totalDeliveries: number,
  claimedMilestones: number[],
): MilestoneReward[] {
  return DELIVERY_MILESTONES.filter(
    (m) =>
      totalDeliveries >= m.milestone && !claimedMilestones.includes(m.milestone),
  ).map((m) => ({ ...m }));
}

/**
 * Get all milestone configurations.
 */
export function getMilestoneConfig(): MilestoneReward[] {
  return DELIVERY_MILESTONES.map((m) => ({ ...m }));
}

// ---------------------------------------------------------------------------
// Budget Management
// ---------------------------------------------------------------------------

/**
 * Check the incentive budget status.
 */
export function checkBudget(
  spentCentimes: number,
  dailyBudgetCentimes: number = DEFAULT_DAILY_BUDGET,
): IncentiveBudget {
  const remaining = Math.max(0, dailyBudgetCentimes - spentCentimes);
  const utilization =
    dailyBudgetCentimes > 0
      ? Math.round((spentCentimes / dailyBudgetCentimes) * 10000) / 100
      : 0;

  return {
    dailyBudgetCentimes,
    spentTodayCentimes: spentCentimes,
    remainingCentimes: remaining,
    utilizationPercent: utilization,
    isExhausted: remaining <= 0,
  };
}

/**
 * Apply budget cap to an incentive amount.
 */
export function applyBudgetCap(
  incentiveAmount: number,
  budget: IncentiveBudget,
): { cappedAmount: number; wasCapped: boolean } {
  if (budget.isExhausted) {
    return { cappedAmount: 0, wasCapped: incentiveAmount > 0 };
  }

  if (incentiveAmount > budget.remainingCentimes) {
    return {
      cappedAmount: budget.remainingCentimes,
      wasCapped: true,
    };
  }

  return { cappedAmount: incentiveAmount, wasCapped: false };
}

// ---------------------------------------------------------------------------
// Composite Incentive Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate all applicable incentives for a single delivery.
 */
export function calculateDeliveryIncentives(
  basePayCentimes: number,
  hour: number,
  weatherCondition: WeatherCondition,
  consecutiveDeliveries: number,
  isRamadan: boolean,
  zoneIncentive: ZoneIncentive | null,
): {
  incentives: IncentiveResult[];
  totalBonus: number;
  effectiveMultiplier: number;
} {
  const incentives: IncentiveResult[] = [];
  let totalBonus = 0;

  // Peak hour
  const peak = calculatePeakBonus(basePayCentimes, hour);
  if (peak.isPeak) {
    incentives.push({
      type: "peak_hour",
      amount: peak.bonus,
      reason: `Peak hour bonus (${peak.multiplier}x)`,
    });
    totalBonus += peak.bonus;
  }

  // Weather
  const weather = calculateWeatherBonus(basePayCentimes, weatherCondition);
  if (weather.bonus > 0) {
    incentives.push({
      type: "weather",
      amount: weather.bonus,
      reason: `Weather bonus for ${weatherCondition} (${weather.multiplier}x)`,
    });
    totalBonus += weather.bonus;
  }

  // Streak
  const streak = calculateStreakBonus(consecutiveDeliveries);
  if (streak.bonusCentimes > 0) {
    incentives.push({
      type: "streak",
      amount: streak.bonusCentimes,
      reason: `${consecutiveDeliveries}-delivery streak bonus`,
    });
    totalBonus += streak.bonusCentimes;
  }

  // Ramadan
  const ramadan = calculateRamadanBonus(basePayCentimes, hour, isRamadan);
  if (ramadan.isActive) {
    incentives.push({
      type: "ramadan",
      amount: ramadan.bonus,
      reason: `Ramadan iftar rush bonus (${ramadan.multiplier}x)`,
    });
    totalBonus += ramadan.bonus;
  }

  // Zone
  if (zoneIncentive) {
    incentives.push({
      type: "zone",
      amount: zoneIncentive.bonusCentimes,
      reason: zoneIncentive.reason,
    });
    totalBonus += zoneIncentive.bonusCentimes;
  }

  const effectiveMultiplier =
    basePayCentimes > 0
      ? Math.round(((basePayCentimes + totalBonus) / basePayCentimes) * 100) / 100
      : 1;

  return { incentives, totalBonus, effectiveMultiplier };
}

// ---------------------------------------------------------------------------
// Special Bonuses
// ---------------------------------------------------------------------------

/**
 * Get first delivery bonus for new drivers.
 */
export function getFirstDeliveryBonus(): IncentiveResult {
  return {
    type: "first_delivery",
    amount: FIRST_DELIVERY_BONUS,
    reason: "Welcome bonus for your first delivery!",
  };
}

/**
 * Get comeback bonus for returning drivers.
 */
export function getComebackBonus(
  lastActiveTimestamp: number,
  minDaysAway: number = 7,
  now: number = Date.now(),
): IncentiveResult | null {
  const daysSinceActive = (now - lastActiveTimestamp) / (24 * 60 * 60 * 1000);
  if (daysSinceActive < minDaysAway) return null;

  return {
    type: "comeback",
    amount: COMEBACK_BONUS,
    reason: `Welcome back! Bonus for returning after ${Math.floor(daysSinceActive)} days`,
  };
}

/**
 * Get referral bonus amount.
 */
export function getReferralBonus(): IncentiveResult {
  return {
    type: "referral",
    amount: REFERRAL_BONUS,
    reason: "Referral bonus for bringing a new driver to the platform",
  };
}

// ---------------------------------------------------------------------------
// Campaign Management
// ---------------------------------------------------------------------------

/**
 * Create an incentive campaign.
 */
export function createCampaign(
  id: string,
  name: string,
  type: IncentiveType,
  budgetCentimes: number,
  startDate: number,
  endDate: number,
  targetZones: string[] = [],
): IncentiveCampaign {
  return {
    id,
    name,
    type,
    startDate,
    endDate,
    budgetCentimes,
    spentCentimes: 0,
    isActive: true,
    targetZones,
    rewards: [],
  };
}

/**
 * Check if a campaign is currently active.
 */
export function isCampaignActive(
  campaign: IncentiveCampaign,
  now: number = Date.now(),
): boolean {
  return (
    campaign.isActive &&
    now >= campaign.startDate &&
    now <= campaign.endDate &&
    campaign.spentCentimes < campaign.budgetCentimes
  );
}

/**
 * Record spending against a campaign.
 */
export function recordCampaignSpend(
  campaign: IncentiveCampaign,
  amount: number,
): IncentiveCampaign {
  const newSpent = campaign.spentCentimes + amount;
  return {
    ...campaign,
    spentCentimes: newSpent,
    isActive: newSpent < campaign.budgetCentimes,
  };
}

// ---------------------------------------------------------------------------
// Driver Incentive Summary
// ---------------------------------------------------------------------------

/**
 * Generate a full incentive summary for a driver.
 */
export function generateDriverIncentiveSummary(
  driverId: string,
  activeQuests: Quest[],
  consecutiveDeliveries: number,
  todayEarnings: number,
  todayBonuses: number,
  totalClaimed: number,
  hour: number,
  weatherCondition: WeatherCondition,
  isRamadan: boolean,
): DriverIncentiveSummary {
  const availableIncentives: IncentiveResult[] = [];

  // Check peak hour
  const peak = getPeakHourBonus(hour);
  if (peak) {
    availableIncentives.push({
      type: "peak_hour",
      amount: peak.bonusCentimes,
      reason: `Peak hour active (${peak.startHour}:00-${peak.endHour}:00)`,
    });
  }

  // Check weather
  const weather = getWeatherBonus(weatherCondition);
  if (weather.active) {
    availableIncentives.push({
      type: "weather",
      amount: weather.bonusCentimes,
      reason: `${weatherCondition} weather bonus`,
    });
  }

  // Check Ramadan
  if (isRamadanIftarActive(hour, isRamadan)) {
    availableIncentives.push({
      type: "ramadan",
      amount: RAMADAN_IFTAR_CONFIG.bonusCentimes,
      reason: "Ramadan iftar rush bonus",
    });
  }

  return {
    driverId,
    activeQuests: activeQuests.filter(
      (q) => q.status === "available" || q.status === "in_progress",
    ),
    currentStreak: consecutiveDeliveries,
    todayEarnings,
    todayBonuses,
    availableIncentives,
    totalIncentivesClaimed: totalClaimed,
  };
}

// ---------------------------------------------------------------------------
// Configuration Exports
// ---------------------------------------------------------------------------

/**
 * Get peak hour configurations.
 */
export function getPeakHourConfig(): PeakHourBonus[] {
  return PEAK_HOURS.map((p) => ({ ...p }));
}

/**
 * Get weather bonus configurations.
 */
export function getWeatherBonusConfig(): Record<WeatherCondition, WeatherBonus> {
  const config: Record<string, WeatherBonus> = {};
  for (const [key, value] of Object.entries(WEATHER_BONUSES)) {
    config[key] = { ...value };
  }
  return config as Record<WeatherCondition, WeatherBonus>;
}

/**
 * Get streak milestone configurations.
 */
export function getStreakMilestoneConfig(): typeof STREAK_MILESTONES {
  return STREAK_MILESTONES.map((m) => ({ ...m }));
}

/**
 * Get Ramadan iftar bonus configuration.
 */
export function getRamadanConfig(): RamadanIftarBonus {
  return { ...RAMADAN_IFTAR_CONFIG };
}
