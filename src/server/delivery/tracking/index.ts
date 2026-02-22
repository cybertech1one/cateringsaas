/**
 * Temporal Tracking — Barrel Export
 *
 * Handles collisions between realtimeTracker and routeOptimizer:
 * - Coordinates, haversineDistance, calculateBearing exist in both
 * - realtimeTracker versions are primary; routeOptimizer aliased
 */

// Primary exports from realtimeTracker (includes Coordinates, haversineDistance, calculateBearing)
export * from "./realtimeTracker";

// All exports from demandForecasting (no collisions with realtimeTracker)
export * from "./demandForecasting";

// Explicit exports from routeOptimizer (alias collisions)
export {
  type Coordinates as RouteCoordinates,
  type RouteStop,
  type OptimizedRoute,
  type RouteConstraint,
  type InsertionResult,
  type MultiStopPlan,
  type RouteMetrics,
  haversineDistance as routeHaversineDistance,
  calculateBearing as routeCalculateBearing,
  calculateRouteDistance,
  reverseSegment,
  nearestNeighborRoute,
  twoOptImprove,
  validateRouteConstraints,
  optimizeRoute,
  findBestInsertion,
  planMultiStopRoute,
  calculateRouteMetrics,
  estimateRouteTime,
} from "./routeOptimizer";
