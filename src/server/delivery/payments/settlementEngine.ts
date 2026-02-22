/**
 * Settlement Engine — Commission & Driver Payment Calculations
 *
 * COD and digital payment flows, commission tiers, driver pay,
 * ledger entry generation for the Diyafa Delivery Platform.
 *
 * Morocco-specific: MAD centimes, COD-first (60-74%), platform fees.
 *
 * ZERO external dependencies. Pure functions only.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentMethod = "cod" | "card" | "mobile_wallet" | "bank_transfer";
export type LedgerEntryType =
  | "order_payment"
  | "commission"
  | "driver_payout"
  | "platform_fee"
  | "refund"
  | "adjustment"
  | "tip"
  | "bonus"
  | "penalty";

export interface CommissionTier {
  name: string;
  rate: number;
  minMonthlyOrders: number;
}

export interface OrderSettlement {
  orderId: string;
  orderAmount: number;
  deliveryFee: number;
  tipAmount: number;
  commissionAmount: number;
  platformFee: number;
  driverPay: number;
  restaurantPayout: number;
  paymentMethod: PaymentMethod;
}

export interface LedgerEntry {
  id: string;
  type: LedgerEntryType;
  amount: number;
  currency: string;
  entityId: string;
  entityType: "driver" | "restaurant" | "platform";
  description: string;
  timestamp: number;
  referenceId: string;
}

export interface DriverPayCalculation {
  basePay: number;
  distanceBonus: number;
  peakBonus: number;
  weatherBonus: number;
  tipAmount: number;
  totalPay: number;
  deductions: number;
  netPay: number;
}

export interface SettlementSummary {
  totalOrders: number;
  totalRevenue: number;
  totalCommissions: number;
  totalDriverPayouts: number;
  totalPlatformFees: number;
  totalRestaurantPayouts: number;
  averageOrderValue: number;
  codPercentage: number;
}

export interface PayoutSchedule {
  driverId: string;
  amount: number;
  method: PaymentMethod;
  scheduledDate: string;
  status: "pending" | "processing" | "completed" | "failed";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMMISSION_RATES: CommissionTier[] = [
  { name: "standard", rate: 0.18, minMonthlyOrders: 0 },
  { name: "premium", rate: 0.15, minMonthlyOrders: 100 },
  { name: "enterprise", rate: 0.12, minMonthlyOrders: 500 },
];

const PLATFORM_FEE_CENTIMES = 200;

const DRIVER_PAY = {
  basePay: 1000,
  perKmRate: 300,
  peakMultiplier: 1.5,
  weatherBonus: 500,
  maxDistanceBonus: 5000,
  minGuaranteedPay: 800,
} as const;

const VAT_RATE = 0.2; // Morocco 20% VAT

// ---------------------------------------------------------------------------
// Commission Calculation
// ---------------------------------------------------------------------------

/**
 * Get the commission tier for a restaurant based on monthly order count.
 */
export function getCommissionTier(monthlyOrders: number): CommissionTier {
  let selectedTier = COMMISSION_RATES[0]!;
  for (const tier of COMMISSION_RATES) {
    if (monthlyOrders >= tier.minMonthlyOrders) {
      selectedTier = tier;
    }
  }
  return selectedTier;
}

/**
 * Calculate commission amount from an order total.
 */
export function calculateCommission(
  orderAmountCentimes: number,
  monthlyOrders: number,
): { amount: number; rate: number; tierName: string } {
  const tier = getCommissionTier(monthlyOrders);
  const amount = Math.round(orderAmountCentimes * tier.rate);
  return { amount, rate: tier.rate, tierName: tier.name };
}

// ---------------------------------------------------------------------------
// Driver Pay Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate driver pay for a single delivery.
 */
export function calculateDriverPay(
  distanceKm: number,
  isPeakHour: boolean,
  isRaining: boolean,
  tipCentimes: number = 0,
  penaltyCentimes: number = 0,
): DriverPayCalculation {
  let basePay: number = DRIVER_PAY.basePay;

  // Distance bonus
  const distanceBonus = Math.min(
    DRIVER_PAY.maxDistanceBonus,
    Math.round(distanceKm * DRIVER_PAY.perKmRate),
  );

  // Peak hour bonus
  const peakBonus = isPeakHour
    ? Math.round(basePay * (DRIVER_PAY.peakMultiplier - 1))
    : 0;

  // Weather bonus
  const weatherBonus = isRaining ? DRIVER_PAY.weatherBonus : 0;

  const grossPay = basePay + distanceBonus + peakBonus + weatherBonus + tipCentimes;
  const netPay = Math.max(
    DRIVER_PAY.minGuaranteedPay,
    grossPay - penaltyCentimes,
  );

  return {
    basePay,
    distanceBonus,
    peakBonus,
    weatherBonus,
    tipAmount: tipCentimes,
    totalPay: grossPay,
    deductions: penaltyCentimes,
    netPay,
  };
}

// ---------------------------------------------------------------------------
// Order Settlement
// ---------------------------------------------------------------------------

/**
 * Settle a full order: calculate all financial splits.
 */
export function settleOrder(
  orderId: string,
  orderAmountCentimes: number,
  deliveryFeeCentimes: number,
  tipCentimes: number,
  distanceKm: number,
  isPeakHour: boolean,
  isRaining: boolean,
  paymentMethod: PaymentMethod,
  monthlyOrders: number,
): OrderSettlement {
  const commission = calculateCommission(orderAmountCentimes, monthlyOrders);
  const driverPayCalc = calculateDriverPay(
    distanceKm,
    isPeakHour,
    isRaining,
    tipCentimes,
  );

  const restaurantPayout =
    orderAmountCentimes - commission.amount - PLATFORM_FEE_CENTIMES;

  return {
    orderId,
    orderAmount: orderAmountCentimes,
    deliveryFee: deliveryFeeCentimes,
    tipAmount: tipCentimes,
    commissionAmount: commission.amount,
    platformFee: PLATFORM_FEE_CENTIMES,
    driverPay: driverPayCalc.netPay,
    restaurantPayout: Math.max(0, restaurantPayout),
    paymentMethod,
  };
}

// ---------------------------------------------------------------------------
// Ledger Entries
// ---------------------------------------------------------------------------

/**
 * Generate ledger entries for a settled order.
 */
export function generateLedgerEntries(
  settlement: OrderSettlement,
  timestamp: number = Date.now(),
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  const prefix = `order-${settlement.orderId}`;

  entries.push({
    id: `${prefix}-payment`,
    type: "order_payment",
    amount: settlement.orderAmount + settlement.deliveryFee,
    currency: "MAD",
    entityId: settlement.orderId,
    entityType: "platform",
    description: `Payment received for order ${settlement.orderId}`,
    timestamp,
    referenceId: settlement.orderId,
  });

  entries.push({
    id: `${prefix}-commission`,
    type: "commission",
    amount: -settlement.commissionAmount,
    currency: "MAD",
    entityId: settlement.orderId,
    entityType: "restaurant",
    description: `Commission on order ${settlement.orderId}`,
    timestamp,
    referenceId: settlement.orderId,
  });

  entries.push({
    id: `${prefix}-driver`,
    type: "driver_payout",
    amount: -settlement.driverPay,
    currency: "MAD",
    entityId: settlement.orderId,
    entityType: "driver",
    description: `Driver payout for order ${settlement.orderId}`,
    timestamp,
    referenceId: settlement.orderId,
  });

  entries.push({
    id: `${prefix}-platform`,
    type: "platform_fee",
    amount: settlement.platformFee,
    currency: "MAD",
    entityId: settlement.orderId,
    entityType: "platform",
    description: `Platform fee for order ${settlement.orderId}`,
    timestamp,
    referenceId: settlement.orderId,
  });

  entries.push({
    id: `${prefix}-restaurant`,
    type: "order_payment",
    amount: settlement.restaurantPayout,
    currency: "MAD",
    entityId: settlement.orderId,
    entityType: "restaurant",
    description: `Restaurant payout for order ${settlement.orderId}`,
    timestamp,
    referenceId: settlement.orderId,
  });

  if (settlement.tipAmount > 0) {
    entries.push({
      id: `${prefix}-tip`,
      type: "tip",
      amount: settlement.tipAmount,
      currency: "MAD",
      entityId: settlement.orderId,
      entityType: "driver",
      description: `Tip for driver on order ${settlement.orderId}`,
      timestamp,
      referenceId: settlement.orderId,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// VAT Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate VAT on a given amount (Morocco 20%).
 */
export function calculateVAT(amountCentimes: number): {
  beforeVat: number;
  vatAmount: number;
  afterVat: number;
} {
  const vatAmount = Math.round(amountCentimes * VAT_RATE);
  return {
    beforeVat: amountCentimes,
    vatAmount,
    afterVat: amountCentimes + vatAmount,
  };
}

// ---------------------------------------------------------------------------
// Settlement Summary
// ---------------------------------------------------------------------------

/**
 * Generate a summary from a batch of settlements.
 */
export function generateSettlementSummary(
  settlements: OrderSettlement[],
): SettlementSummary {
  if (settlements.length === 0) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      totalCommissions: 0,
      totalDriverPayouts: 0,
      totalPlatformFees: 0,
      totalRestaurantPayouts: 0,
      averageOrderValue: 0,
      codPercentage: 0,
    };
  }

  const totalRevenue = settlements.reduce(
    (s, o) => s + o.orderAmount + o.deliveryFee,
    0,
  );
  const totalCommissions = settlements.reduce(
    (s, o) => s + o.commissionAmount,
    0,
  );
  const totalDriverPayouts = settlements.reduce(
    (s, o) => s + o.driverPay,
    0,
  );
  const totalPlatformFees = settlements.reduce(
    (s, o) => s + o.platformFee,
    0,
  );
  const totalRestaurantPayouts = settlements.reduce(
    (s, o) => s + o.restaurantPayout,
    0,
  );
  const codCount = settlements.filter(
    (s) => s.paymentMethod === "cod",
  ).length;

  return {
    totalOrders: settlements.length,
    totalRevenue,
    totalCommissions,
    totalDriverPayouts,
    totalPlatformFees,
    totalRestaurantPayouts,
    averageOrderValue: Math.round(totalRevenue / settlements.length),
    codPercentage: Math.round((codCount / settlements.length) * 100),
  };
}

// ---------------------------------------------------------------------------
// Payout Scheduling
// ---------------------------------------------------------------------------

/**
 * Create a payout schedule for a driver.
 */
export function createPayoutSchedule(
  driverId: string,
  amountCentimes: number,
  preferredMethod: PaymentMethod,
  scheduledDate: string,
): PayoutSchedule {
  return {
    driverId,
    amount: amountCentimes,
    method: preferredMethod,
    scheduledDate,
    status: "pending",
  };
}

/**
 * Batch create payout schedules for multiple drivers.
 */
export function batchCreatePayouts(
  drivers: Array<{
    driverId: string;
    amount: number;
    method: PaymentMethod;
  }>,
  scheduledDate: string,
): PayoutSchedule[] {
  return drivers
    .filter((d) => d.amount > 0)
    .map((d) =>
      createPayoutSchedule(d.driverId, d.amount, d.method, scheduledDate),
    );
}

/**
 * Get the commission rates configuration.
 */
export function getCommissionRates(): CommissionTier[] {
  return COMMISSION_RATES.map((r) => ({ ...r }));
}

/**
 * Get the driver pay configuration.
 */
export function getDriverPayConfig(): typeof DRIVER_PAY {
  return { ...DRIVER_PAY };
}

/**
 * Get the platform fee in centimes.
 */
export function getPlatformFee(): number {
  return PLATFORM_FEE_CENTIMES;
}
