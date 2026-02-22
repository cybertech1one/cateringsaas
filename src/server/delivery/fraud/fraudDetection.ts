/**
 * Sentinel Fraud Detection System
 *
 * GPS spoofing detection, delivery verification, cash audit,
 * collusion detection, device risk assessment, and driver blocking.
 *
 * Morocco-specific: COD cash handling, medina GPS accuracy adjustments.
 *
 * ZERO external dependencies. Pure functions only.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface GpsReading {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  speed: number;
  altitude: number;
  provider: string;
}

export interface SpoofingResult {
  isSpoofed: boolean;
  confidence: number;
  indicators: string[];
  severity: AlertSeverity;
}

export interface DeliveryVerification {
  isVerified: boolean;
  issues: string[];
  distanceFromDropoff: number;
  timeAtDropoff: number;
  photoVerified: boolean;
}

export interface CashAuditResult {
  isClean: boolean;
  discrepancyCentimes: number;
  alerts: string[];
  shortages: number;
  overages: number;
  reconciliationRate: number;
}

export interface CollusionResult {
  isCollusion: boolean;
  confidence: number;
  patterns: string[];
  involvedIds: string[];
}

export interface DeviceRiskResult {
  riskLevel: AlertSeverity;
  score: number;
  flags: string[];
  isEmulator: boolean;
  isMockLocation: boolean;
  isRooted: boolean;
}

export interface FraudAlert {
  type: string;
  severity: AlertSeverity;
  message: string;
}

export interface FraudAssessmentResult {
  driverId: string;
  overallScore: number;
  alerts: FraudAlert[];
  shouldBlock: boolean;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GPS_SPOOFING_THRESHOLDS = {
  maxSpeedKmh: 200,
  minAccuracyMeters: 5,
  maxTeleportDistanceKm: 5,
  maxTeleportTimeSeconds: 60,
  minReadingsForAnalysis: 3,
  suspiciousAccuracyMeters: 1,
  suspiciousAltitudeChangeM: 500,
} as const;

const DELIVERY_VERIFICATION_THRESHOLDS = {
  maxDistanceFromDropoffKm: 0.5,
  minTimeAtDropoffSeconds: 30,
  maxTimeAtDropoffSeconds: 1800,
} as const;

const CASH_AUDIT_THRESHOLDS = {
  maxDiscrepancyCentimes: 500,
  maxShortages: 3,
  minReconciliationRate: 95,
} as const;

const COLLUSION_THRESHOLDS = {
  minSharedOrders: 5,
  maxTimeBetweenHandoffs: 300,
  suspiciousPatternCount: 3,
} as const;

const FRAUD_BLOCK_THRESHOLD = 75;

const SEVERITY_SCORES: Record<AlertSeverity, number> = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 50,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------------------------------------------------------------------------
// GPS Spoofing Detection
// ---------------------------------------------------------------------------

/**
 * Detect GPS spoofing from a sequence of readings.
 */
export function detectGpsSpoofing(readings: GpsReading[]): SpoofingResult {
  const indicators: string[] = [];
  let suspicionScore = 0;

  if (readings.length < GPS_SPOOFING_THRESHOLDS.minReadingsForAnalysis) {
    return {
      isSpoofed: false,
      confidence: 0,
      indicators: ["Insufficient readings for analysis"],
      severity: "low",
    };
  }

  // Check for mock location provider
  const mockProviders = readings.filter(
    (r) => r.provider === "mock" || r.provider === "fused_mock",
  );
  if (mockProviders.length > 0) {
    indicators.push(
      `Mock location provider detected in ${mockProviders.length} readings`,
    );
    suspicionScore += 40;
  }

  // Check for impossibly perfect accuracy
  const perfectAccuracy = readings.filter(
    (r) => r.accuracy < GPS_SPOOFING_THRESHOLDS.suspiciousAccuracyMeters,
  );
  if (perfectAccuracy.length > readings.length * 0.5) {
    indicators.push(
      `Suspiciously perfect accuracy (< ${GPS_SPOOFING_THRESHOLDS.suspiciousAccuracyMeters}m) in ${perfectAccuracy.length}/${readings.length} readings`,
    );
    suspicionScore += 20;
  }

  // Check for teleportation (impossible speed between consecutive readings)
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1]!;
    const curr = readings[i]!;
    const timeDiffS = (curr.timestamp - prev.timestamp) / 1000;
    if (timeDiffS <= 0) continue;

    const distKm = haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    const speedKmh = (distKm / timeDiffS) * 3600;

    if (speedKmh > GPS_SPOOFING_THRESHOLDS.maxSpeedKmh) {
      indicators.push(
        `Impossible speed: ${speedKmh.toFixed(0)} km/h between readings`,
      );
      suspicionScore += 30;
    }

    if (
      distKm > GPS_SPOOFING_THRESHOLDS.maxTeleportDistanceKm &&
      timeDiffS < GPS_SPOOFING_THRESHOLDS.maxTeleportTimeSeconds
    ) {
      indicators.push(
        `Teleportation: ${distKm.toFixed(2)} km in ${timeDiffS.toFixed(0)}s`,
      );
      suspicionScore += 40;
    }
  }

  // Check for altitude anomalies
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1]!;
    const curr = readings[i]!;
    const altChange = Math.abs(curr.altitude - prev.altitude);
    if (altChange > GPS_SPOOFING_THRESHOLDS.suspiciousAltitudeChangeM) {
      indicators.push(
        `Altitude jump: ${altChange.toFixed(0)}m between readings`,
      );
      suspicionScore += 15;
    }
  }

  // Check for zero speed with position changes
  const zeroSpeedWithMovement = readings.filter((r, i) => {
    if (i === 0) return false;
    const prev = readings[i - 1]!;
    const dist = haversineDistance(prev.lat, prev.lng, r.lat, r.lng);
    return r.speed === 0 && dist > 0.1;
  });
  if (zeroSpeedWithMovement.length > 2) {
    indicators.push(
      `Zero speed with position changes in ${zeroSpeedWithMovement.length} readings`,
    );
    suspicionScore += 15;
  }

  const confidence = Math.min(100, suspicionScore);
  const isSpoofed = confidence >= 50;

  let severity: AlertSeverity = "low";
  if (confidence >= 80) severity = "critical";
  else if (confidence >= 60) severity = "high";
  else if (confidence >= 40) severity = "medium";

  if (isSpoofed) {
    logger.info(
      `GPS spoofing detected: confidence=${confidence}%, indicators=${indicators.length}`,
      "Sentinel",
    );
  }

  return { isSpoofed, confidence, indicators, severity };
}

// ---------------------------------------------------------------------------
// Delivery Verification
// ---------------------------------------------------------------------------

/**
 * Verify that a delivery was actually completed at the dropoff location.
 */
export function verifyDelivery(
  driverLat: number,
  driverLng: number,
  dropoffLat: number,
  dropoffLng: number,
  timeAtLocationSeconds: number,
  hasPhoto: boolean,
): DeliveryVerification {
  const issues: string[] = [];
  const distance = haversineDistance(driverLat, driverLng, dropoffLat, dropoffLng);

  if (distance > DELIVERY_VERIFICATION_THRESHOLDS.maxDistanceFromDropoffKm) {
    issues.push(
      `Driver ${(distance * 1000).toFixed(0)}m from dropoff (max ${DELIVERY_VERIFICATION_THRESHOLDS.maxDistanceFromDropoffKm * 1000}m)`,
    );
  }

  if (timeAtLocationSeconds < DELIVERY_VERIFICATION_THRESHOLDS.minTimeAtDropoffSeconds) {
    issues.push(
      `Only ${timeAtLocationSeconds}s at dropoff (min ${DELIVERY_VERIFICATION_THRESHOLDS.minTimeAtDropoffSeconds}s)`,
    );
  }

  if (timeAtLocationSeconds > DELIVERY_VERIFICATION_THRESHOLDS.maxTimeAtDropoffSeconds) {
    issues.push(
      `${timeAtLocationSeconds}s at dropoff is unusually long (max ${DELIVERY_VERIFICATION_THRESHOLDS.maxTimeAtDropoffSeconds}s)`,
    );
  }

  return {
    isVerified: issues.length === 0,
    issues,
    distanceFromDropoff: Math.round(distance * 1000),
    timeAtDropoff: timeAtLocationSeconds,
    photoVerified: hasPhoto,
  };
}

// ---------------------------------------------------------------------------
// Cash Audit
// ---------------------------------------------------------------------------

/**
 * Audit a driver's cash handling for COD deliveries.
 */
export function auditCashHandling(
  expectedCentimes: number,
  collectedCentimes: number,
  remittedCentimes: number,
  totalTransactions: number,
  shortageCount: number,
): CashAuditResult {
  const alerts: string[] = [];
  const discrepancy = collectedCentimes - remittedCentimes;

  if (Math.abs(discrepancy) > CASH_AUDIT_THRESHOLDS.maxDiscrepancyCentimes) {
    alerts.push(
      `Cash discrepancy: ${Math.abs(discrepancy)} centimes (${discrepancy > 0 ? "shortage" : "overage"})`,
    );
  }

  if (shortageCount > CASH_AUDIT_THRESHOLDS.maxShortages) {
    alerts.push(
      `${shortageCount} cash shortages (max ${CASH_AUDIT_THRESHOLDS.maxShortages})`,
    );
  }

  const reconciliationRate =
    totalTransactions > 0
      ? ((totalTransactions - shortageCount) / totalTransactions) * 100
      : 100;

  if (reconciliationRate < CASH_AUDIT_THRESHOLDS.minReconciliationRate) {
    alerts.push(
      `Reconciliation rate ${reconciliationRate.toFixed(1)}% below ${CASH_AUDIT_THRESHOLDS.minReconciliationRate}%`,
    );
  }

  const overExpected = collectedCentimes - expectedCentimes;
  if (overExpected > CASH_AUDIT_THRESHOLDS.maxDiscrepancyCentimes) {
    alerts.push(`Collected ${overExpected} centimes more than expected`);
  }

  return {
    isClean: alerts.length === 0,
    discrepancyCentimes: discrepancy,
    alerts,
    shortages: shortageCount,
    overages: discrepancy < 0 ? Math.abs(discrepancy) : 0,
    reconciliationRate: Math.round(reconciliationRate * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Collusion Detection
// ---------------------------------------------------------------------------

/**
 * Detect potential collusion between a driver and restaurant/customer.
 */
export function detectCollusion(
  sharedOrderCount: number,
  avgHandoffTimeSeconds: number,
  unusualPatterns: string[],
  involvedEntityIds: string[],
): CollusionResult {
  const patterns: string[] = [...unusualPatterns];
  let suspicionScore = 0;

  if (sharedOrderCount >= COLLUSION_THRESHOLDS.minSharedOrders) {
    patterns.push(
      `${sharedOrderCount} shared orders between same entities`,
    );
    suspicionScore += 20;
  }

  if (avgHandoffTimeSeconds < COLLUSION_THRESHOLDS.maxTimeBetweenHandoffs) {
    patterns.push(
      `Average handoff time ${avgHandoffTimeSeconds}s is unusually fast`,
    );
    suspicionScore += 15;
  }

  if (unusualPatterns.length >= COLLUSION_THRESHOLDS.suspiciousPatternCount) {
    suspicionScore += 25;
  }

  // Additional score for each unusual pattern
  suspicionScore += unusualPatterns.length * 5;

  const confidence = Math.min(100, suspicionScore);
  const isCollusion = confidence >= 50;

  if (isCollusion) {
    logger.info(
      `Collusion detected: confidence=${confidence}%, entities=${involvedEntityIds.join(",")}`,
      "Sentinel",
    );
  }

  return {
    isCollusion,
    confidence,
    patterns,
    involvedIds: involvedEntityIds,
  };
}

// ---------------------------------------------------------------------------
// Device Risk Assessment
// ---------------------------------------------------------------------------

/**
 * Assess the risk level of a driver's device.
 */
export function assessDeviceRisk(
  isEmulator: boolean,
  isMockLocation: boolean,
  isRooted: boolean,
  hasDebugger: boolean,
  appIntegrity: boolean,
  vpnDetected: boolean,
): DeviceRiskResult {
  const flags: string[] = [];
  let score = 0;

  if (isEmulator) {
    flags.push("Running on emulator");
    score += 40;
  }

  if (isMockLocation) {
    flags.push("Mock location enabled");
    score += 35;
  }

  if (isRooted) {
    flags.push("Device is rooted/jailbroken");
    score += 25;
  }

  if (hasDebugger) {
    flags.push("Debugger attached");
    score += 20;
  }

  if (!appIntegrity) {
    flags.push("App integrity check failed");
    score += 30;
  }

  if (vpnDetected) {
    flags.push("VPN detected");
    score += 10;
  }

  score = Math.min(100, score);

  let riskLevel: AlertSeverity = "low";
  if (score >= 70) riskLevel = "critical";
  else if (score >= 50) riskLevel = "high";
  else if (score >= 25) riskLevel = "medium";

  return { riskLevel, score, flags, isEmulator, isMockLocation, isRooted };
}

// ---------------------------------------------------------------------------
// Fraud Score Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate an overall fraud score from multiple alert sources.
 */
export function calculateFraudScore(alerts: FraudAlert[]): number {
  let score = 0;
  for (const alert of alerts) {
    score += SEVERITY_SCORES[alert.severity];
  }
  return Math.min(100, score);
}

/**
 * Determine if a driver should be blocked based on fraud score and alerts.
 */
export function shouldBlockDriver(
  score: number,
  alerts: FraudAlert[],
): boolean {
  // Block if score exceeds threshold
  if (score >= FRAUD_BLOCK_THRESHOLD) return true;

  // Block if 2+ critical alerts exist
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  if (criticalAlerts.length >= 2) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Full Fraud Assessment
// ---------------------------------------------------------------------------

/**
 * Run a comprehensive fraud assessment for a driver.
 */
export function runFraudAssessment(
  driverId: string,
  gpsReadings: GpsReading[],
  deviceInfo: {
    isEmulator: boolean;
    isMockLocation: boolean;
    isRooted: boolean;
    hasDebugger: boolean;
    appIntegrity: boolean;
    vpnDetected: boolean;
  },
  cashData?: {
    expectedCentimes: number;
    collectedCentimes: number;
    remittedCentimes: number;
    totalTransactions: number;
    shortageCount: number;
  },
): FraudAssessmentResult {
  const alerts: FraudAlert[] = [];

  // GPS analysis
  const gpsResult = detectGpsSpoofing(gpsReadings);
  if (gpsResult.isSpoofed) {
    alerts.push({
      type: "gps_spoofing",
      severity: gpsResult.severity,
      message: `GPS spoofing detected (confidence: ${gpsResult.confidence}%)`,
    });
  }

  // Device risk
  const deviceResult = assessDeviceRisk(
    deviceInfo.isEmulator,
    deviceInfo.isMockLocation,
    deviceInfo.isRooted,
    deviceInfo.hasDebugger,
    deviceInfo.appIntegrity,
    deviceInfo.vpnDetected,
  );
  if (deviceResult.score >= 25) {
    alerts.push({
      type: "device_risk",
      severity: deviceResult.riskLevel,
      message: `Device risk: ${deviceResult.flags.join(", ")}`,
    });
  }

  // Cash audit
  if (cashData) {
    const cashResult = auditCashHandling(
      cashData.expectedCentimes,
      cashData.collectedCentimes,
      cashData.remittedCentimes,
      cashData.totalTransactions,
      cashData.shortageCount,
    );
    if (!cashResult.isClean) {
      alerts.push({
        type: "cash_discrepancy",
        severity: cashResult.reconciliationRate < 80 ? "high" : "medium",
        message: cashResult.alerts.join("; "),
      });
    }
  }

  const overallScore = calculateFraudScore(alerts);
  const block = shouldBlockDriver(overallScore, alerts);

  let recommendation = "No action needed";
  if (block) recommendation = "Block driver immediately and investigate";
  else if (overallScore >= 50) recommendation = "Flag for manual review";
  else if (overallScore >= 25) recommendation = "Monitor closely";

  return {
    driverId,
    overallScore,
    alerts,
    shouldBlock: block,
    recommendation,
  };
}
