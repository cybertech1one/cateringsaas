/**
 * Route Optimization Module
 *
 * Provides route optimization algorithms for multi-stop delivery planning.
 * Implements nearest neighbor heuristic, 2-opt improvement, and multi-stop
 * route planning with constraint validation.
 *
 * These algorithms are designed for the Moroccan delivery context where:
 * - Typical route has 2-8 stops (small enough for exact-ish solutions)
 * - Road networks are irregular (medina zones, one-way streets)
 * - Pickup-before-dropoff constraints are critical (food freshness)
 * - Time windows matter (customer availability, restaurant closing times)
 *
 * All distances use Haversine (straight-line) with a 1.3x road winding
 * factor. A production system would integrate with a routing API (OSRM,
 * Google Directions) for actual road distances.
 */

import { logger } from "~/server/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteStop {
  id: string;
  location: Coordinates;
  type: "pickup" | "dropoff";
  orderId: string;
  timeWindowStart?: number;
  timeWindowEnd?: number;
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistanceKm: number;
  estimatedMinutes: number;
  savings: {
    distanceKm: number;
    minutes: number;
  };
}

export interface RouteConstraint {
  type: "pickup_before_dropoff" | "time_window" | "max_distance";
  orderId?: string;
  maxValue?: number;
}

export interface InsertionResult {
  route: RouteStop[];
  insertIndex: number;
  additionalDistance: number;
  isValid: boolean;
}

export interface MultiStopPlan {
  routes: OptimizedRoute[];
  unassignedStops: RouteStop[];
  totalDistance: number;
  totalTime: number;
}

export interface RouteMetrics {
  totalDistanceKm: number;
  totalTimeMinutes: number;
  numberOfStops: number;
  averageStopDistanceKm: number;
  longestLegKm: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Earth radius in kilometers (mean radius, WGS84) */
const EARTH_RADIUS_KM = 6371;

/** Road winding factor: actual road distance / straight-line distance */
const ROAD_WINDING_FACTOR = 1.3;

/** Default average speed for delivery drivers in Morocco (km/h) */
const DEFAULT_SPEED_KMH = 22;

/** Default maximum iterations for 2-opt improvement */
const DEFAULT_TWO_OPT_MAX_ITERATIONS = 1000;

/** Default maximum stops per route in multi-stop planning */
const DEFAULT_MAX_STOPS_PER_ROUTE = 8;

/** Average time spent at each stop in minutes (pickup or dropoff) */
const STOP_SERVICE_TIME_MINUTES = 3;

/** Minimum improvement in 2-opt to continue iterating (km) */
const TWO_OPT_MIN_IMPROVEMENT = 0.01;

// ---------------------------------------------------------------------------
// Geo Utilities
// ---------------------------------------------------------------------------

/**
 * Calculate the great-circle distance between two coordinates using the
 * Haversine formula.
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

  return (bearingDeg + 360) % 360;
}

/**
 * Calculate the total road distance along a sequence of coordinates.
 *
 * Sums Haversine distances between consecutive points and applies the
 * road winding factor. This gives an approximation of actual road distance.
 *
 * @param stops - Array of coordinates forming a path
 * @returns Total estimated road distance in kilometers
 */
export function calculateRouteDistance(stops: Coordinates[]): number {
  if (stops.length < 2) return 0;

  let totalDistance = 0;

  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const curr = stops[i];
    if (prev && curr) {
      totalDistance += haversineDistance(prev, curr);
    }
  }

  return totalDistance * ROAD_WINDING_FACTOR;
}

// ---------------------------------------------------------------------------
// Route Segment Utilities
// ---------------------------------------------------------------------------

/**
 * Calculate the straight-line distance of a route's stops.
 *
 * Unlike calculateRouteDistance, this does NOT apply the winding factor.
 * Used internally for optimization comparisons where we need raw distances.
 *
 * @param stops - Array of route stops
 * @returns Total straight-line distance in km
 */
function rawRouteDistance(stops: RouteStop[]): number {
  if (stops.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const curr = stops[i];
    if (prev && curr) {
      total += haversineDistance(prev.location, curr.location);
    }
  }

  return total;
}

/**
 * Calculate the road distance of a route's stops (with winding factor).
 *
 * @param stops - Array of route stops
 * @returns Total road distance in km
 */
function roadRouteDistance(stops: RouteStop[]): number {
  return rawRouteDistance(stops) * ROAD_WINDING_FACTOR;
}

/**
 * Calculate distance from a starting coordinate through all route stops.
 *
 * @param start - Starting coordinate (driver's current location)
 * @param stops - Route stops to visit
 * @returns Total road distance including from start to first stop
 */
function totalRouteDistanceFromStart(
  start: Coordinates,
  stops: RouteStop[],
): number {
  if (stops.length === 0) return 0;

  const firstStop = stops[0];
  if (!firstStop) return 0;

  let distance = haversineDistance(start, firstStop.location);

  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const curr = stops[i];
    if (prev && curr) {
      distance += haversineDistance(prev.location, curr.location);
    }
  }

  return distance * ROAD_WINDING_FACTOR;
}

// ---------------------------------------------------------------------------
// Reverse Segment (for 2-opt)
// ---------------------------------------------------------------------------

/**
 * Reverse a segment of a route between indices i and j (inclusive).
 *
 * This is the core operation of the 2-opt algorithm. It takes a route
 * and reverses the order of stops between positions i and j, which
 * effectively "uncrosses" intersecting route segments.
 *
 * Example: Route [A, B, C, D, E] with i=1, j=3
 * Result: [A, D, C, B, E]
 *
 * The original array is NOT mutated; a new array is returned.
 *
 * @param route - Current route stop order
 * @param i - Start index of segment to reverse (inclusive)
 * @param j - End index of segment to reverse (inclusive)
 * @returns New route with the segment reversed
 */
export function reverseSegment(
  route: RouteStop[],
  i: number,
  j: number,
): RouteStop[] {
  const newRoute = [...route];

  let left = Math.min(i, j);
  let right = Math.max(i, j);

  while (left < right) {
    const leftStop = newRoute[left];
    const rightStop = newRoute[right];

    if (leftStop && rightStop) {
      newRoute[left] = rightStop;
      newRoute[right] = leftStop;
    }

    left++;
    right--;
  }

  return newRoute;
}

// ---------------------------------------------------------------------------
// Nearest Neighbor Algorithm
// ---------------------------------------------------------------------------

/**
 * Generate a route using the nearest neighbor heuristic.
 *
 * Starting from the driver's current position, greedily selects the
 * closest unvisited stop at each step. This produces a reasonable
 * initial route quickly but is not optimal.
 *
 * Time complexity: O(n^2) where n = number of stops
 * Quality: Typically within 20-25% of optimal for small stop counts
 *
 * For Diyafa's typical use case (2-8 stops), this provides a good
 * starting point that the 2-opt algorithm can then improve.
 *
 * @param start - Driver's starting coordinates
 * @param stops - Array of stops to visit
 * @returns Optimized route with distance and time estimates
 */
export function nearestNeighborRoute(
  start: Coordinates,
  stops: RouteStop[],
): OptimizedRoute {
  if (stops.length === 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      estimatedMinutes: 0,
      savings: { distanceKm: 0, minutes: 0 },
    };
  }

  if (stops.length === 1) {
    const firstStop = stops[0]!;
    const distance = haversineDistance(start, firstStop.location) * ROAD_WINDING_FACTOR;
    const minutes = (distance / DEFAULT_SPEED_KMH) * 60 + STOP_SERVICE_TIME_MINUTES;

    return {
      stops: [...stops],
      totalDistanceKm: Math.round(distance * 100) / 100,
      estimatedMinutes: Math.round(minutes * 10) / 10,
      savings: { distanceKm: 0, minutes: 0 },
    };
  }

  const ordered: RouteStop[] = [];
  const remaining = [...stops];
  let currentLocation = start;

  // Calculate original distance (input order) for savings comparison
  const originalDistance = totalRouteDistanceFromStart(start, stops);

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const stop = remaining[i];
      if (!stop) continue;

      const dist = haversineDistance(currentLocation, stop.location);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    const nearest = remaining[nearestIndex];
    if (!nearest) break;

    ordered.push(nearest);
    currentLocation = nearest.location;
    remaining.splice(nearestIndex, 1);
  }

  const optimizedDistance = totalRouteDistanceFromStart(start, ordered);
  const totalMinutes =
    (optimizedDistance / DEFAULT_SPEED_KMH) * 60 +
    ordered.length * STOP_SERVICE_TIME_MINUTES;

  const distanceSaved = originalDistance - optimizedDistance;
  const minutesSaved = (distanceSaved / DEFAULT_SPEED_KMH) * 60;

  logger.info(
    `Nearest neighbor: ${ordered.length} stops, ${optimizedDistance.toFixed(2)}km (saved ${distanceSaved.toFixed(2)}km)`,
    "routeOptimizer",
  );

  return {
    stops: ordered,
    totalDistanceKm: Math.round(optimizedDistance * 100) / 100,
    estimatedMinutes: Math.round(totalMinutes * 10) / 10,
    savings: {
      distanceKm: Math.round(Math.max(distanceSaved, 0) * 100) / 100,
      minutes: Math.round(Math.max(minutesSaved, 0) * 10) / 10,
    },
  };
}

// ---------------------------------------------------------------------------
// 2-Opt Improvement
// ---------------------------------------------------------------------------

/**
 * Improve a route using the 2-opt local search algorithm.
 *
 * 2-opt works by iteratively removing two edges from the route and
 * reconnecting the remaining segments in a different way. If the new
 * route is shorter, the improvement is kept.
 *
 * For each pair of edges (i, i+1) and (j, j+1):
 * - Remove these edges
 * - Reverse the segment between i+1 and j
 * - Check if the new route is shorter
 *
 * The algorithm terminates when:
 * - No improvement is found in a full pass (local optimum)
 * - Maximum iterations reached
 * - Improvement is below the minimum threshold
 *
 * Time complexity: O(n^2) per iteration, typically 5-20 iterations
 * Quality: Produces near-optimal solutions for small stop counts (<15)
 *
 * @param route - Initial route to improve
 * @param maxIterations - Maximum number of improvement passes
 * @returns Improved route stop order
 */
export function twoOptImprove(
  route: RouteStop[],
  maxIterations?: number,
): RouteStop[] {
  const maxIter = maxIterations ?? DEFAULT_TWO_OPT_MAX_ITERATIONS;

  if (route.length < 3) {
    return [...route];
  }

  let bestRoute = [...route];
  let bestDistance = rawRouteDistance(bestRoute);
  let improved = true;
  let iterations = 0;

  while (improved && iterations < maxIter) {
    improved = false;
    iterations++;

    for (let i = 0; i < bestRoute.length - 1; i++) {
      for (let j = i + 2; j < bestRoute.length; j++) {
        // Try reversing the segment between i+1 and j
        const newRoute = reverseSegment(bestRoute, i + 1, j);
        const newDistance = rawRouteDistance(newRoute);

        if (bestDistance - newDistance > TWO_OPT_MIN_IMPROVEMENT) {
          bestRoute = newRoute;
          bestDistance = newDistance;
          improved = true;
        }
      }
    }
  }

  if (iterations > 1) {
    logger.info(
      `2-opt improved route in ${iterations} iterations`,
      "routeOptimizer",
    );
  }

  return bestRoute;
}

// ---------------------------------------------------------------------------
// Constraint Validation
// ---------------------------------------------------------------------------

/**
 * Validate a route against a set of constraints.
 *
 * Supported constraint types:
 *
 * 1. pickup_before_dropoff: For each order, the pickup stop must appear
 *    before the dropoff stop in the route. This is critical for food
 *    delivery - you can't deliver food before picking it up!
 *
 * 2. time_window: Each stop must be reached within its time window.
 *    Uses estimated travel times to check feasibility.
 *
 * 3. max_distance: Total route distance must not exceed the specified
 *    maximum. Prevents unreasonably long routes.
 *
 * @param route - Route to validate
 * @param constraints - Array of constraints to check
 * @returns Validation result with any violation descriptions
 */
export function validateRouteConstraints(
  route: RouteStop[],
  constraints: RouteConstraint[],
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const constraint of constraints) {
    switch (constraint.type) {
      case "pickup_before_dropoff": {
        // Check all orders: pickup must come before dropoff
        const orderIds = new Set(
          constraint.orderId
            ? [constraint.orderId]
            : route.map((s) => s.orderId),
        );

        for (const orderId of orderIds) {
          const pickupIndex = route.findIndex(
            (s) => s.orderId === orderId && s.type === "pickup",
          );
          const dropoffIndex = route.findIndex(
            (s) => s.orderId === orderId && s.type === "dropoff",
          );

          if (pickupIndex >= 0 && dropoffIndex >= 0 && pickupIndex > dropoffIndex) {
            violations.push(
              `Order ${orderId}: dropoff (position ${dropoffIndex}) before pickup (position ${pickupIndex})`,
            );
          }
        }
        break;
      }

      case "time_window": {
        // Estimate arrival times and check against windows
        let elapsedMinutes = 0;
        const startTime = Date.now();

        for (let i = 0; i < route.length; i++) {
          const stop = route[i];
          if (!stop) continue;

          if (i > 0) {
            const prevStop = route[i - 1];
            if (prevStop) {
              const dist = haversineDistance(prevStop.location, stop.location) * ROAD_WINDING_FACTOR;
              elapsedMinutes += (dist / DEFAULT_SPEED_KMH) * 60;
              elapsedMinutes += STOP_SERVICE_TIME_MINUTES;
            }
          }

          const estimatedArrival = startTime + elapsedMinutes * 60 * 1000;

          if (stop.timeWindowEnd && estimatedArrival > stop.timeWindowEnd) {
            violations.push(
              `Stop ${stop.id}: estimated arrival exceeds time window end`,
            );
          }
        }
        break;
      }

      case "max_distance": {
        if (constraint.maxValue !== undefined) {
          const totalDistance = roadRouteDistance(route);
          if (totalDistance > constraint.maxValue) {
            violations.push(
              `Route distance (${totalDistance.toFixed(2)}km) exceeds maximum (${constraint.maxValue}km)`,
            );
          }
        }
        break;
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

// ---------------------------------------------------------------------------
// Constraint-Aware Optimization
// ---------------------------------------------------------------------------

/**
 * Check if a route satisfies pickup-before-dropoff constraints.
 *
 * For every order in the route, verifies that the pickup stop appears
 * before the corresponding dropoff stop.
 *
 * @param route - Route to check
 * @returns true if all pickups precede their dropoffs
 */
function satisfiesPickupBeforeDropoff(route: RouteStop[]): boolean {
  const pickupPositions = new Map<string, number>();

  for (let i = 0; i < route.length; i++) {
    const stop = route[i];
    if (!stop) continue;

    if (stop.type === "pickup") {
      pickupPositions.set(stop.orderId, i);
    } else if (stop.type === "dropoff") {
      const pickupPos = pickupPositions.get(stop.orderId);
      if (pickupPos === undefined || pickupPos > i) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Apply pickup-before-dropoff constraint repair to a route.
 *
 * If 2-opt or other optimizations produce a route where a dropoff
 * precedes its pickup, this function repairs it by moving the pickup
 * to just before the dropoff.
 *
 * @param route - Route that may violate constraints
 * @returns Repaired route
 */
function repairPickupBeforeDropoff(route: RouteStop[]): RouteStop[] {
  const result = [...route];
  let changed = true;

  // Iterate until no more repairs needed (max 100 to prevent infinite loops)
  let iterations = 0;
  while (changed && iterations < 100) {
    changed = false;
    iterations++;

    for (let i = 0; i < result.length; i++) {
      const stop = result[i];
      if (!stop || stop.type !== "dropoff") continue;

      // Find the corresponding pickup
      const pickupIndex = result.findIndex(
        (s, idx) => s.orderId === stop.orderId && s.type === "pickup" && idx > i,
      );

      if (pickupIndex > i) {
        // Pickup is after dropoff - move pickup to just before dropoff
        const pickup = result[pickupIndex];
        if (pickup) {
          result.splice(pickupIndex, 1);
          result.splice(i, 0, pickup);
          changed = true;
          break; // Restart scan after modification
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main Optimization Function
// ---------------------------------------------------------------------------

/**
 * Optimize a route using nearest neighbor + 2-opt with constraint validation.
 *
 * This is the primary route optimization function that combines:
 * 1. Nearest neighbor to generate an initial solution
 * 2. 2-opt to improve the solution
 * 3. Constraint repair to ensure validity
 * 4. Constraint validation as a final check
 *
 * If constraints are provided, the function ensures the final route
 * satisfies all of them. If 2-opt breaks a constraint, the repair
 * function attempts to fix it while maintaining most of the optimization.
 *
 * @param start - Driver's current coordinates
 * @param stops - Array of stops to visit
 * @param constraints - Optional array of route constraints
 * @returns Optimized route with metrics and savings
 */
export function optimizeRoute(
  start: Coordinates,
  stops: RouteStop[],
  constraints?: RouteConstraint[],
): OptimizedRoute {
  if (stops.length === 0) {
    return {
      stops: [],
      totalDistanceKm: 0,
      estimatedMinutes: 0,
      savings: { distanceKm: 0, minutes: 0 },
    };
  }

  // Step 1: Generate initial route with nearest neighbor
  const nnResult = nearestNeighborRoute(start, stops);

  if (nnResult.stops.length <= 2) {
    // Too few stops for 2-opt to help
    return nnResult;
  }

  // Calculate original distance for savings comparison
  const originalDistance = totalRouteDistanceFromStart(start, stops);

  // Step 2: Improve with 2-opt
  let optimizedStops = twoOptImprove(nnResult.stops);

  // Step 3: Repair constraints if needed
  const hasPickupConstraint =
    constraints?.some((c) => c.type === "pickup_before_dropoff") ??
    // Auto-detect: if route has both pickups and dropoffs, enforce constraint
    (stops.some((s) => s.type === "pickup") && stops.some((s) => s.type === "dropoff"));

  if (hasPickupConstraint && !satisfiesPickupBeforeDropoff(optimizedStops)) {
    optimizedStops = repairPickupBeforeDropoff(optimizedStops);

    logger.info(
      "Applied pickup-before-dropoff constraint repair after 2-opt",
      "routeOptimizer",
    );
  }

  // Step 4: Validate all constraints
  if (constraints && constraints.length > 0) {
    const validation = validateRouteConstraints(optimizedStops, constraints);
    if (!validation.valid) {
      logger.warn(
        `Route has ${validation.violations.length} constraint violations after optimization: ${validation.violations.join("; ")}`,
        undefined,
        "routeOptimizer",
      );
    }
  }

  // Calculate final metrics
  const finalDistance = totalRouteDistanceFromStart(start, optimizedStops);
  const totalMinutes =
    (finalDistance / DEFAULT_SPEED_KMH) * 60 +
    optimizedStops.length * STOP_SERVICE_TIME_MINUTES;
  const distanceSaved = originalDistance - finalDistance;
  const minutesSaved = (distanceSaved / DEFAULT_SPEED_KMH) * 60;

  logger.info(
    `Route optimized: ${optimizedStops.length} stops, ${finalDistance.toFixed(2)}km, saved ${distanceSaved.toFixed(2)}km`,
    "routeOptimizer",
  );

  return {
    stops: optimizedStops,
    totalDistanceKm: Math.round(finalDistance * 100) / 100,
    estimatedMinutes: Math.round(totalMinutes * 10) / 10,
    savings: {
      distanceKm: Math.round(Math.max(distanceSaved, 0) * 100) / 100,
      minutes: Math.round(Math.max(minutesSaved, 0) * 10) / 10,
    },
  };
}

// ---------------------------------------------------------------------------
// Insertion Heuristic
// ---------------------------------------------------------------------------

/**
 * Find the best position to insert a new stop into an existing route.
 *
 * Tests every possible insertion position and selects the one that
 * adds the least additional distance. This is useful for dynamically
 * adding new orders to an in-progress route.
 *
 * The insertion respects pickup-before-dropoff ordering: if the new
 * stop is a dropoff, it will only be inserted after the corresponding
 * pickup. If it's a pickup, it will be inserted before the dropoff.
 *
 * @param route - Existing route stops
 * @param newStop - New stop to insert
 * @returns Insertion result with best position and additional distance
 */
export function findBestInsertion(
  route: RouteStop[],
  newStop: RouteStop,
): InsertionResult {
  if (route.length === 0) {
    return {
      route: [newStop],
      insertIndex: 0,
      additionalDistance: 0,
      isValid: true,
    };
  }

  let bestIndex = 0;
  let bestAdditionalDistance = Infinity;
  let bestRoute: RouteStop[] = [];

  // Find constraint bounds for this order
  let minIndex = 0;
  let maxIndex = route.length;

  if (newStop.type === "dropoff") {
    // Must be after the pickup for this order
    const pickupIndex = route.findIndex(
      (s) => s.orderId === newStop.orderId && s.type === "pickup",
    );
    if (pickupIndex >= 0) {
      minIndex = pickupIndex + 1;
    }
  } else if (newStop.type === "pickup") {
    // Must be before the dropoff for this order
    const dropoffIndex = route.findIndex(
      (s) => s.orderId === newStop.orderId && s.type === "dropoff",
    );
    if (dropoffIndex >= 0) {
      maxIndex = dropoffIndex;
    }
  }

  for (let i = minIndex; i <= maxIndex; i++) {
    // Calculate additional distance for inserting at position i
    const candidateRoute = [...route];
    candidateRoute.splice(i, 0, newStop);

    let additionalDistance: number;

    if (i === 0) {
      // Inserting at the beginning
      const next = route[0];
      if (next) {
        additionalDistance =
          haversineDistance(newStop.location, next.location) * ROAD_WINDING_FACTOR;
      } else {
        additionalDistance = 0;
      }
    } else if (i === route.length) {
      // Inserting at the end
      const prev = route[route.length - 1];
      if (prev) {
        additionalDistance =
          haversineDistance(prev.location, newStop.location) * ROAD_WINDING_FACTOR;
      } else {
        additionalDistance = 0;
      }
    } else {
      // Inserting in the middle: remove old edge, add two new edges
      const prev = route[i - 1];
      const next = route[i];

      if (prev && next) {
        const oldDistance = haversineDistance(prev.location, next.location);
        const newDistance =
          haversineDistance(prev.location, newStop.location) +
          haversineDistance(newStop.location, next.location);
        additionalDistance = (newDistance - oldDistance) * ROAD_WINDING_FACTOR;
      } else {
        additionalDistance = 0;
      }
    }

    if (additionalDistance < bestAdditionalDistance) {
      bestAdditionalDistance = additionalDistance;
      bestIndex = i;
      bestRoute = candidateRoute;
    }
  }

  // Validate the best insertion
  const isValid = satisfiesPickupBeforeDropoff(bestRoute);

  return {
    route: bestRoute,
    insertIndex: bestIndex,
    additionalDistance: Math.round(Math.max(bestAdditionalDistance, 0) * 100) / 100,
    isValid,
  };
}

// ---------------------------------------------------------------------------
// Multi-Stop Route Planning
// ---------------------------------------------------------------------------

/**
 * Plan routes for multiple stops, splitting into sub-routes if needed.
 *
 * When there are more stops than a single driver can efficiently handle,
 * this function splits them into multiple routes. Each route respects
 * the maximum stops limit and keeps pickup/dropoff pairs together.
 *
 * Algorithm:
 * 1. Group stops by order (pickup + dropoff pairs)
 * 2. Assign order groups to routes using nearest-neighbor clustering
 * 3. Optimize each sub-route independently
 * 4. Report any stops that couldn't be assigned
 *
 * @param start - Driver's starting coordinates
 * @param stops - All stops to plan
 * @param maxStopsPerRoute - Maximum stops in a single route (default 8)
 * @returns Multi-stop plan with routes and any unassigned stops
 */
export function planMultiStopRoute(
  start: Coordinates,
  stops: RouteStop[],
  maxStopsPerRoute?: number,
): MultiStopPlan {
  const maxStops = maxStopsPerRoute ?? DEFAULT_MAX_STOPS_PER_ROUTE;

  if (stops.length === 0) {
    return {
      routes: [],
      unassignedStops: [],
      totalDistance: 0,
      totalTime: 0,
    };
  }

  // If all stops fit in one route, just optimize directly
  if (stops.length <= maxStops) {
    const optimized = optimizeRoute(start, stops, [
      { type: "pickup_before_dropoff" },
    ]);

    return {
      routes: [optimized],
      unassignedStops: [],
      totalDistance: optimized.totalDistanceKm,
      totalTime: optimized.estimatedMinutes,
    };
  }

  // Group stops by orderId to keep pairs together
  const orderGroups = new Map<string, RouteStop[]>();
  for (const stop of stops) {
    const group = orderGroups.get(stop.orderId) ?? [];
    group.push(stop);
    orderGroups.set(stop.orderId, group);
  }

  // Assign order groups to routes
  const routeGroups: RouteStop[][] = [[]];
  let currentRouteIndex = 0;

  // Sort order groups by distance from start (nearest first)
  const sortedGroups = [...orderGroups.entries()].sort((a, b) => {
    const aPickup = a[1].find((s) => s.type === "pickup");
    const bPickup = b[1].find((s) => s.type === "pickup");

    const aDist = aPickup ? haversineDistance(start, aPickup.location) : Infinity;
    const bDist = bPickup ? haversineDistance(start, bPickup.location) : Infinity;

    return aDist - bDist;
  });

  for (const [, groupStops] of sortedGroups) {
    const currentRoute = routeGroups[currentRouteIndex];
    if (!currentRoute) break;

    if (currentRoute.length + groupStops.length > maxStops) {
      // Start a new route
      currentRouteIndex++;
      routeGroups.push([]);
    }

    const targetRoute = routeGroups[currentRouteIndex];
    if (targetRoute) {
      targetRoute.push(...groupStops);
    }
  }

  // Optimize each sub-route
  const optimizedRoutes: OptimizedRoute[] = [];
  const unassigned: RouteStop[] = [];
  let totalDistance = 0;
  let totalTime = 0;

  for (const routeStops of routeGroups) {
    if (routeStops.length === 0) continue;

    const optimized = optimizeRoute(start, routeStops, [
      { type: "pickup_before_dropoff" },
    ]);

    optimizedRoutes.push(optimized);
    totalDistance += optimized.totalDistanceKm;
    totalTime += optimized.estimatedMinutes;
  }

  logger.info(
    `Multi-stop plan: ${stops.length} stops split into ${optimizedRoutes.length} routes, total ${totalDistance.toFixed(2)}km`,
    "routeOptimizer",
  );

  return {
    routes: optimizedRoutes,
    unassignedStops: unassigned,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalTime: Math.round(totalTime * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// Route Metrics
// ---------------------------------------------------------------------------

/**
 * Calculate comprehensive metrics for a route.
 *
 * Provides statistics useful for:
 * - Driver compensation (total distance)
 * - Performance monitoring (average leg distance)
 * - Route quality assessment (longest leg detection)
 * - ETA communication (total time)
 *
 * @param stops - Array of route stops
 * @returns Route metrics including distances, times, and averages
 */
export function calculateRouteMetrics(stops: RouteStop[]): RouteMetrics {
  if (stops.length === 0) {
    return {
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      numberOfStops: 0,
      averageStopDistanceKm: 0,
      longestLegKm: 0,
    };
  }

  if (stops.length === 1) {
    return {
      totalDistanceKm: 0,
      totalTimeMinutes: STOP_SERVICE_TIME_MINUTES,
      numberOfStops: 1,
      averageStopDistanceKm: 0,
      longestLegKm: 0,
    };
  }

  let totalDistance = 0;
  let longestLeg = 0;

  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const curr = stops[i];
    if (prev && curr) {
      const legDistance = haversineDistance(prev.location, curr.location) * ROAD_WINDING_FACTOR;
      totalDistance += legDistance;

      if (legDistance > longestLeg) {
        longestLeg = legDistance;
      }
    }
  }

  const numberOfStops = stops.length;
  const averageDistance = numberOfStops > 1
    ? totalDistance / (numberOfStops - 1)
    : 0;

  const totalTime =
    (totalDistance / DEFAULT_SPEED_KMH) * 60 +
    numberOfStops * STOP_SERVICE_TIME_MINUTES;

  return {
    totalDistanceKm: Math.round(totalDistance * 100) / 100,
    totalTimeMinutes: Math.round(totalTime * 10) / 10,
    numberOfStops,
    averageStopDistanceKm: Math.round(averageDistance * 100) / 100,
    longestLegKm: Math.round(longestLeg * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Route Time Estimation
// ---------------------------------------------------------------------------

/**
 * Estimate the total time to complete a route in minutes.
 *
 * Accounts for:
 * - Travel time between stops (based on distance and speed)
 * - Service time at each stop (pickup or dropoff)
 *
 * @param stops - Route stops in order
 * @param averageSpeedKmh - Average driver speed (default 22 km/h)
 * @returns Total estimated time in minutes
 */
export function estimateRouteTime(
  stops: RouteStop[],
  averageSpeedKmh?: number,
): number {
  const speed = averageSpeedKmh ?? DEFAULT_SPEED_KMH;

  if (stops.length === 0) return 0;

  let totalMinutes = 0;

  // Travel time between consecutive stops
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const curr = stops[i];
    if (prev && curr) {
      const distance = haversineDistance(prev.location, curr.location) * ROAD_WINDING_FACTOR;
      totalMinutes += (distance / speed) * 60;
    }
  }

  // Service time at each stop
  totalMinutes += stops.length * STOP_SERVICE_TIME_MINUTES;

  return Math.round(totalMinutes * 10) / 10;
}

// ---------------------------------------------------------------------------
// Advanced Utilities
// ---------------------------------------------------------------------------

/**
 * Split stops into balanced clusters for multi-driver assignment.
 *
 * Uses a simple geographic clustering approach: sorts stops by distance
 * from center and assigns alternating groups. This produces reasonably
 * balanced clusters without complex algorithms.
 *
 * @param stops - All stops to cluster
 * @param numClusters - Number of clusters (e.g., number of drivers)
 * @returns Array of stop clusters
 */
function clusterStops(
  stops: RouteStop[],
  numClusters: number,
): RouteStop[][] {
  if (numClusters <= 1 || stops.length <= numClusters) {
    return stops.length > 0 ? [stops] : [];
  }

  // Find geographic center
  let sumLat = 0;
  let sumLng = 0;
  for (const stop of stops) {
    sumLat += stop.location.lat;
    sumLng += stop.location.lng;
  }
  const center: Coordinates = {
    lat: sumLat / stops.length,
    lng: sumLng / stops.length,
  };

  // Sort by angle from center (geographic clustering)
  const withAngle = stops.map((stop) => ({
    stop,
    angle: Math.atan2(
      stop.location.lng - center.lng,
      stop.location.lat - center.lat,
    ),
  }));

  withAngle.sort((a, b) => a.angle - b.angle);

  // Distribute into clusters
  const clusters: RouteStop[][] = Array.from(
    { length: numClusters },
    () => [],
  );

  for (let i = 0; i < withAngle.length; i++) {
    const item = withAngle[i];
    const cluster = clusters[i % numClusters];
    if (item && cluster) {
      cluster.push(item.stop);
    }
  }

  return clusters.filter((c) => c.length > 0);
}

/**
 * Calculate the detour ratio for adding a new stop to a route.
 *
 * The detour ratio represents how much the route deviates from the
 * direct path when the new stop is inserted. A ratio of 1.0 means
 * no detour; higher values indicate more deviation.
 *
 * @param currentRoute - Current route stops
 * @param newStop - Stop to potentially add
 * @param start - Driver's start location
 * @returns Detour ratio (1.0 = no detour, >1.0 = detour)
 */
function calculateDetourRatio(
  currentRoute: RouteStop[],
  newStop: RouteStop,
  start: Coordinates,
): number {
  const currentDistance = totalRouteDistanceFromStart(start, currentRoute);

  if (currentDistance === 0) return 1.0;

  const insertion = findBestInsertion(currentRoute, newStop);
  const newDistance = totalRouteDistanceFromStart(start, insertion.route);

  return newDistance / currentDistance;
}

/**
 * Estimate fuel cost for a route based on distance.
 *
 * Morocco fuel prices (approximate, 2024):
 * - Gasoline: ~14 MAD/liter
 * - Diesel: ~12 MAD/liter
 *
 * Typical delivery vehicle fuel consumption:
 * - Motorcycle: ~3 L/100km
 * - Small car: ~7 L/100km
 *
 * @param distanceKm - Route distance in kilometers
 * @param vehicleType - "motorcycle" or "car"
 * @returns Estimated fuel cost in centimes
 */
function estimateFuelCost(
  distanceKm: number,
  vehicleType: "motorcycle" | "car" = "motorcycle",
): number {
  const fuelRates = {
    motorcycle: { consumption: 3, pricePerLiter: 1400 }, // 3 L/100km, 14 MAD/L
    car: { consumption: 7, pricePerLiter: 1200 }, // 7 L/100km, 12 MAD/L
  };

  const rate = fuelRates[vehicleType];
  const litersUsed = (distanceKm * rate.consumption) / 100;
  const costCentimes = Math.round(litersUsed * rate.pricePerLiter);

  return costCentimes;
}

/**
 * Compare two routes and determine which is better.
 *
 * Considers both distance and time, with configurable weights.
 * By default, distance is weighted 60% and time 40% since fuel cost
 * is a major driver expense in Morocco.
 *
 * @param routeA - First route
 * @param routeB - Second route
 * @param distanceWeight - Weight for distance (default 0.6)
 * @returns "A" | "B" | "equal"
 */
function compareRoutes(
  routeA: OptimizedRoute,
  routeB: OptimizedRoute,
  distanceWeight: number = 0.6,
): "A" | "B" | "equal" {
  const timeWeight = 1 - distanceWeight;

  // Normalize metrics for comparison
  const maxDist = Math.max(routeA.totalDistanceKm, routeB.totalDistanceKm, 1);
  const maxTime = Math.max(routeA.estimatedMinutes, routeB.estimatedMinutes, 1);

  const scoreA =
    (routeA.totalDistanceKm / maxDist) * distanceWeight +
    (routeA.estimatedMinutes / maxTime) * timeWeight;

  const scoreB =
    (routeB.totalDistanceKm / maxDist) * distanceWeight +
    (routeB.estimatedMinutes / maxTime) * timeWeight;

  if (Math.abs(scoreA - scoreB) < 0.01) return "equal";
  return scoreA < scoreB ? "A" : "B";
}

/**
 * Generate route alternatives by trying different starting approaches.
 *
 * Instead of always using nearest-neighbor as the initial solution,
 * this generates multiple initial solutions using different strategies
 * and returns the best one after 2-opt improvement.
 *
 * Strategies:
 * 1. Nearest neighbor (greedy by distance)
 * 2. Farthest first (visit farthest stops early)
 * 3. Random shuffles (for diversity)
 *
 * @param start - Driver's starting coordinates
 * @param stops - Array of stops to visit
 * @param numAlternatives - Number of alternatives to try (default 3)
 * @returns Best route found across all alternatives
 */
function generateRouteAlternatives(
  start: Coordinates,
  stops: RouteStop[],
  numAlternatives: number = 3,
): OptimizedRoute {
  if (stops.length <= 2) {
    return optimizeRoute(start, stops);
  }

  const candidates: OptimizedRoute[] = [];

  // Strategy 1: Standard nearest neighbor + 2-opt
  candidates.push(optimizeRoute(start, stops));

  // Strategy 2: Farthest first
  if (numAlternatives >= 2) {
    const farthestFirst = [...stops].sort((a, b) => {
      const distA = haversineDistance(start, a.location);
      const distB = haversineDistance(start, b.location);
      return distB - distA; // Farthest first
    });

    const ffImproved = twoOptImprove(farthestFirst);
    const ffDistance = totalRouteDistanceFromStart(start, ffImproved);
    const ffTime = (ffDistance / DEFAULT_SPEED_KMH) * 60 + ffImproved.length * STOP_SERVICE_TIME_MINUTES;

    candidates.push({
      stops: ffImproved,
      totalDistanceKm: Math.round(ffDistance * 100) / 100,
      estimatedMinutes: Math.round(ffTime * 10) / 10,
      savings: { distanceKm: 0, minutes: 0 },
    });
  }

  // Strategy 3: Random shuffle (deterministic pseudo-random via sorting)
  if (numAlternatives >= 3) {
    const shuffled = [...stops].sort((a, b) => {
      // Deterministic shuffle based on ID hash
      const hashA = a.id.split("").reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
      const hashB = b.id.split("").reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
      return hashA - hashB;
    });

    const shImproved = twoOptImprove(shuffled);
    const shDistance = totalRouteDistanceFromStart(start, shImproved);
    const shTime = (shDistance / DEFAULT_SPEED_KMH) * 60 + shImproved.length * STOP_SERVICE_TIME_MINUTES;

    candidates.push({
      stops: shImproved,
      totalDistanceKm: Math.round(shDistance * 100) / 100,
      estimatedMinutes: Math.round(shTime * 10) / 10,
      savings: { distanceKm: 0, minutes: 0 },
    });
  }

  // Select the best candidate by distance
  let best = candidates[0]!;
  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate && candidate.totalDistanceKm < best.totalDistanceKm) {
      best = candidate;
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// Export internal helpers for testing
// ---------------------------------------------------------------------------

export {
  rawRouteDistance,
  roadRouteDistance,
  totalRouteDistanceFromStart,
  satisfiesPickupBeforeDropoff,
  repairPickupBeforeDropoff,
  clusterStops,
  calculateDetourRatio,
  estimateFuelCost,
  compareRoutes,
  generateRouteAlternatives,
};
