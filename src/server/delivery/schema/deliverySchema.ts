/**
 * Delivery Platform — Zod Schemas & TypeScript Types
 *
 * Central schema definitions for the delivery tRPC router.
 * All input validation, output types, and shared enums.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const DriverStatusEnum = z.enum([
  "pending_verification",
  "active",
  "inactive",
  "suspended",
  "deactivated",
  "on_delivery",
  "available",
  "offline",
  "busy",
  "under_review",
]);

export const DriverTierEnum = z.enum([
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
]);

export const VehicleTypeEnum = z.enum([
  "motorcycle",
  "car",
  "bicycle",
  "van",
]);

export const DeliveryStatusEnum = z.enum([
  "pending",
  "assigned",
  "picking_up",
  "at_restaurant",
  "picked_up",
  "delivering",
  "at_dropoff",
  "delivered",
  "cancelled",
  "failed",
]);

export const DocumentTypeEnum = z.enum([
  "cnie",
  "driving_license",
  "insurance",
  "auto_entrepreneur",
  "vehicle_inspection",
  "medical_certificate",
  "casier_judiciaire",
  "selfie_verification",
  "vehicle_registration",
]);

export const PayoutMethodEnum = z.enum([
  "bank_transfer",
  "mobile_wallet",
  "cash",
]);

export const WalletProviderEnum = z.enum([
  "inwi_money",
  "orange_money",
  "wafacash",
  "cashplus",
  "barid_bank",
]);

export const FraudAlertTypeEnum = z.enum([
  "gps_spoofing",
  "device_risk",
  "cash_discrepancy",
  "collusion",
  "rating_manipulation",
  "delivery_fraud",
]);

export const PaymentMethodEnum = z.enum([
  "cod",
  "card",
  "mobile_wallet",
  "bank_transfer",
]);

export const DisputeStatusEnum = z.enum([
  "open",
  "investigating",
  "resolved",
  "escalated",
  "closed",
]);

// ---------------------------------------------------------------------------
// Moroccan Phone Regex
// ---------------------------------------------------------------------------

const moroccanPhoneRegex = /^\+212[5-7]\d{8}$/;

// ---------------------------------------------------------------------------
// Input Schemas
// ---------------------------------------------------------------------------

export const RegisterDriverSchema = z.object({
  fullName: z.string().min(3).max(100),
  phone: z.string().regex(moroccanPhoneRegex, "Must be a valid Moroccan phone number (+212XXXXXXXXX)"),
  email: z.string().email().optional(),
  vehicleType: VehicleTypeEnum,
  city: z.string().min(2).max(50),
  referralCode: z.string().optional(),
});

export const UpdateDriverStatusSchema = z.object({
  driverId: z.string().uuid(),
  status: DriverStatusEnum,
  reason: z.string().optional(),
});

export const SubmitDocumentSchema = z.object({
  driverId: z.string().uuid(),
  documentType: DocumentTypeEnum,
  documentData: z.record(z.unknown()),
  fileUrls: z.array(z.string().url()).optional(),
});

export const CreateDeliverySchema = z.object({
  orderId: z.string().uuid(),
  restaurantId: z.string().uuid(),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  customerPhone: z.string().regex(moroccanPhoneRegex).optional(),
  paymentMethod: PaymentMethodEnum,
  orderAmount: z.number().int().positive(),
  deliveryFee: z.number().int().nonnegative(),
  specialInstructions: z.string().max(500).optional(),
});

export const UpdateDeliveryStatusSchema = z.object({
  deliveryId: z.string().uuid(),
  status: DeliveryStatusEnum,
  driverLat: z.number().min(-90).max(90).optional(),
  driverLng: z.number().min(-180).max(180).optional(),
  reason: z.string().optional(),
});

export const UpdateLocationSchema = z.object({
  driverId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().nonnegative().default(0),
  heading: z.number().min(0).max(360).default(0),
  accuracy: z.number().nonnegative().default(10),
  batteryLevel: z.number().min(0).max(100).optional(),
});

export const CalculateDeliveryFeeSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  city: z.string().optional(),
});

export const RateDriverSchema = z.object({
  deliveryId: z.string().uuid(),
  driverId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const ReportFraudSchema = z.object({
  driverId: z.string().uuid(),
  alertType: FraudAlertTypeEnum,
  description: z.string().min(10).max(1000),
  evidence: z.record(z.unknown()).optional(),
});

export const CreateDisputeSchema = z.object({
  deliveryId: z.string().uuid(),
  reason: z.string().min(10).max(1000),
  requestedAmount: z.number().int().nonnegative().optional(),
});

export const UpdateDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  status: DisputeStatusEnum,
  resolution: z.string().optional(),
  refundAmount: z.number().int().nonnegative().optional(),
});

export const CreateDeliveryZoneSchema = z.object({
  name: z.string().min(2).max(100),
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  radiusKm: z.number().positive().max(50),
  city: z.string().min(2).max(50),
});

export const GetEarningsSchema = z.object({
  driverId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(["daily", "weekly", "monthly"]).optional(),
});

export const GetAnalyticsSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(["hour", "day", "week", "month"]).optional(),
});

// ---------------------------------------------------------------------------
// Result Types (TypeScript interfaces for router responses)
// ---------------------------------------------------------------------------

export interface ETABreakdownResult {
  pickupMinutes: number;
  deliveryMinutes: number;
  totalMinutes: number;
  confidence: number;
}

export interface DeliveryFeeResult {
  baseFee: number;
  distanceFee: number;
  surgeFee: number;
  totalFee: number;
  distanceKm: number;
  currency: string;
}

export interface DriverEarningsResult {
  totalEarnings: number;
  deliveryCount: number;
  tips: number;
  bonuses: number;
  deductions: number;
  netEarnings: number;
  period: string;
}

export interface DeliveryAnalyticsResult {
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  averageRating: number;
  revenueTotal: number;
  topZones: Array<{ zoneId: string; count: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}

export interface DriverScoreResult {
  driverId: string;
  score: number;
  tier: string;
  breakdown: Array<{
    metric: string;
    value: number;
    weight: number;
    contribution: number;
  }>;
}

// ---------------------------------------------------------------------------
// Type Exports
// ---------------------------------------------------------------------------

export type DriverStatus = z.infer<typeof DriverStatusEnum>;
export type DriverTier = z.infer<typeof DriverTierEnum>;
export type VehicleType = z.infer<typeof VehicleTypeEnum>;
export type DeliveryStatus = z.infer<typeof DeliveryStatusEnum>;
export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type PayoutMethod = z.infer<typeof PayoutMethodEnum>;
export type WalletProvider = z.infer<typeof WalletProviderEnum>;
export type FraudAlertType = z.infer<typeof FraudAlertTypeEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
export type DisputeStatus = z.infer<typeof DisputeStatusEnum>;
