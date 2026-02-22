/**
 * FeastQR Delivery Platform — Top-Level Barrel Export
 *
 * Usage:
 *   import { MosaicMatching, Sentinel, Temporal, Settlement, AtlasScore } from "~/server/delivery";
 *
 * Subsystems:
 * - algorithms/  — Mosaic Matching (order→driver assignment)
 * - fraud/       — Sentinel (GPS spoofing, collusion, KYC, device risk)
 * - tracking/    — Temporal (real-time tracking, ETA, demand forecasting, routing)
 * - payments/    — Settlement Engine (COD, commissions, cash management, incentives)
 * - scoring/     — Atlas Score (driver scoring, anomaly detection, tier system)
 * - schema/      — Zod schemas & TypeScript types for the delivery router
 */

import * as MosaicMatching from "./algorithms";
import * as Sentinel from "./fraud";
import * as Temporal from "./tracking";
import * as Settlement from "./payments";
import * as AtlasScore from "./scoring";

export { MosaicMatching, Sentinel, Temporal, Settlement, AtlasScore };

export * from "./schema/deliverySchema";
