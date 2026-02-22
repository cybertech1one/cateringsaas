/**
 * Real-Time Delivery Tracking Module
 *
 * Provides GPS location tracking, geofencing, ETA prediction, and delivery
 * status state machine for the FeastQR delivery platform.
 *
 * Morocco-specific features:
 * - 9 city speed profiles (Casablanca, Rabat, Marrakech, Fes, Tangier, etc.)
 * - Medina zone speed reductions (narrow alleys, pedestrian traffic)
 * - Peak hour multipliers tuned to Moroccan traffic patterns
 * - Friday prayer / Ramadan traffic adjustments via external modules
 *
 * All coordinates use WGS84 (standard GPS). Distances in kilometers.
 * Speeds in km/h. Times in minutes unless noted otherwise.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Coordinates {
  lat: number;
  lng: number;
}

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picking_up"
  | "at_restaurant"
  | "picked_up"
  | "delivering"
  | "at_dropoff"
  | "delivered"
  | "cancelled"
  | "failed";

export interface LocationUpdate {
  driverId: string;
  coordinates: Coordinates;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp: number;
  batteryLevel: number;
}

export interface GeofenceEvent {
  type: "enter" | "exit";
  zoneId: string;
  timestamp: number;
  driverId: string;
  coordinates: Coordinates;
}

export interface ETAPrediction {
  pickupMinutes: number;
  deliveryMinutes: number;
  totalMinutes: number;
  confidence: number;
  adjustments: string[];
}

export interface StatusTransition {
  from: DeliveryStatus;
  to: DeliveryStatus;
  timestamp: number;
  reason: string;
}

export interface DeliveryTracking {
  deliveryId: string;
  status: DeliveryStatus;
  driverLocation: Coordinates | null;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  estimatedPickupTime: number;
  estimatedDeliveryTime: number;
  actualPickupTime: number | null;
  actualDeliveryTime: number | null;
  statusHistory: StatusTransition[];
  lastUpdate: number;
}

export interface GeofenceZone {
  id: string;
  center: Coordinates;
  radiusKm: number;
  name: string;
  type: "restaurant" | "dropoff" | "zone";
}

// ---------------------------------------------------------------------------
// Morocco City Speed Profiles
// ---------------------------------------------------------------------------

interface CitySpeedProfile {
  averageKmh: number;
  peakMultiplier: number;
  medinaMultiplier: number;
}

export const MOROCCO_CITY_SPEEDS: Record<string, CitySpeedProfile> = {
  casablanca: { averageKmh: 25, peakMultiplier: 0.6, medinaMultiplier: 0.3 },
  rabat: { averageKmh: 22, peakMultiplier: 0.65, medinaMultiplier: 0.35 },
  marrakech: { averageKmh: 20, peakMultiplier: 0.55, medinaMultiplier: 0.25 },
  fes: { averageKmh: 18, peakMultiplier: 0.6, medinaMultiplier: 0.2 },
  tangier: { averageKmh: 23, peakMultiplier: 0.65, medinaMultiplier: 0.3 },
  agadir: { averageKmh: 28, peakMultiplier: 0.7, medinaMultiplier: 0.4 },
  meknes: { averageKmh: 22, peakMultiplier: 0.65, medinaMultiplier: 0.3 },
  oujda: { averageKmh: 25, peakMultiplier: 0.7, medinaMultiplier: 0.35 },
  kenitra: { averageKmh: 24, peakMultiplier: 0.65, medinaMultiplier: 0.35 },
};

// ---------------------------------------------------------------------------
// Delivery Status State Machine
// ---------------------------------------------------------------------------

/**
 * Valid state transitions for delivery lifecycle.
 *
 * The delivery follows a linear flow from pending -> delivered, with the
 * option to cancel at most stages. Terminal states (delivered, cancelled,
 * failed) have no outgoing transitions.
 *
 * pending -> assigned:       Driver matched to order
 * assigned -> picking_up:    Driver starts heading to restaurant
 * picking_up -> at_restaurant: Driver arrives at restaurant geofence
 * at_restaurant -> picked_up:  Driver confirms food collected
 * picked_up -> delivering:     Driver begins delivery leg
 * delivering -> at_dropoff:    Driver arrives at customer geofence
 * at_dropoff -> delivered:     Driver confirms handoff to customer
 * at_dropoff -> failed:        Delivery could not be completed (no customer, wrong address)
 * * -> cancelled:              Order cancelled at eligible stages
 */
export const VALID_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["picking_up", "cancelled"],
  picking_up: ["at_restaurant", "cancelled"],
  at_restaurant: ["picked_up", "cancelled"],
  picked_up: ["delivering", "cancelled"],
  delivering: ["at_dropoff", "cancelled"],
  at_dropoff: ["delivered", "failed"],
  delivered: [],
  cancelled: [],
  failed: [],
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Earth radius in kilometers (mean radius, WGS84) */
const EARTH_RADIUS_KM = 6371;

/** Default average speed when no city profile is available (km/h) */
const DEFAULT_SPEED_KMH = 22;

/** Minimum ETA in minutes to prevent unrealistically low estimates */
const MIN_ETA_MINUTES = 1;

/** Prep time added to ETA when driver is still heading to restaurant (minutes) */
const RESTAURANT_PREP_BUFFER_MINUTES = 5;

/** Stationary detection: minimum distance in km to count as movement */
const STATIONARY_THRESHOLD_KM = 0.05;

/** Default threshold in minutes to detect a stationary driver */
const DEFAULT_STATIONARY_THRESHOLD_MINUTES = 5;

/** Confidence decay factor per km of distance */
const CONFIDENCE_DISTANCE_DECAY = 0.02;

/** Base confidence for ETA predictions */
const BASE_ETA_CONFIDENCE = 0.95;

/** Minimum confidence floor */
const MIN_CONFIDENCE = 0.3;

// ---------------------------------------------------------------------------
// Geo Utilities
// ---------------------------------------------------------------------------

/**
 * Calculate the great-circle distance between two coordinates using the
 * Haversine formula.
 *
 * The Haversine formula gives the shortest distance over the earth's surface
 * between two points specified in latitude and longitude. It accounts for the
 * spherical shape of the Earth but not for elevation differences.
 *
 * For Moroccan delivery distances (typically 0.5-15 km), this provides
 * accuracy within a few meters which is more than sufficient for ETA
 * calculation and geofence checks.
 *
 * @param a - First coordinate (lat/lng in degrees)
 * @param b - Second coordinate (lat/lng in degrees)
 * @returns Distance in kilometers
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLng = Math.sin(dLng / 2);

  const haversine =
    sinHalfDLat * sinHalfDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinHalfDLng * sinHalfDLng;

  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * centralAngle;
}

/**
 * Calculate the initial bearing (forward azimuth) from one coordinate to another.
 *
 * The bearing is measured clockwise from true north. This is useful for:
 * - Determining the direction a driver needs to head
 * - Rendering driver direction arrows on map UIs
 * - Detecting if a driver is heading toward or away from destination
 *
 * @param from - Starting coordinate
 * @param to - Destination coordinate
 * @returns Bearing in degrees (0-360, where 0 = north, 90 = east)
 */
export function calculateBearing(from: Coordinates, to: Coordinates): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const toDeg = (rad: number): number => (rad * 180) / Math.PI;

  const dLng = toRad(to.lng - from.lng);
  const fromLatRad = toRad(from.lat);
  const toLatRad = toRad(to.lat);

  const x = Math.sin(dLng) * Math.cos(toLatRad);
  const y =
    Math.cos(fromLatRad) * Math.sin(toLatRad) -
    Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(dLng);

  const bearingRad = Math.atan2(x, y);
  const bearingDeg = toDeg(bearingRad);

  // Normalize to 0-360 range
  return (bearingDeg + 360) % 360;
}

/**
 * Check if a given point lies within a circular geofence zone.
 *
 * Uses Haversine distance to determine if the point is within the zone's
 * radius from its center. This is the primary mechanism for detecting
 * when a driver arrives at a restaurant or dropoff location.
 *
 * @param point - The GPS coordinate to check
 * @param zone - The geofence zone definition
 * @returns true if the point is inside the geofence
 */
export function isPointInGeofence(point: Coordinates, zone: GeofenceZone): boolean {
  const distance = haversineDistance(point, zone.center);
  return distance <= zone.radiusKm;
}

/**
 * Check a driver's location against multiple geofence zones and generate
 * enter/exit events.
 *
 * This function is stateless - it only reports which zones the driver is
 * currently inside (as "enter" events). The caller is responsible for
 * comparing with previous state to determine actual enter/exit transitions.
 *
 * In production, this would be called on every location update and compared
 * against a cache of the driver's previous zone memberships to generate
 * proper enter/exit event pairs.
 *
 * @param location - Current driver coordinates
 * @param zones - Array of geofence zones to check against
 * @param driverId - The driver's unique identifier
 * @returns Array of geofence events for zones the driver is currently inside
 */
export function checkGeofences(
  location: Coordinates,
  zones: GeofenceZone[],
  driverId: string,
): GeofenceEvent[] {
  const events: GeofenceEvent[] = [];
  const now = Date.now();

  for (const zone of zones) {
    if (isPointInGeofence(location, zone)) {
      events.push({
        type: "enter",
        zoneId: zone.id,
        timestamp: now,
        driverId,
        coordinates: { ...location },
      });

      logger.info(
        `Driver ${driverId} entered geofence ${zone.name} (${zone.id})`,
        "realtimeTracker",
      );
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Speed & ETA Calculations
// ---------------------------------------------------------------------------

/**
 * Get the effective travel speed for a city considering peak hours and
 * medina zones.
 *
 * Morocco's cities have vastly different traffic characteristics:
 * - Casablanca: Modern grid layout but heavy congestion on arterials
 * - Marrakech: Dense medina with extremely narrow alleys, motorcycle-only
 * - Fes: UNESCO medina is the largest car-free urban area in the world
 * - Agadir: Newer city, wider roads, best traffic flow
 *
 * When both peak hour and medina conditions apply, BOTH multipliers are
 * applied simultaneously (product), reflecting the compounded slowdown
 * of navigating narrow streets during rush hour.
 *
 * @param city - City name (lowercase, must match MOROCCO_CITY_SPEEDS keys)
 * @param isPeakHour - Whether current time is during peak traffic
 * @param isMediana - Whether the route passes through a medina zone
 * @returns Effective speed in km/h
 */
export function getEffectiveTravelSpeed(
  city: string,
  isPeakHour: boolean,
  isMediana: boolean,
): number {
  const profile = MOROCCO_CITY_SPEEDS[city.toLowerCase()];

  if (!profile) {
    logger.warn(
      `No speed profile for city "${city}", using default ${DEFAULT_SPEED_KMH} km/h`,
      undefined,
      "realtimeTracker",
    );
    return DEFAULT_SPEED_KMH;
  }

  let speed = profile.averageKmh;

  if (isPeakHour && isMediana) {
    // Both conditions compound: narrow medina streets during rush hour
    speed = speed * profile.peakMultiplier * profile.medinaMultiplier;
  } else if (isPeakHour) {
    speed = speed * profile.peakMultiplier;
  } else if (isMediana) {
    speed = speed * profile.medinaMultiplier;
  }

  // Ensure we never return zero or negative speed
  return Math.max(speed, 1);
}

/**
 * Estimate the travel time between two coordinates in minutes.
 *
 * Uses straight-line (Haversine) distance with a road winding factor of 1.3
 * to approximate actual road distance. This factor accounts for the fact
 * that roads are rarely perfectly straight, especially in Moroccan cities
 * with their organic street layouts.
 *
 * The winding factor is conservative - medina routes may be 1.5-2x the
 * straight-line distance, but this is partially accounted for by the
 * medina speed multiplier already reducing the effective speed.
 *
 * @param from - Origin coordinate
 * @param to - Destination coordinate
 * @param city - Optional city name for speed profile lookup
 * @param isPeakHour - Whether current time is peak traffic (default false)
 * @param isMediana - Whether route passes through medina (default false)
 * @returns Estimated travel time in minutes
 */
export function estimateETA(
  from: Coordinates,
  to: Coordinates,
  city?: string,
  isPeakHour?: boolean,
  isMediana?: boolean,
): number {
  const straightLineDistance = haversineDistance(from, to);

  // Road winding factor: roads are ~1.3x longer than straight-line
  const roadDistance = straightLineDistance * 1.3;

  const speed = city
    ? getEffectiveTravelSpeed(city, isPeakHour ?? false, isMediana ?? false)
    : DEFAULT_SPEED_KMH;

  // time = distance / speed, converted from hours to minutes
  const minutes = (roadDistance / speed) * 60;

  return Math.max(minutes, MIN_ETA_MINUTES);
}

/**
 * Generate a comprehensive ETA prediction for an active delivery.
 *
 * This is the primary ETA function exposed to the customer-facing tracking
 * page. It considers the delivery's current status to determine which legs
 * of the journey remain, and applies appropriate adjustments.
 *
 * ETA calculation varies by status:
 * - pending/assigned:  Full pickup + prep + delivery estimate
 * - picking_up:        Remaining pickup + prep + delivery estimate
 * - at_restaurant:     Prep buffer + delivery estimate
 * - picked_up:         Full delivery estimate
 * - delivering:        Remaining delivery estimate
 * - at_dropoff:        Minimal time (handoff)
 * - delivered/cancelled/failed: Zero
 *
 * Confidence decreases with distance (longer routes = more uncertainty)
 * and is lower when driver location is unknown.
 *
 * @param delivery - Current delivery tracking state
 * @param driverSpeed - Optional current driver speed in km/h
 * @param city - Optional city name for speed profile
 * @returns Full ETA prediction with confidence and adjustment explanations
 */
export function predictDeliveryETA(
  delivery: DeliveryTracking,
  driverSpeed?: number,
  city?: string,
): ETAPrediction {
  const adjustments: string[] = [];
  let pickupMinutes = 0;
  let deliveryMinutes = 0;
  let confidence = BASE_ETA_CONFIDENCE;

  const terminalStatuses: DeliveryStatus[] = ["delivered", "cancelled", "failed"];
  if (terminalStatuses.includes(delivery.status)) {
    return {
      pickupMinutes: 0,
      deliveryMinutes: 0,
      totalMinutes: 0,
      confidence: 1.0,
      adjustments: ["Delivery completed or terminated"],
    };
  }

  // Calculate pickup leg ETA
  const needsPickup = ["pending", "assigned", "picking_up"].includes(delivery.status);
  if (needsPickup) {
    if (delivery.driverLocation) {
      const pickupDistance = haversineDistance(delivery.driverLocation, delivery.pickupLocation);
      const effectiveSpeed = driverSpeed && driverSpeed > 0 ? driverSpeed : DEFAULT_SPEED_KMH;
      pickupMinutes = (pickupDistance * 1.3 / effectiveSpeed) * 60;

      if (driverSpeed && driverSpeed > 0) {
        adjustments.push(`Using real-time driver speed: ${driverSpeed.toFixed(1)} km/h`);
      }

      // Confidence decreases with pickup distance
      confidence -= pickupDistance * CONFIDENCE_DISTANCE_DECAY;
    } else {
      // No driver location: use estimate from pickup to dropoff midpoint
      pickupMinutes = 10; // Default 10 minute estimate when no location
      confidence -= 0.2;
      adjustments.push("Driver location unknown, using default pickup estimate");
    }

    // Add restaurant prep buffer
    pickupMinutes += RESTAURANT_PREP_BUFFER_MINUTES;
    adjustments.push(`Added ${RESTAURANT_PREP_BUFFER_MINUTES} min restaurant prep buffer`);
  }

  // Handle at_restaurant status (waiting for food)
  if (delivery.status === "at_restaurant") {
    pickupMinutes = RESTAURANT_PREP_BUFFER_MINUTES;
    adjustments.push("Driver at restaurant, waiting for food prep");
  }

  // Calculate delivery leg ETA
  const needsDelivery = [
    "pending", "assigned", "picking_up", "at_restaurant", "picked_up", "delivering",
  ].includes(delivery.status);

  if (needsDelivery) {
    if (delivery.status === "delivering" && delivery.driverLocation) {
      // Driver is en route: calculate from current position to dropoff
      const remainingDistance = haversineDistance(
        delivery.driverLocation,
        delivery.dropoffLocation,
      );
      const effectiveSpeed = driverSpeed && driverSpeed > 0 ? driverSpeed : DEFAULT_SPEED_KMH;
      deliveryMinutes = (remainingDistance * 1.3 / effectiveSpeed) * 60;

      if (driverSpeed && driverSpeed > 0) {
        adjustments.push(`Delivery leg using driver speed: ${driverSpeed.toFixed(1)} km/h`);
      }

      confidence -= remainingDistance * CONFIDENCE_DISTANCE_DECAY;
    } else {
      // Not yet delivering: estimate full delivery leg
      const deliveryDistance = haversineDistance(
        delivery.pickupLocation,
        delivery.dropoffLocation,
      );

      if (city) {
        const speed = getEffectiveTravelSpeed(city, false, false);
        deliveryMinutes = (deliveryDistance * 1.3 / speed) * 60;
        adjustments.push(`Using ${city} speed profile: ${speed.toFixed(1)} km/h`);
      } else {
        deliveryMinutes = (deliveryDistance * 1.3 / DEFAULT_SPEED_KMH) * 60;
      }

      confidence -= deliveryDistance * CONFIDENCE_DISTANCE_DECAY;
    }
  }

  // Handle at_dropoff: nearly done
  if (delivery.status === "at_dropoff") {
    pickupMinutes = 0;
    deliveryMinutes = 1; // 1 minute for handoff
    confidence = 0.95;
    adjustments.push("Driver at dropoff, completing handoff");
  }

  // Ensure minimums
  const totalMinutes = Math.max(pickupMinutes + deliveryMinutes, MIN_ETA_MINUTES);
  pickupMinutes = Math.max(pickupMinutes, 0);
  deliveryMinutes = Math.max(deliveryMinutes, 0);
  confidence = Math.max(Math.min(confidence, 1.0), MIN_CONFIDENCE);

  logger.info(
    `ETA prediction for ${delivery.deliveryId}: ${totalMinutes.toFixed(1)} min (confidence: ${confidence.toFixed(2)})`,
    "realtimeTracker",
  );

  return {
    pickupMinutes: Math.round(pickupMinutes * 10) / 10,
    deliveryMinutes: Math.round(deliveryMinutes * 10) / 10,
    totalMinutes: Math.round(totalMinutes * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    adjustments,
  };
}

// ---------------------------------------------------------------------------
// Status State Machine
// ---------------------------------------------------------------------------

/**
 * Check if a status transition is valid according to the delivery lifecycle
 * state machine.
 *
 * @param from - Current delivery status
 * @param to - Proposed next status
 * @returns true if the transition is allowed
 */
export function isValidTransition(from: DeliveryStatus, to: DeliveryStatus): boolean {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed) {
    return false;
  }
  return allowed.includes(to);
}

/**
 * Transition a delivery to a new status, recording the transition in
 * the status history.
 *
 * This function enforces the state machine - invalid transitions are
 * rejected with an error. The original delivery object is NOT mutated;
 * a new object is returned.
 *
 * Side effects recorded:
 * - actualPickupTime set when transitioning to "picked_up"
 * - actualDeliveryTime set when transitioning to "delivered"
 * - Status history appended with transition record
 * - lastUpdate timestamp updated
 *
 * @param delivery - Current delivery tracking state
 * @param newStatus - Desired new status
 * @param reason - Human-readable reason for the transition
 * @param timestamp - Optional timestamp (defaults to Date.now())
 * @returns New delivery tracking state with updated status
 * @throws Error if the transition is not valid
 */
export function transitionStatus(
  delivery: DeliveryTracking,
  newStatus: DeliveryStatus,
  reason: string,
  timestamp?: number,
): DeliveryTracking {
  if (!isValidTransition(delivery.status, newStatus)) {
    const errorMsg = `Invalid status transition: ${delivery.status} -> ${newStatus} for delivery ${delivery.deliveryId}`;
    logger.error(errorMsg, undefined, "realtimeTracker");
    throw new Error(errorMsg);
  }

  const now = timestamp ?? Date.now();

  const transition: StatusTransition = {
    from: delivery.status,
    to: newStatus,
    timestamp: now,
    reason,
  };

  const updated: DeliveryTracking = {
    ...delivery,
    status: newStatus,
    statusHistory: [...delivery.statusHistory, transition],
    lastUpdate: now,
    actualPickupTime:
      newStatus === "picked_up" ? now : delivery.actualPickupTime,
    actualDeliveryTime:
      newStatus === "delivered" ? now : delivery.actualDeliveryTime,
  };

  logger.info(
    `Delivery ${delivery.deliveryId} transitioned: ${delivery.status} -> ${newStatus} (${reason})`,
    "realtimeTracker",
  );

  return updated;
}

// ---------------------------------------------------------------------------
// Delivery Tracking Factory
// ---------------------------------------------------------------------------

/**
 * Create a new delivery tracking object in the initial "pending" state.
 *
 * Sets up the tracking with pickup and dropoff locations and reasonable
 * initial ETA estimates based on straight-line distance.
 *
 * @param deliveryId - Unique identifier for this delivery
 * @param pickupLocation - Restaurant/pickup coordinates
 * @param dropoffLocation - Customer/delivery coordinates
 * @returns New delivery tracking in pending state
 */
export function createDeliveryTracking(
  deliveryId: string,
  pickupLocation: Coordinates,
  dropoffLocation: Coordinates,
): DeliveryTracking {
  const now = Date.now();

  // Initial ETA estimate based on distance
  const distance = haversineDistance(pickupLocation, dropoffLocation);
  const estimatedDeliveryMinutes = Math.max(
    (distance * 1.3 / DEFAULT_SPEED_KMH) * 60,
    MIN_ETA_MINUTES,
  );

  // Pickup ETA includes a buffer for driver assignment + travel
  const estimatedPickupMinutes = 10 + RESTAURANT_PREP_BUFFER_MINUTES;

  const tracking: DeliveryTracking = {
    deliveryId,
    status: "pending",
    driverLocation: null,
    pickupLocation: { ...pickupLocation },
    dropoffLocation: { ...dropoffLocation },
    estimatedPickupTime: now + estimatedPickupMinutes * 60 * 1000,
    estimatedDeliveryTime: now + (estimatedPickupMinutes + estimatedDeliveryMinutes) * 60 * 1000,
    actualPickupTime: null,
    actualDeliveryTime: null,
    statusHistory: [],
    lastUpdate: now,
  };

  logger.info(
    `Created delivery tracking: ${deliveryId} (est. ${estimatedDeliveryMinutes.toFixed(1)} min delivery)`,
    "realtimeTracker",
  );

  return tracking;
}

// ---------------------------------------------------------------------------
// Progress & Display Utilities
// ---------------------------------------------------------------------------

/**
 * Calculate the overall delivery progress as a percentage (0-100).
 *
 * Progress is computed based on the current status in the delivery
 * lifecycle. Each status corresponds to a milestone in the journey:
 *
 * - pending:        0%  - Waiting for driver assignment
 * - assigned:      10%  - Driver found, not yet moving
 * - picking_up:    25%  - Driver heading to restaurant
 * - at_restaurant: 40%  - Driver arrived, waiting for food
 * - picked_up:     50%  - Food collected, about to depart
 * - delivering:    65%  - Driver en route to customer
 * - at_dropoff:    90%  - Driver arrived at customer location
 * - delivered:    100%  - Handoff complete
 * - cancelled:      0%  - Order was cancelled
 * - failed:         0%  - Delivery failed
 *
 * For the "delivering" status, we further refine the progress based on
 * the driver's actual position between pickup and dropoff if location
 * data is available.
 *
 * @param delivery - Current delivery tracking state
 * @returns Progress percentage (0-100)
 */
export function calculateDeliveryProgress(delivery: DeliveryTracking): number {
  const statusProgress: Record<DeliveryStatus, number> = {
    pending: 0,
    assigned: 10,
    picking_up: 25,
    at_restaurant: 40,
    picked_up: 50,
    delivering: 65,
    at_dropoff: 90,
    delivered: 100,
    cancelled: 0,
    failed: 0,
  };

  const baseProgress = statusProgress[delivery.status];

  // Refine progress during active delivery leg based on actual position
  if (delivery.status === "delivering" && delivery.driverLocation) {
    const totalDistance = haversineDistance(
      delivery.pickupLocation,
      delivery.dropoffLocation,
    );
    const remainingDistance = haversineDistance(
      delivery.driverLocation,
      delivery.dropoffLocation,
    );

    if (totalDistance > 0) {
      const legProgress = Math.max(0, Math.min(1, 1 - remainingDistance / totalDistance));
      // Delivering spans 65% to 90%, so 25% range
      return Math.round(65 + legProgress * 25);
    }
  }

  // Refine progress during pickup leg based on actual position
  if (delivery.status === "picking_up" && delivery.driverLocation) {
    const totalPickupDistance = haversineDistance(
      delivery.driverLocation,
      delivery.pickupLocation,
    );
    // If very close to restaurant, bump progress toward at_restaurant (40%)
    if (totalPickupDistance < 0.2) {
      return 35;
    }
  }

  return baseProgress;
}

/**
 * Format an ETA in minutes into a human-readable string.
 *
 * Examples:
 * - 3 -> "3 min"
 * - 65 -> "1h 5min"
 * - 120 -> "2h 0min"
 * - 0.5 -> "1 min" (rounds up to minimum)
 *
 * @param minutes - ETA in minutes
 * @returns Formatted string
 */
export function formatETA(minutes: number): string {
  if (minutes < 0) {
    return "0 min";
  }

  const roundedMinutes = Math.max(Math.round(minutes), 0);

  if (roundedMinutes < 60) {
    return `${roundedMinutes} min`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  return `${hours}h ${remainingMinutes}min`;
}

// ---------------------------------------------------------------------------
// Driver Analysis Utilities
// ---------------------------------------------------------------------------

/**
 * Calculate the average speed in km/h from a series of location updates.
 *
 * Uses the total distance traveled divided by the total time elapsed.
 * Requires at least 2 location updates to compute a meaningful speed.
 *
 * This is preferred over using individual GPS speed readings because:
 * - GPS speed can be noisy, especially at low speeds
 * - Averaged speed better represents actual route progress
 * - Filters out brief stops at traffic lights
 *
 * @param locations - Array of location updates sorted by timestamp
 * @returns Average speed in km/h, or 0 if insufficient data
 */
export function calculateSpeedKmh(locations: LocationUpdate[]): number {
  if (locations.length < 2) {
    return 0;
  }

  // Sort by timestamp to ensure correct order
  const sorted = [...locations].sort((a, b) => a.timestamp - b.timestamp);

  let totalDistance = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev && curr) {
      totalDistance += haversineDistance(prev.coordinates, curr.coordinates);
    }
  }

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (!first || !last) {
    return 0;
  }

  const timeHours = (last.timestamp - first.timestamp) / (1000 * 60 * 60);

  if (timeHours <= 0) {
    return 0;
  }

  return totalDistance / timeHours;
}

/**
 * Detect if a driver has been stationary for longer than a threshold.
 *
 * A driver is considered stationary if all location updates within the
 * detection window show less than 50 meters of total movement. This
 * accounts for GPS drift while the device is stationary.
 *
 * Use cases:
 * - Alert if driver is stuck in traffic for too long
 * - Detect if driver stopped for a break during delivery
 * - Identify GPS spoofing (driver not moving but status changing)
 *
 * @param locations - Recent location updates for the driver
 * @param thresholdMinutes - Minutes of no movement to trigger detection (default 5)
 * @returns true if the driver appears stationary
 */
export function detectStationaryDriver(
  locations: LocationUpdate[],
  thresholdMinutes?: number,
): boolean {
  const threshold = thresholdMinutes ?? DEFAULT_STATIONARY_THRESHOLD_MINUTES;

  if (locations.length < 2) {
    return false;
  }

  const sorted = [...locations].sort((a, b) => a.timestamp - b.timestamp);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (!first || !last) {
    return false;
  }

  const durationMinutes = (last.timestamp - first.timestamp) / (1000 * 60);

  if (durationMinutes < threshold) {
    return false;
  }

  // Check total movement across all updates
  let totalMovement = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev && curr) {
      totalMovement += haversineDistance(prev.coordinates, curr.coordinates);
    }
  }

  return totalMovement < STATIONARY_THRESHOLD_KM;
}

/**
 * Process a batch of location updates and return the latest update per driver.
 *
 * In production, location updates arrive as a stream (e.g., via WebSocket
 * or SSE). This function deduplicates the batch, keeping only the most
 * recent update for each driver.
 *
 * @param updates - Batch of location updates from multiple drivers
 * @returns Map of driverId -> latest LocationUpdate
 */
export function batchUpdateLocations(
  updates: LocationUpdate[],
): Map<string, LocationUpdate> {
  const latestByDriver = new Map<string, LocationUpdate>();

  for (const update of updates) {
    const existing = latestByDriver.get(update.driverId);

    if (!existing || update.timestamp > existing.timestamp) {
      latestByDriver.set(update.driverId, update);
    }
  }

  logger.info(
    `Processed ${updates.length} location updates for ${latestByDriver.size} drivers`,
    "realtimeTracker",
  );

  return latestByDriver;
}

/**
 * Calculate the total delivery duration in minutes from assignment to completion.
 *
 * Returns null if the delivery hasn't been completed yet (no actual delivery
 * time recorded). Uses the status history to find the earliest assignment
 * timestamp as the start time.
 *
 * @param delivery - Delivery tracking state
 * @returns Duration in minutes, or null if not yet completed
 */
export function getDeliveryDuration(delivery: DeliveryTracking): number | null {
  if (!delivery.actualDeliveryTime) {
    return null;
  }

  // Find the assignment time from status history
  const assignedTransition = delivery.statusHistory.find(
    (t) => t.to === "assigned",
  );

  if (!assignedTransition) {
    // If no assignment transition, use the first status transition
    const firstTransition = delivery.statusHistory[0];
    if (!firstTransition) {
      return null;
    }
    return (delivery.actualDeliveryTime - firstTransition.timestamp) / (1000 * 60);
  }

  return (delivery.actualDeliveryTime - assignedTransition.timestamp) / (1000 * 60);
}

// ---------------------------------------------------------------------------
// Advanced Geofencing
// ---------------------------------------------------------------------------

/**
 * Create a set of geofence zones for a delivery.
 *
 * Standard geofences:
 * - Restaurant zone: 150m radius around pickup point
 * - Dropoff zone: 200m radius around delivery point
 *
 * The dropoff zone is slightly larger because:
 * - Customer addresses in Morocco may be approximate
 * - GPS accuracy degrades in dense urban areas
 * - Building entrances may be offset from the pin location
 *
 * @param deliveryId - Delivery identifier used for zone IDs
 * @param pickupLocation - Restaurant coordinates
 * @param dropoffLocation - Customer coordinates
 * @returns Array of geofence zones for this delivery
 */
function createDeliveryGeofences(
  deliveryId: string,
  pickupLocation: Coordinates,
  dropoffLocation: Coordinates,
): GeofenceZone[] {
  return [
    {
      id: `${deliveryId}-pickup`,
      center: { ...pickupLocation },
      radiusKm: 0.15,
      name: "Restaurant Pickup Zone",
      type: "restaurant",
    },
    {
      id: `${deliveryId}-dropoff`,
      center: { ...dropoffLocation },
      radiusKm: 0.2,
      name: "Customer Dropoff Zone",
      type: "dropoff",
    },
  ];
}

/**
 * Determine if a coordinate is likely within a medina zone.
 *
 * Uses simplified bounding boxes for Morocco's major medina areas.
 * These are approximations - a production system would use proper
 * polygon geofences loaded from a GIS database.
 *
 * Known medina zones:
 * - Fes el-Bali (largest car-free urban area in the world)
 * - Marrakech Medina (UNESCO World Heritage)
 * - Casablanca Old Medina
 * - Rabat Medina
 * - Tangier Medina
 * - Meknes Medina
 *
 * @param point - GPS coordinate to check
 * @returns true if the point is likely in a medina zone
 */
function isInMedinaZone(point: Coordinates): boolean {
  // Simplified medina bounding boxes [minLat, maxLat, minLng, maxLng]
  const medinaZones: [number, number, number, number][] = [
    // Fes el-Bali
    [34.059, 34.072, -4.985, -4.965],
    // Marrakech Medina
    [31.625, 31.640, -7.995, -7.975],
    // Casablanca Old Medina
    [33.597, 33.605, -7.617, -7.607],
    // Rabat Medina
    [34.020, 34.030, -6.845, -6.830],
    // Tangier Medina
    [35.783, 35.790, -5.815, -5.805],
    // Meknes Medina
    [33.888, 33.898, -5.575, -5.560],
  ];

  for (const [minLat, maxLat, minLng, maxLng] of medinaZones) {
    if (
      point.lat >= minLat &&
      point.lat <= maxLat &&
      point.lng >= minLng &&
      point.lng <= maxLng
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Determine the city a coordinate is in, based on proximity to city centers.
 *
 * Returns the name of the nearest Moroccan city that has a speed profile,
 * or null if the coordinate is more than 30km from any known city center.
 *
 * @param point - GPS coordinate
 * @returns City name (lowercase) or null
 */
function detectCity(point: Coordinates): string | null {
  const cityCenters: Record<string, Coordinates> = {
    casablanca: { lat: 33.5731, lng: -7.5898 },
    rabat: { lat: 34.0209, lng: -6.8417 },
    marrakech: { lat: 31.6295, lng: -7.9811 },
    fes: { lat: 34.0346, lng: -5.0145 },
    tangier: { lat: 35.7673, lng: -5.7998 },
    agadir: { lat: 30.4278, lng: -9.5981 },
    meknes: { lat: 33.8935, lng: -5.5473 },
    oujda: { lat: 34.6814, lng: -1.9086 },
    kenitra: { lat: 34.2610, lng: -6.5802 },
  };

  let nearestCity: string | null = null;
  let nearestDistance = Infinity;

  for (const [city, center] of Object.entries(cityCenters)) {
    const distance = haversineDistance(point, center);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCity = city;
    }
  }

  // Only return city if within 30km
  if (nearestDistance <= 30) {
    return nearestCity;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Delivery Duration Estimator (Advanced)
// ---------------------------------------------------------------------------

/**
 * Estimate the full delivery time including all legs and buffers.
 *
 * Legs:
 * 1. Driver travel to restaurant (pickup leg)
 * 2. Wait at restaurant for food preparation
 * 3. Driver travel to customer (delivery leg)
 *
 * This provides a more detailed breakdown than the simple estimateETA
 * function, considering restaurant wait times and real driver location.
 *
 * @param driverLocation - Current driver GPS position
 * @param pickupLocation - Restaurant coordinates
 * @param dropoffLocation - Customer coordinates
 * @param restaurantPrepMinutes - Expected food prep time (default 5)
 * @param city - Optional city for speed profile
 * @returns Detailed time breakdown in minutes
 */
function estimateFullDeliveryTime(
  driverLocation: Coordinates,
  pickupLocation: Coordinates,
  dropoffLocation: Coordinates,
  restaurantPrepMinutes: number = RESTAURANT_PREP_BUFFER_MINUTES,
  city?: string,
): {
  pickupLegMinutes: number;
  prepMinutes: number;
  deliveryLegMinutes: number;
  totalMinutes: number;
} {
  const isPickupInMediana = isInMedinaZone(pickupLocation);
  const isDropoffInMediana = isInMedinaZone(dropoffLocation);

  const pickupLegMinutes = estimateETA(
    driverLocation,
    pickupLocation,
    city ?? undefined,
    false,
    isPickupInMediana,
  );

  const deliveryLegMinutes = estimateETA(
    pickupLocation,
    dropoffLocation,
    city ?? undefined,
    false,
    isDropoffInMediana,
  );

  return {
    pickupLegMinutes,
    prepMinutes: restaurantPrepMinutes,
    deliveryLegMinutes,
    totalMinutes: pickupLegMinutes + restaurantPrepMinutes + deliveryLegMinutes,
  };
}

// ---------------------------------------------------------------------------
// Location Smoothing & Filtering
// ---------------------------------------------------------------------------

/**
 * Apply a simple moving average filter to smooth GPS coordinates.
 *
 * GPS readings can be noisy, especially in urban canyons (tall buildings)
 * common in Casablanca's business district or the narrow streets of
 * Fes medina. Smoothing reduces jitter in the displayed driver position.
 *
 * @param updates - Recent location updates (should be chronologically ordered)
 * @param windowSize - Number of readings to average (default 3)
 * @returns Smoothed coordinate
 */
function smoothLocation(
  updates: LocationUpdate[],
  windowSize: number = 3,
): Coordinates | null {
  if (updates.length === 0) {
    return null;
  }

  const window = updates.slice(-windowSize);

  if (window.length === 0) {
    return null;
  }

  let sumLat = 0;
  let sumLng = 0;

  for (const update of window) {
    sumLat += update.coordinates.lat;
    sumLng += update.coordinates.lng;
  }

  return {
    lat: sumLat / window.length,
    lng: sumLng / window.length,
  };
}

/**
 * Filter out location updates with poor GPS accuracy.
 *
 * Accuracy is reported by the GPS chip in meters - lower is better.
 * In Moroccan cities, typical accuracy ranges:
 * - Open areas (Agadir corniche): 3-5m
 * - Urban streets (Casablanca): 5-15m
 * - Dense medina (Fes): 15-50m (signal reflections off buildings)
 *
 * We reject readings above 100m accuracy as they would introduce
 * unacceptable error in distance/ETA calculations.
 *
 * @param updates - Raw location updates
 * @param maxAccuracyMeters - Maximum acceptable accuracy (default 100m)
 * @returns Filtered updates with acceptable accuracy
 */
function filterByAccuracy(
  updates: LocationUpdate[],
  maxAccuracyMeters: number = 100,
): LocationUpdate[] {
  return updates.filter((update) => update.accuracy <= maxAccuracyMeters);
}

/**
 * Detect potential GPS spoofing by checking for impossible movements.
 *
 * If a driver's reported location jumps more than what's physically
 * possible given the time between updates, it may indicate GPS spoofing
 * or a malfunctioning device.
 *
 * Maximum reasonable speed in Morocco is ~120 km/h (highway speed limit).
 * We use 150 km/h as threshold to account for GPS timing imprecision.
 *
 * @param previous - Previous location update
 * @param current - Current location update
 * @returns true if the movement appears suspicious
 */
function detectSuspiciousMovement(
  previous: LocationUpdate,
  current: LocationUpdate,
): boolean {
  const maxSpeedKmh = 150; // Well above any reasonable delivery speed
  const distance = haversineDistance(previous.coordinates, current.coordinates);
  const timeHours = (current.timestamp - previous.timestamp) / (1000 * 60 * 60);

  if (timeHours <= 0) {
    return distance > 0.01; // Simultaneous updates at different locations
  }

  const impliedSpeed = distance / timeHours;
  return impliedSpeed > maxSpeedKmh;
}

// ---------------------------------------------------------------------------
// Battery Monitoring
// ---------------------------------------------------------------------------

/**
 * Check if a driver's battery level is critically low.
 *
 * Smartphone GPS tracking is battery-intensive. In Morocco, where some
 * delivery drivers use older smartphones, battery management is important.
 *
 * Thresholds:
 * - > 20%: Normal operation
 * - 10-20%: Warning (suggest finding a charger)
 * - < 10%: Critical (may lose tracking soon)
 *
 * @param update - Latest location update with battery level
 * @returns Battery status: "normal" | "warning" | "critical"
 */
function checkBatteryLevel(
  update: LocationUpdate,
): "normal" | "warning" | "critical" {
  if (update.batteryLevel < 10) {
    logger.warn(
      `Driver ${update.driverId} battery critical: ${update.batteryLevel}%`,
      undefined,
      "realtimeTracker",
    );
    return "critical";
  }

  if (update.batteryLevel < 20) {
    return "warning";
  }

  return "normal";
}

// ---------------------------------------------------------------------------
// Route Analysis
// ---------------------------------------------------------------------------

/**
 * Calculate the total distance of a series of GPS points (polyline distance).
 *
 * Unlike Haversine between two points (which gives straight-line distance),
 * this sums up the distance along the actual recorded path segments.
 *
 * @param points - Array of coordinates forming a path
 * @returns Total distance in kilometers
 */
function calculatePathDistance(points: Coordinates[]): number {
  let totalDistance = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev && curr) {
      totalDistance += haversineDistance(prev, curr);
    }
  }

  return totalDistance;
}

/**
 * Calculate the route efficiency (ratio of straight-line to actual distance).
 *
 * A ratio of 1.0 means the driver took a perfectly straight path.
 * Typical urban delivery ratios:
 * - Modern grid cities: 1.2-1.4
 * - Moroccan urban areas: 1.3-1.6
 * - Medina zones: 1.5-2.5 (winding alleys)
 *
 * Very low efficiency (<0.5) may indicate the driver took a wrong turn
 * or is detouring. Very high efficiency (>0.95) is suspicious and may
 * indicate GPS interpolation rather than real readings.
 *
 * @param start - Route start coordinate
 * @param end - Route end coordinate
 * @param actualPath - Array of GPS readings along the route
 * @returns Efficiency ratio (0-1, where 1 = perfectly straight)
 */
function calculateRouteEfficiency(
  start: Coordinates,
  end: Coordinates,
  actualPath: Coordinates[],
): number {
  const straightLine = haversineDistance(start, end);

  if (straightLine === 0) {
    return 1; // Start and end are the same point
  }

  const actualDistance = calculatePathDistance([start, ...actualPath, end]);

  if (actualDistance === 0) {
    return 0;
  }

  return Math.min(straightLine / actualDistance, 1);
}

// ---------------------------------------------------------------------------
// Time Window Utilities
// ---------------------------------------------------------------------------

/**
 * Check if current time is during peak traffic hours in Morocco.
 *
 * Peak hours in Moroccan cities:
 * - Morning: 07:30 - 09:30 (school + work commute)
 * - Midday: 12:00 - 14:00 (lunch break, especially Friday)
 * - Evening: 17:30 - 20:00 (end of work + dinner prep)
 *
 * During Ramadan, evening peak shifts to 18:00-21:00 (iftar rush).
 *
 * @param date - Date to check (defaults to now)
 * @returns true if within peak traffic hours
 */
function isPeakHour(date?: Date): boolean {
  const d = date ?? new Date();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const timeInMinutes = hour * 60 + minute;

  // Morning peak: 07:30 - 09:30
  if (timeInMinutes >= 450 && timeInMinutes <= 570) {
    return true;
  }

  // Midday peak: 12:00 - 14:00
  if (timeInMinutes >= 720 && timeInMinutes <= 840) {
    return true;
  }

  // Evening peak: 17:30 - 20:00
  if (timeInMinutes >= 1050 && timeInMinutes <= 1200) {
    return true;
  }

  return false;
}

/**
 * Get the time-of-day delivery speed adjustment factor.
 *
 * Beyond peak hours, different times of day have different average
 * delivery speeds due to traffic patterns, restaurant readiness, etc.
 *
 * @param hour - Hour of day (0-23)
 * @returns Speed adjustment multiplier (1.0 = normal)
 */
function getTimeOfDaySpeedFactor(hour: number): number {
  // Late night (23:00 - 05:00): roads are clear
  if (hour >= 23 || hour < 5) {
    return 1.3;
  }

  // Early morning (05:00 - 07:00): light traffic
  if (hour >= 5 && hour < 7) {
    return 1.2;
  }

  // Morning rush (07:00 - 09:00): heavy traffic
  if (hour >= 7 && hour < 9) {
    return 0.7;
  }

  // Mid-morning (09:00 - 12:00): normal
  if (hour >= 9 && hour < 12) {
    return 1.0;
  }

  // Lunch rush (12:00 - 14:00): moderate traffic + high demand
  if (hour >= 12 && hour < 14) {
    return 0.8;
  }

  // Afternoon (14:00 - 17:00): normal
  if (hour >= 14 && hour < 17) {
    return 1.0;
  }

  // Evening rush (17:00 - 20:00): heavy traffic
  if (hour >= 17 && hour < 20) {
    return 0.7;
  }

  // Night (20:00 - 23:00): light traffic, high delivery demand
  return 1.1;
}

// ---------------------------------------------------------------------------
// Delivery Monitoring Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a delivery is at risk of being late.
 *
 * Compares current ETA against the original estimated delivery time.
 * A delivery is "at risk" if:
 * - It's running more than 15 minutes behind the original estimate
 * - The driver has been stationary for 5+ minutes during an active leg
 * - The delivery has been in the same status for an unusually long time
 *
 * @param delivery - Current delivery tracking state
 * @param currentETA - Latest ETA prediction
 * @returns Risk assessment
 */
function assessDeliveryRisk(
  delivery: DeliveryTracking,
  currentETA: ETAPrediction,
): {
  isAtRisk: boolean;
  riskLevel: "none" | "low" | "medium" | "high";
  reasons: string[];
} {
  const reasons: string[] = [];
  let riskScore = 0;

  // Check if running late vs original estimate
  const now = Date.now();
  const originalEstimate = delivery.estimatedDeliveryTime;
  const currentEstimate = now + currentETA.totalMinutes * 60 * 1000;

  const delayMinutes = (currentEstimate - originalEstimate) / (1000 * 60);

  if (delayMinutes > 30) {
    riskScore += 3;
    reasons.push(`Running ${Math.round(delayMinutes)} minutes behind schedule`);
  } else if (delayMinutes > 15) {
    riskScore += 2;
    reasons.push(`Running ${Math.round(delayMinutes)} minutes behind schedule`);
  } else if (delayMinutes > 5) {
    riskScore += 1;
    reasons.push(`Slightly behind schedule by ${Math.round(delayMinutes)} minutes`);
  }

  // Check if delivery has been in current status too long
  const lastTransition = delivery.statusHistory[delivery.statusHistory.length - 1];
  if (lastTransition) {
    const statusDurationMinutes = (now - lastTransition.timestamp) / (1000 * 60);

    const maxDurations: Partial<Record<DeliveryStatus, number>> = {
      assigned: 10,
      picking_up: 20,
      at_restaurant: 15,
      delivering: 45,
    };

    const maxDuration = maxDurations[delivery.status];
    if (maxDuration && statusDurationMinutes > maxDuration) {
      riskScore += 2;
      reasons.push(
        `In "${delivery.status}" status for ${Math.round(statusDurationMinutes)} min (expected <${maxDuration} min)`,
      );
    }
  }

  // Check low confidence
  if (currentETA.confidence < 0.5) {
    riskScore += 1;
    reasons.push(`Low ETA confidence: ${(currentETA.confidence * 100).toFixed(0)}%`);
  }

  let riskLevel: "none" | "low" | "medium" | "high" = "none";
  if (riskScore >= 4) {
    riskLevel = "high";
  } else if (riskScore >= 2) {
    riskLevel = "medium";
  } else if (riskScore >= 1) {
    riskLevel = "low";
  }

  return {
    isAtRisk: riskScore >= 2,
    riskLevel,
    reasons,
  };
}

/**
 * Generate a delivery status summary suitable for the customer-facing
 * tracking page.
 *
 * Returns a human-readable message for each delivery status along with
 * an appropriate icon suggestion for the UI.
 *
 * @param status - Current delivery status
 * @returns Object with message and icon name
 */
function getStatusMessage(
  status: DeliveryStatus,
): { message: string; icon: string } {
  const messages: Record<DeliveryStatus, { message: string; icon: string }> = {
    pending: {
      message: "Looking for a driver for your order...",
      icon: "search",
    },
    assigned: {
      message: "A driver has been assigned to your order!",
      icon: "user-check",
    },
    picking_up: {
      message: "Your driver is heading to the restaurant.",
      icon: "navigation",
    },
    at_restaurant: {
      message: "Your driver is at the restaurant, picking up your order.",
      icon: "store",
    },
    picked_up: {
      message: "Your order has been picked up!",
      icon: "package",
    },
    delivering: {
      message: "Your driver is on the way to you!",
      icon: "truck",
    },
    at_dropoff: {
      message: "Your driver has arrived! Please come collect your order.",
      icon: "map-pin",
    },
    delivered: {
      message: "Your order has been delivered. Enjoy your meal!",
      icon: "check-circle",
    },
    cancelled: {
      message: "This order has been cancelled.",
      icon: "x-circle",
    },
    failed: {
      message: "Delivery could not be completed. Please contact support.",
      icon: "alert-triangle",
    },
  };

  return messages[status];
}

// ---------------------------------------------------------------------------
// Coordinate Validation
// ---------------------------------------------------------------------------

/**
 * Validate that coordinates are within Morocco's bounding box.
 *
 * Morocco's approximate bounds:
 * - Latitude: 27.6 to 35.9 (from Sahara border to Mediterranean coast)
 * - Longitude: -13.2 to -1.0 (from Atlantic coast to Algeria border)
 *
 * This catches obvious errors like swapped lat/lng or coordinates
 * in a completely different country.
 *
 * @param coords - Coordinates to validate
 * @returns true if coordinates are within Morocco
 */
function isInMorocco(coords: Coordinates): boolean {
  return (
    coords.lat >= 27.6 &&
    coords.lat <= 35.9 &&
    coords.lng >= -13.2 &&
    coords.lng <= -1.0
  );
}

/**
 * Validate coordinates are reasonable GPS values.
 *
 * @param coords - Coordinates to validate
 * @returns true if coordinates are valid GPS values
 */
function isValidCoordinates(coords: Coordinates): boolean {
  if (typeof coords.lat !== "number" || typeof coords.lng !== "number") {
    return false;
  }

  if (isNaN(coords.lat) || isNaN(coords.lng)) {
    return false;
  }

  // Valid GPS ranges
  if (coords.lat < -90 || coords.lat > 90) {
    return false;
  }

  if (coords.lng < -180 || coords.lng > 180) {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Bulk Operations
// ---------------------------------------------------------------------------

/**
 * Update ETA predictions for multiple active deliveries at once.
 *
 * This is called periodically (e.g., every 30 seconds) to refresh all
 * active delivery ETAs based on the latest driver locations.
 *
 * @param deliveries - Array of active delivery tracking states
 * @param driverLocations - Map of driverId -> latest location
 * @param city - Optional city for speed profiles
 * @returns Map of deliveryId -> updated ETAPrediction
 */
function batchUpdateETAs(
  deliveries: DeliveryTracking[],
  driverLocations: Map<string, LocationUpdate>,
  city?: string,
): Map<string, ETAPrediction> {
  const predictions = new Map<string, ETAPrediction>();

  for (const delivery of deliveries) {
    const eta = predictDeliveryETA(delivery, undefined, city);
    predictions.set(delivery.deliveryId, eta);
  }

  logger.info(
    `Batch ETA update: ${predictions.size} deliveries recalculated`,
    "realtimeTracker",
  );

  return predictions;
}

/**
 * Get all deliveries that are currently at risk of being late.
 *
 * Scans active deliveries and returns those with medium or high risk.
 * Used by the operations dashboard to prioritize interventions.
 *
 * @param deliveries - Array of active delivery tracking states
 * @param city - Optional city for ETA calculations
 * @returns Array of at-risk deliveries with their risk assessments
 */
function getAtRiskDeliveries(
  deliveries: DeliveryTracking[],
  city?: string,
): Array<{
  delivery: DeliveryTracking;
  risk: ReturnType<typeof assessDeliveryRisk>;
  eta: ETAPrediction;
}> {
  const atRisk: Array<{
    delivery: DeliveryTracking;
    risk: ReturnType<typeof assessDeliveryRisk>;
    eta: ETAPrediction;
  }> = [];

  for (const delivery of deliveries) {
    const terminalStatuses: DeliveryStatus[] = ["delivered", "cancelled", "failed"];
    if (terminalStatuses.includes(delivery.status)) {
      continue;
    }

    const eta = predictDeliveryETA(delivery, undefined, city);
    const risk = assessDeliveryRisk(delivery, eta);

    if (risk.isAtRisk) {
      atRisk.push({ delivery, risk, eta });
    }
  }

  // Sort by risk level (high first)
  const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
  atRisk.sort((a, b) => (riskOrder[a.risk.riskLevel] ?? 3) - (riskOrder[b.risk.riskLevel] ?? 3));

  return atRisk;
}

// ---------------------------------------------------------------------------
// Tracking Statistics
// ---------------------------------------------------------------------------

/**
 * Calculate aggregate tracking statistics for a set of completed deliveries.
 *
 * Used for the operations dashboard to show daily/weekly performance
 * metrics for delivery speed and reliability.
 *
 * @param deliveries - Array of completed delivery tracking states
 * @returns Aggregate statistics
 */
function calculateTrackingStats(deliveries: DeliveryTracking[]): {
  totalDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  cancelledDeliveries: number;
  averageDurationMinutes: number;
  medianDurationMinutes: number;
  onTimePercentage: number;
} {
  const completed = deliveries.filter((d) => d.status === "delivered");
  const failed = deliveries.filter((d) => d.status === "failed");
  const cancelled = deliveries.filter((d) => d.status === "cancelled");

  const durations: number[] = [];
  let onTimeCount = 0;

  for (const delivery of completed) {
    const duration = getDeliveryDuration(delivery);
    if (duration !== null) {
      durations.push(duration);
    }

    // Check if delivered before the original estimate
    if (
      delivery.actualDeliveryTime &&
      delivery.actualDeliveryTime <= delivery.estimatedDeliveryTime
    ) {
      onTimeCount++;
    }
  }

  // Calculate average
  const averageDuration =
    durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

  // Calculate median
  const sortedDurations = [...durations].sort((a, b) => a - b);
  const medianDuration =
    sortedDurations.length > 0
      ? sortedDurations.length % 2 === 0
        ? ((sortedDurations[sortedDurations.length / 2 - 1] ?? 0) +
            (sortedDurations[sortedDurations.length / 2] ?? 0)) /
          2
        : (sortedDurations[Math.floor(sortedDurations.length / 2)] ?? 0)
      : 0;

  return {
    totalDeliveries: deliveries.length,
    completedDeliveries: completed.length,
    failedDeliveries: failed.length,
    cancelledDeliveries: cancelled.length,
    averageDurationMinutes: Math.round(averageDuration * 10) / 10,
    medianDurationMinutes: Math.round(medianDuration * 10) / 10,
    onTimePercentage:
      completed.length > 0
        ? Math.round((onTimeCount / completed.length) * 100 * 10) / 10
        : 0,
  };
}

// ---------------------------------------------------------------------------
// Driver Proximity Utilities
// ---------------------------------------------------------------------------

/**
 * Find drivers within a given radius of a location.
 *
 * Used during order assignment to identify candidate drivers near a
 * restaurant. The results are sorted by distance (nearest first).
 *
 * @param targetLocation - The location to search around (typically a restaurant)
 * @param driverLocations - Map of driverId -> latest location update
 * @param radiusKm - Search radius in kilometers (default 5)
 * @returns Array of { driverId, distance, update } sorted by distance
 */
function findNearbyDrivers(
  targetLocation: Coordinates,
  driverLocations: Map<string, LocationUpdate>,
  radiusKm: number = 5,
): Array<{ driverId: string; distanceKm: number; update: LocationUpdate }> {
  const nearby: Array<{
    driverId: string;
    distanceKm: number;
    update: LocationUpdate;
  }> = [];

  for (const [driverId, update] of driverLocations) {
    const distance = haversineDistance(targetLocation, update.coordinates);

    if (distance <= radiusKm) {
      nearby.push({
        driverId,
        distanceKm: Math.round(distance * 100) / 100,
        update,
      });
    }
  }

  // Sort by distance (nearest first)
  nearby.sort((a, b) => a.distanceKm - b.distanceKm);

  return nearby;
}

/**
 * Estimate arrival time for a driver at a specific location.
 *
 * Considers the driver's current speed, heading (to determine if they're
 * heading toward or away), and city traffic conditions.
 *
 * @param driver - Latest driver location update
 * @param destination - Target location
 * @param city - Optional city for speed profile
 * @returns Estimated minutes to arrival
 */
function estimateDriverArrival(
  driver: LocationUpdate,
  destination: Coordinates,
  city?: string,
): number {
  const distance = haversineDistance(driver.coordinates, destination);
  const roadDistance = distance * 1.3;

  // Use driver's current speed if available and reasonable
  let effectiveSpeed: number;

  if (driver.speed > 0 && driver.speed < 120) {
    // Check if driver is heading toward the destination
    const bearing = calculateBearing(driver.coordinates, destination);
    const headingDiff = Math.abs(bearing - driver.heading);
    const normalizedDiff = headingDiff > 180 ? 360 - headingDiff : headingDiff;

    if (normalizedDiff < 45) {
      // Heading roughly toward destination: use current speed
      effectiveSpeed = driver.speed;
    } else if (normalizedDiff < 90) {
      // Heading somewhat sideways: blend current and average speed
      effectiveSpeed = (driver.speed + DEFAULT_SPEED_KMH) / 2;
    } else {
      // Heading away: use average speed (will need to turn around)
      effectiveSpeed = city
        ? getEffectiveTravelSpeed(city, false, false)
        : DEFAULT_SPEED_KMH;
    }
  } else {
    effectiveSpeed = city
      ? getEffectiveTravelSpeed(city, false, false)
      : DEFAULT_SPEED_KMH;
  }

  const minutes = (roadDistance / effectiveSpeed) * 60;
  return Math.max(minutes, MIN_ETA_MINUTES);
}

// ---------------------------------------------------------------------------
// Coordinate Interpolation
// ---------------------------------------------------------------------------

/**
 * Interpolate between two coordinates by a given fraction.
 *
 * Used for:
 * - Animating driver position on the map between GPS updates
 * - Estimating driver position when updates are delayed
 * - Creating intermediate points for route visualization
 *
 * @param from - Starting coordinate
 * @param to - Ending coordinate
 * @param fraction - Interpolation fraction (0 = from, 1 = to)
 * @returns Interpolated coordinate
 */
function interpolateCoordinates(
  from: Coordinates,
  to: Coordinates,
  fraction: number,
): Coordinates {
  const clampedFraction = Math.max(0, Math.min(1, fraction));

  return {
    lat: from.lat + (to.lat - from.lat) * clampedFraction,
    lng: from.lng + (to.lng - from.lng) * clampedFraction,
  };
}

/**
 * Predict a driver's position at a future time based on current velocity.
 *
 * Uses dead reckoning: extrapolates position from current location,
 * speed, and heading. Accuracy degrades rapidly after ~30 seconds.
 *
 * @param current - Current location update with speed and heading
 * @param futureTimestamp - Target timestamp in milliseconds
 * @returns Predicted coordinates
 */
function predictDriverPosition(
  current: LocationUpdate,
  futureTimestamp: number,
): Coordinates {
  const elapsedHours = (futureTimestamp - current.timestamp) / (1000 * 60 * 60);

  if (elapsedHours <= 0 || current.speed <= 0) {
    return { ...current.coordinates };
  }

  // Convert heading to radians
  const headingRad = (current.heading * Math.PI) / 180;

  // Distance traveled at current speed
  const distanceKm = current.speed * elapsedHours;

  // Convert distance to degrees (approximate)
  const latDelta = (distanceKm / EARTH_RADIUS_KM) * (180 / Math.PI) * Math.cos(headingRad);
  const lngDelta =
    ((distanceKm / EARTH_RADIUS_KM) * (180 / Math.PI) * Math.sin(headingRad)) /
    Math.cos((current.coordinates.lat * Math.PI) / 180);

  return {
    lat: current.coordinates.lat + latDelta,
    lng: current.coordinates.lng + lngDelta,
  };
}

// ---------------------------------------------------------------------------
// Export aggregation (internal helpers exposed for testing if needed)
// ---------------------------------------------------------------------------

// The following functions are primarily internal but exported for
// comprehensive testing and potential use by other delivery modules:
export {
  createDeliveryGeofences,
  isInMedinaZone,
  detectCity,
  estimateFullDeliveryTime,
  smoothLocation,
  filterByAccuracy,
  detectSuspiciousMovement,
  checkBatteryLevel,
  calculatePathDistance,
  calculateRouteEfficiency,
  isPeakHour,
  getTimeOfDaySpeedFactor,
  assessDeliveryRisk,
  getStatusMessage,
  isInMorocco,
  isValidCoordinates,
  batchUpdateETAs,
  getAtRiskDeliveries,
  calculateTrackingStats,
  findNearbyDrivers,
  estimateDriverArrival,
  interpolateCoordinates,
  predictDriverPosition,
};
