/**
 * Cash Management — COD Float Tracking & Reconciliation
 *
 * Cash float management, progressive trust limits, reconciliation,
 * and deposit tracking for COD-heavy Morocco delivery market.
 *
 * ZERO external dependencies. Pure functions only.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CashFloat {
  driverId: string;
  currentBalance: number;
  trustLimit: number;
  totalCollected: number;
  totalRemitted: number;
  pendingRemittance: number;
  lastReconciliation: number;
  transactionCount: number;
}

export interface CashTransaction {
  id: string;
  driverId: string;
  type: "collection" | "remittance" | "adjustment";
  amount: number;
  orderId: string | null;
  timestamp: number;
  note: string;
}

export interface ReconciliationResult {
  driverId: string;
  expectedBalance: number;
  actualBalance: number;
  discrepancy: number;
  isClean: boolean;
  alerts: string[];
  reconciliationRate: number;
}

export interface TrustLevelResult {
  driverId: string;
  currentLimit: number;
  newLimit: number;
  reason: string;
  trustScore: number;
}

export interface DepositRequest {
  driverId: string;
  amount: number;
  method: "bank_deposit" | "office_drop" | "agent_collection";
  deadline: number;
  urgency: "normal" | "urgent" | "critical";
}

export interface CashFlowSummary {
  totalCollected: number;
  totalRemitted: number;
  outstanding: number;
  overdueDrivers: string[];
  averageRemittanceTime: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRUST_LEVELS = {
  new: { limit: 50000, minDeliveries: 0 },
  basic: { limit: 100000, minDeliveries: 20 },
  trusted: { limit: 200000, minDeliveries: 100 },
  veteran: { limit: 500000, minDeliveries: 500 },
} as const;

const CASH_THRESHOLDS = {
  maxFloatWithoutRemittance: 200000,
  remittanceDeadlineHours: 24,
  criticalThresholdPercent: 90,
  urgentThresholdPercent: 75,
  maxDiscrepancyCentimes: 500,
  minReconciliationRate: 95,
} as const;

// ---------------------------------------------------------------------------
// Cash Float Operations
// ---------------------------------------------------------------------------

/**
 * Create an initial cash float for a new driver.
 */
export function createCashFloat(driverId: string): CashFloat {
  return {
    driverId,
    currentBalance: 0,
    trustLimit: TRUST_LEVELS.new.limit,
    totalCollected: 0,
    totalRemitted: 0,
    pendingRemittance: 0,
    lastReconciliation: Date.now(),
    transactionCount: 0,
  };
}

/**
 * Record a cash collection (driver collects COD payment).
 */
export function recordCollection(
  float: CashFloat,
  amount: number,
  orderId: string,
): { updatedFloat: CashFloat; transaction: CashTransaction; overLimit: boolean } {
  const newBalance = float.currentBalance + amount;
  const overLimit = newBalance > float.trustLimit;

  if (overLimit) {
    logger.info(
      `Driver ${float.driverId} cash balance ${newBalance} exceeds trust limit ${float.trustLimit}`,
      "Settlement",
    );
  }

  const updatedFloat: CashFloat = {
    ...float,
    currentBalance: newBalance,
    totalCollected: float.totalCollected + amount,
    pendingRemittance: float.pendingRemittance + amount,
    transactionCount: float.transactionCount + 1,
  };

  const transaction: CashTransaction = {
    id: `col-${orderId}-${Date.now()}`,
    driverId: float.driverId,
    type: "collection",
    amount,
    orderId,
    timestamp: Date.now(),
    note: `COD collection for order ${orderId}`,
  };

  return { updatedFloat, transaction, overLimit };
}

/**
 * Record a cash remittance (driver deposits cash).
 */
export function recordRemittance(
  float: CashFloat,
  amount: number,
): { updatedFloat: CashFloat; transaction: CashTransaction } {
  const updatedFloat: CashFloat = {
    ...float,
    currentBalance: Math.max(0, float.currentBalance - amount),
    totalRemitted: float.totalRemitted + amount,
    pendingRemittance: Math.max(0, float.pendingRemittance - amount),
  };

  const transaction: CashTransaction = {
    id: `rem-${float.driverId}-${Date.now()}`,
    driverId: float.driverId,
    type: "remittance",
    amount: -amount,
    orderId: null,
    timestamp: Date.now(),
    note: `Cash remittance of ${amount} centimes`,
  };

  return { updatedFloat, transaction };
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

/**
 * Reconcile a driver's cash float against expected values.
 */
export function reconcileCashFloat(
  float: CashFloat,
  reportedBalance: number,
): ReconciliationResult {
  const expectedBalance = float.totalCollected - float.totalRemitted;
  const discrepancy = reportedBalance - expectedBalance;
  const alerts: string[] = [];

  if (Math.abs(discrepancy) > CASH_THRESHOLDS.maxDiscrepancyCentimes) {
    alerts.push(
      `Cash discrepancy: ${discrepancy > 0 ? "+" : ""}${discrepancy} centimes`,
    );
  }

  const reconciliationRate =
    expectedBalance > 0
      ? Math.min(100, (1 - Math.abs(discrepancy) / expectedBalance) * 100)
      : 100;

  if (reconciliationRate < CASH_THRESHOLDS.minReconciliationRate) {
    alerts.push(
      `Reconciliation rate ${reconciliationRate.toFixed(1)}% below ${CASH_THRESHOLDS.minReconciliationRate}%`,
    );
  }

  if (float.pendingRemittance > CASH_THRESHOLDS.maxFloatWithoutRemittance) {
    alerts.push(
      `Pending remittance ${float.pendingRemittance} exceeds max ${CASH_THRESHOLDS.maxFloatWithoutRemittance}`,
    );
  }

  return {
    driverId: float.driverId,
    expectedBalance,
    actualBalance: reportedBalance,
    discrepancy,
    isClean: alerts.length === 0,
    alerts,
    reconciliationRate: Math.round(reconciliationRate * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Trust Level Management
// ---------------------------------------------------------------------------

/**
 * Calculate a driver's trust level and recommended cash limit.
 */
export function calculateTrustLevel(
  driverId: string,
  totalDeliveries: number,
  reconciliationRate: number,
  currentLimit: number,
): TrustLevelResult {
  let targetLevel: { limit: number; minDeliveries: number } = TRUST_LEVELS.new;
  let reason = "New driver — default trust level";

  if (totalDeliveries >= TRUST_LEVELS.veteran.minDeliveries && reconciliationRate >= 98) {
    targetLevel = TRUST_LEVELS.veteran;
    reason = `Veteran driver: ${totalDeliveries} deliveries, ${reconciliationRate}% reconciliation`;
  } else if (totalDeliveries >= TRUST_LEVELS.trusted.minDeliveries && reconciliationRate >= 96) {
    targetLevel = TRUST_LEVELS.trusted;
    reason = `Trusted driver: ${totalDeliveries} deliveries, ${reconciliationRate}% reconciliation`;
  } else if (totalDeliveries >= TRUST_LEVELS.basic.minDeliveries && reconciliationRate >= 93) {
    targetLevel = TRUST_LEVELS.basic;
    reason = `Basic trust: ${totalDeliveries} deliveries, ${reconciliationRate}% reconciliation`;
  }

  // Penalize poor reconciliation
  if (reconciliationRate < 90 && targetLevel.limit > TRUST_LEVELS.new.limit) {
    targetLevel = TRUST_LEVELS.new;
    reason = `Trust downgraded due to low reconciliation rate (${reconciliationRate}%)`;
  }

  const trustScore = Math.min(
    100,
    Math.round(
      (totalDeliveries / 500) * 50 + (reconciliationRate / 100) * 50,
    ),
  );

  return {
    driverId,
    currentLimit,
    newLimit: targetLevel.limit,
    reason,
    trustScore,
  };
}

// ---------------------------------------------------------------------------
// Deposit Requests
// ---------------------------------------------------------------------------

/**
 * Generate a deposit request for a driver based on their float status.
 */
export function generateDepositRequest(
  float: CashFloat,
  now: number = Date.now(),
): DepositRequest | null {
  if (float.pendingRemittance <= 0) return null;

  const utilizationPercent =
    (float.currentBalance / float.trustLimit) * 100;

  let urgency: DepositRequest["urgency"] = "normal";
  if (utilizationPercent >= CASH_THRESHOLDS.criticalThresholdPercent) {
    urgency = "critical";
  } else if (utilizationPercent >= CASH_THRESHOLDS.urgentThresholdPercent) {
    urgency = "urgent";
  }

  const deadlineMs =
    urgency === "critical"
      ? 4 * 60 * 60 * 1000
      : urgency === "urgent"
        ? 12 * 60 * 60 * 1000
        : CASH_THRESHOLDS.remittanceDeadlineHours * 60 * 60 * 1000;

  return {
    driverId: float.driverId,
    amount: float.pendingRemittance,
    method: urgency === "critical" ? "agent_collection" : "bank_deposit",
    deadline: now + deadlineMs,
    urgency,
  };
}

// ---------------------------------------------------------------------------
// Cash Flow Summary
// ---------------------------------------------------------------------------

/**
 * Generate a cash flow summary across multiple drivers.
 */
export function generateCashFlowSummary(
  floats: CashFloat[],
  overdueThresholdMs: number = 24 * 60 * 60 * 1000,
  now: number = Date.now(),
): CashFlowSummary {
  const totalCollected = floats.reduce((s, f) => s + f.totalCollected, 0);
  const totalRemitted = floats.reduce((s, f) => s + f.totalRemitted, 0);
  const outstanding = floats.reduce((s, f) => s + f.pendingRemittance, 0);

  const overdueDrivers = floats
    .filter(
      (f) =>
        f.pendingRemittance > 0 &&
        now - f.lastReconciliation > overdueThresholdMs,
    )
    .map((f) => f.driverId);

  const driversWithRemittance = floats.filter(
    (f) => f.totalRemitted > 0,
  );
  const averageRemittanceTime =
    driversWithRemittance.length > 0
      ? driversWithRemittance.reduce(
          (s, f) => s + (now - f.lastReconciliation),
          0,
        ) / driversWithRemittance.length
      : 0;

  return {
    totalCollected,
    totalRemitted,
    outstanding,
    overdueDrivers,
    averageRemittanceTime: Math.round(averageRemittanceTime),
  };
}

/**
 * Get the trust level configuration.
 */
export function getTrustLevels() {
  return {
    new: { limit: TRUST_LEVELS.new.limit as number, minDeliveries: TRUST_LEVELS.new.minDeliveries as number },
    basic: { limit: TRUST_LEVELS.basic.limit as number, minDeliveries: TRUST_LEVELS.basic.minDeliveries as number },
    trusted: { limit: TRUST_LEVELS.trusted.limit as number, minDeliveries: TRUST_LEVELS.trusted.minDeliveries as number },
    veteran: { limit: TRUST_LEVELS.veteran.limit as number, minDeliveries: TRUST_LEVELS.veteran.minDeliveries as number },
  };
}

/**
 * Get the cash threshold configuration.
 */
export function getCashThresholds() {
  return { ...CASH_THRESHOLDS } as Record<string, number>;
}
