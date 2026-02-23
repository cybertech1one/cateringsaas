# Delivery Driver Network: Systems Architecture & Algorithms Research

**Date:** 2026-02-21
**Scope:** Technical architecture for building a food delivery driver network for Diyafa (Morocco)
**Depth:** Deep / Exhaustive
**Confidence:** High (primary sources: DoorDash Engineering, Uber Engineering, academic papers, production systems)

---

## Table of Contents

1. [Order Assignment Algorithms](#1-order-assignment-algorithms)
2. [Route Optimization](#2-route-optimization)
3. [Dynamic Pricing & Surge](#3-dynamic-pricing--surge)
4. [Anti-Fraud Systems](#4-anti-fraud-systems)
5. [Driver Quality Scoring](#5-driver-quality-scoring)
6. [Real-Time Systems Architecture](#6-real-time-systems-architecture)
7. [Driver Onboarding Pipeline](#7-driver-onboarding-pipeline)
8. [Payment Settlement](#8-payment-settlement)
9. [Database Schema](#9-database-schema)
10. [Technology Recommendations for Diyafa](#10-technology-recommendations-for-diyafa)

---

## 1. Order Assignment Algorithms

### 1.1 Industry Evolution (Level 0 -> Level X)

The industry has evolved through distinct stages of sophistication:

**Level 0 - Nearest Driver (Greedy)**
Assign the closest idle driver to each order as it arrives. Simple but globally suboptimal.

```
function assignNearestDriver(order):
  drivers = getAvailableDrivers()
  nearest = null
  minDist = Infinity
  for driver in drivers:
    dist = haversine(driver.location, order.restaurant.location)
    if dist < minDist:
      minDist = dist
      nearest = driver
  return nearest
```

Problems: ignores future orders, no batching, inefficient at scale.

**Level 1 - Batch Assignment (Hungarian Algorithm)**
Accumulate orders during restaurant prep time, then solve as a bipartite matching problem. DoorDash's original system used this approach.

The Hungarian Algorithm solves the assignment problem in O(n^3) time by finding the minimum-cost matching in a bipartite graph where one side is drivers and the other is orders.

```
function batchAssign(orders[], drivers[]):
  // Build cost matrix
  costMatrix = new Matrix(len(orders), len(drivers))
  for i in range(len(orders)):
    for j in range(len(drivers)):
      costMatrix[i][j] = computeCost(orders[i], drivers[j])

  // Cost includes:
  // - Travel time from driver to restaurant
  // - Waiting cost if driver arrives early (driver idle time * costPerMinute)
  // - Delay cost if driver arrives late (food waiting * qualityDecayRate)
  // - Customer distance from restaurant (delivery time impact)

  assignments = hungarianAlgorithm(costMatrix)
  return assignments

function computeCost(order, driver):
  travelToRestaurant = estimateTravelTime(driver.location, order.restaurant.location)
  prepTimeRemaining = order.estimatedPrepTime - order.elapsedTime

  waitCost = max(0, travelToRestaurant - prepTimeRemaining) * IDLE_COST_PER_MIN
  delayCost = max(0, prepTimeRemaining - travelToRestaurant) * FOOD_WAIT_COST_PER_MIN
  deliveryTime = estimateTravelTime(order.restaurant.location, order.customer.location)

  return (WEIGHT_TRAVEL * travelToRestaurant
        + WEIGHT_WAIT * waitCost
        + WEIGHT_DELAY * delayCost
        + WEIGHT_DELIVERY * deliveryTime
        + WEIGHT_DRIVER_SCORE * (1 - driver.qualityScore))
```

**Level 2 - Multi-Order Pooling**
When demand exceeds supply, group multiple orders from the same restaurant or nearby restaurants into single driver routes. Extends Hungarian by generating multi-order routes as unified work units.

**Level X - Mixed-Integer Programming (DoorDash's Current Approach)**
DoorDash moved to MIP solved by Gurobi, which is 10x faster than Hungarian for large instances and supports multi-delivery routes natively.

### 1.2 DoorDash's DeepRed Dispatch System

DoorDash's production system (DeepRed) uses ML + MIP in a two-stage pipeline:

**Stage 1: ML Estimation**
- Predict restaurant prep time (features: historical avg, current order volume, time of day, menu complexity)
- Predict travel time (features: distance, traffic, weather, road type)
- Predict delivery success probability per driver-order pair

**Stage 2: MIP Optimization**
Decision variables: binary x_{ij} = 1 if driver i assigned to route j

```
Minimize:
  SUM over all (i,j) of cost_{ij} * x_{ij}

Subject to:
  // Each order assigned to exactly one route
  SUM over j of x_{ij} = 1, for all orders i

  // Each driver assigned at most one route
  SUM over i of x_{ij} <= 1, for all drivers j

  // Route capacity constraints
  orders_in_route(j) <= MAX_ORDERS_PER_ROUTE

  // Time window constraints
  delivery_time(i, j) <= order.maxDeliveryTime

  // Driver availability
  x_{ij} = 0 if driver j is unavailable
```

Solved using Gurobi commercial solver. For Diyafa's scale in Morocco, open-source CBC or HiGHS solvers would suffice initially.

### 1.3 Batch Window Timing

```
DISPATCH_INTERVAL = 30 seconds  // How often the optimizer runs
MAX_BATCH_WINDOW = 120 seconds  // Maximum time an order waits for batching

function dispatchLoop():
  while true:
    sleep(DISPATCH_INTERVAL)

    pendingOrders = getOrdersAwaitingAssignment()
    availableDrivers = getAvailableDriversInZone()

    if len(pendingOrders) == 0 or len(availableDrivers) == 0:
      continue

    // Separate urgent orders (waited > threshold or perishable)
    urgent = pendingOrders.filter(o => o.waitTime > MAX_BATCH_WINDOW
                                    or o.priority == 'high')
    normal = pendingOrders.filter(o => o not in urgent)

    // Solve urgent orders first (greedy nearest-driver)
    for order in urgent:
      driver = findBestAvailableDriver(order)
      if driver:
        assignOrder(order, driver)
        availableDrivers.remove(driver)

    // Batch-optimize remaining
    if len(normal) > 0 and len(availableDrivers) > 0:
      assignments = solveMIP(normal, availableDrivers)
      executeAssignments(assignments)
```

### 1.4 Order Priority Scoring

```
function calculatePriority(order):
  score = 0

  // Base priority by order type
  score += ORDER_TYPE_WEIGHTS[order.type]  // delivery=10, pickup=5, dine_in=3

  // Time urgency (exponential decay)
  waitMinutes = (now() - order.createdAt) / 60000
  score += min(50, waitMinutes * waitMinutes * 0.5)  // Quadratic urgency

  // Customer value (loyalty/subscription tier)
  score += CUSTOMER_TIER_BONUS[order.customer.tier]  // pro=15, free=0

  // Order value
  score += min(20, order.totalAmount / 100)  // Cap at 20 points

  // Food perishability
  if order.containsIceCream or order.containsHotFood:
    score += 10

  // Restaurant SLA (promised time approaching)
  if order.promisedDeliveryTime:
    minutesUntilPromise = (order.promisedDeliveryTime - now()) / 60000
    if minutesUntilPromise < 15:
      score += (15 - minutesUntilPromise) * 3

  return score
```

### 1.5 Driver Acceptance & Timeout

```
OFFER_TIMEOUT = 45 seconds     // Time driver has to accept
MAX_REJECTIONS = 3             // Re-offer limit before re-queuing
COOLDOWN_AFTER_REJECT = 60     // Seconds before offering to same driver again

function offerOrderToDriver(order, driver):
  offer = createOffer(order, driver, expiresAt: now() + OFFER_TIMEOUT)
  sendPushNotification(driver, offer)

  // Wait for response or timeout
  response = awaitResponse(offer, timeout: OFFER_TIMEOUT)

  if response == ACCEPTED:
    confirmAssignment(order, driver)
    updateDriverStatus(driver, 'on_delivery')
    return SUCCESS

  if response == REJECTED or response == TIMEOUT:
    order.rejectionCount++
    driver.recentRejections++

    if order.rejectionCount >= MAX_REJECTIONS:
      // Increase incentive or expand search radius
      order.bonusAmount += 5  // Add 5 MAD bonus
      order.searchRadius *= 1.5

    // Re-enter assignment queue with higher priority
    order.priority += 10
    requeueOrder(order)
    return REASSIGN_NEEDED
```

### 1.6 Multi-Order Batching from Same Restaurant

```
function identifyBatchCandidates(pendingOrders):
  // Group orders by restaurant
  restaurantGroups = groupBy(pendingOrders, o => o.restaurantId)

  batches = []
  for restaurantId, orders in restaurantGroups:
    if len(orders) < 2:
      continue

    // Sort by prep time completion
    orders.sortBy(o => o.estimatedReadyAt)

    // Cluster orders with similar ready times (within 10 min window)
    clusters = clusterByTime(orders, maxGap: 10 * 60 * 1000)

    for cluster in clusters:
      // Check if delivery addresses are geographically compatible
      // (all within reasonable detour of each other)
      if isRouteFeasible(cluster, maxDetourRatio: 1.4):
        batches.append({
          restaurantId,
          orders: cluster,
          estimatedSaving: calculateTimeSaving(cluster)
        })

  return batches

function isRouteFeasible(orders, maxDetourRatio):
  // Direct delivery time for each order individually
  totalDirect = sum(orders.map(o =>
    travelTime(o.restaurant.location, o.customer.location)))

  // Optimal multi-drop route time
  optimalRoute = solveMultiDropTSP(
    start: orders[0].restaurant.location,
    drops: orders.map(o => o.customer.location)
  )

  return optimalRoute.totalTime / totalDirect <= maxDetourRatio
```

---

## 2. Route Optimization

### 2.1 Algorithm Selection

| Algorithm | Use Case | Complexity | Quality |
|-----------|----------|------------|---------|
| Nearest Neighbor Heuristic | Quick single-driver routing | O(n^2) | ~75% optimal |
| 2-opt / 3-opt | Local search improvement | O(n^2) per iteration | ~90% optimal |
| Google OR-Tools (CVRPTW) | Multi-vehicle with constraints | Varies (solver) | ~95% optimal |
| VROOM | Real-time multi-vehicle | Milliseconds for 100s of points | ~93% optimal |
| LKH-3 | TSP/VRP heuristic | O(n^2.2) | ~98% optimal |

**Recommendation for Diyafa:** Start with VROOM for real-time routing (open-source, millisecond responses, handles pickups and deliveries). Graduate to Google OR-Tools for more complex constraints.

### 2.2 VROOM Integration Architecture

```
// VROOM API request for multi-pickup, multi-drop optimization
POST /optimize
{
  "vehicles": [
    {
      "id": 1,
      "profile": "motorbike",   // Important for Morocco (many moto drivers)
      "start": [driver.lng, driver.lat],
      "capacity": [3],           // Max 3 orders
      "time_window": [now, now + 7200]  // 2-hour shift window
    }
  ],
  "shipments": [
    {
      "pickup": {
        "id": 101,
        "location": [restaurant.lng, restaurant.lat],
        "service": 300,          // 5 min pickup time
        "time_windows": [[readyAt, readyAt + 900]]  // 15 min window
      },
      "delivery": {
        "id": 201,
        "location": [customer.lng, customer.lat],
        "service": 120,          // 2 min dropoff time
        "time_windows": [[0, maxDeliveryTime]]
      },
      "amount": [1]              // Takes 1 unit of capacity
    }
  ]
}
```

VROOM returns an optimized sequence of stops with ETAs in milliseconds. It integrates with OSRM, Openrouteservice, and Valhalla for actual road-network travel times.

### 2.3 OSRM Self-Hosted Setup for Morocco

```yaml
# docker-compose.yml for OSRM with Morocco data
services:
  osrm-backend:
    image: osrm/osrm-backend:latest
    ports:
      - "5000:5000"
    volumes:
      - ./osrm-data:/data
    command: osrm-routed --algorithm mld /data/morocco-latest.osrm

  osrm-frontend:
    image: osrm/osrm-frontend:latest
    ports:
      - "9966:9966"
    environment:
      - OSRM_BACKEND=http://osrm-backend:5000
```

```bash
# One-time setup: Download and process Morocco OSM data
wget https://download.geofabrik.de/africa/morocco-latest.osm.pbf
docker run -v $(pwd):/data osrm/osrm-backend osrm-extract -p /opt/car.lua /data/morocco-latest.osm.pbf
docker run -v $(pwd):/data osrm/osrm-backend osrm-partition /data/morocco-latest.osrm
docker run -v $(pwd):/data osrm/osrm-backend osrm-customize /data/morocco-latest.osrm
```

Self-hosted OSRM gives: distance matrix, fastest route, nearest road snap, and trip optimization. Free, no API limits, sub-10ms response times.

### 2.4 Real-Time Re-Routing

```
function onNewOrderAssigned(driver, newOrder):
  currentRoute = driver.activeRoute

  // Get remaining stops
  remainingStops = currentRoute.stops.filter(s => s.status == 'pending')

  // Add new pickup and delivery to the stop list
  newStops = [
    { type: 'pickup', location: newOrder.restaurant.location,
      readyAt: newOrder.estimatedReadyAt, orderId: newOrder.id },
    { type: 'delivery', location: newOrder.customer.location,
      deadline: newOrder.maxDeliveryTime, orderId: newOrder.id }
  ]

  allStops = remainingStops.concat(newStops)

  // Re-optimize with constraints:
  // - Pickup must come before delivery for same order
  // - Respect time windows
  // - Minimize total route time
  optimizedRoute = vroomOptimize({
    vehicle: { start: driver.currentLocation, capacity: [3] },
    shipments: buildShipments(allStops),
    constraints: buildPrecedenceConstraints(allStops)
  })

  // Update driver's route
  driver.activeRoute = optimizedRoute
  notifyDriver(driver, 'route_updated', optimizedRoute)

  // Update all affected customer ETAs
  for stop in optimizedRoute.stops.filter(s => s.type == 'delivery'):
    updateCustomerETA(stop.orderId, stop.estimatedArrival)
```

### 2.5 ETA Prediction Model

Based on Uber's DeepETA architecture, decompose the prediction into segments:

```
totalETA = prepTime + driverToRestaurant + pickupTime + restaurantToCustomer + dropoffTime

// Each component has its own model/estimation:

function predictPrepTime(order):
  features = {
    restaurant_avg_prep_7d: getAvgPrepTime(order.restaurantId, days=7),
    restaurant_avg_prep_1h: getAvgPrepTime(order.restaurantId, hours=1),
    current_pending_orders: getPendingOrderCount(order.restaurantId),
    order_item_count: order.items.length,
    order_complexity: calculateComplexity(order.items),  // grilled items take longer
    day_of_week: dayOfWeek(),
    hour_of_day: hourOfDay(),
    is_peak_hour: isPeakHour()
  }
  return prepTimeModel.predict(features)

function predictTravelTime(origin, destination):
  // Use OSRM for base estimate
  osrmResult = osrm.route(origin, destination)
  baseTime = osrmResult.duration

  // Apply ML correction factor for real-world conditions
  features = {
    osrm_duration: baseTime,
    osrm_distance: osrmResult.distance,
    hour_of_day: hourOfDay(),
    day_of_week: dayOfWeek(),
    is_ramadan: isRamadan(),       // Morocco-specific: traffic patterns change
    is_friday_prayer: isFridayPrayer(),  // Morocco-specific
    weather: getCurrentWeather(),
    origin_zone: getZone(origin),  // Medina vs ville nouvelle vs suburbs
    destination_zone: getZone(destination),
    historical_ratio: getHistoricalOSRMRatio(origin_zone, destination_zone, hour)
  }
  correctionFactor = travelTimeModel.predict(features)
  return baseTime * correctionFactor

function predictFullETA(order, driver):
  prep = predictPrepTime(order)
  toRestaurant = predictTravelTime(driver.location, order.restaurant.location)
  pickup = 300  // 5 min average (can be learned)
  toCustomer = predictTravelTime(order.restaurant.location, order.customer.location)
  dropoff = 120  // 2 min average

  // Buffer based on confidence
  buffer = calculateBuffer(order, driver)  // e.g., 10% of total

  return {
    estimated: prep + toRestaurant + pickup + toCustomer + dropoff,
    withBuffer: prep + toRestaurant + pickup + toCustomer + dropoff + buffer,
    breakdown: { prep, toRestaurant, pickup, toCustomer, dropoff, buffer }
  }
```

**Morocco-specific considerations for ETA:**
- Medina streets: narrow, one-way, GPS signal loss common. Add 30-50% buffer.
- Friday prayer time: massive traffic spikes 12:30-14:00
- Ramadan: evening traffic patterns completely different (iftar rush)
- Moped vs car: different OSRM profiles needed (mopeds can take shortcuts cars cannot)

---

## 3. Dynamic Pricing & Surge

### 3.1 Surge Pricing Algorithm

```
function calculateSurgePricing(zone, timestamp):
  // Measure current supply/demand ratio
  activeDrivers = countActiveDriversInZone(zone)
  pendingOrders = countPendingOrdersInZone(zone)
  incomingDemand = predictDemand(zone, timestamp, horizon: 30)  // 30 min ahead

  // Supply-demand ratio
  supplyDemandRatio = activeDrivers / max(1, pendingOrders + incomingDemand * 0.5)

  // Surge multiplier based on ratio
  if supplyDemandRatio >= 1.5:
    surgeMultiplier = 1.0           // No surge (oversupply)
  elif supplyDemandRatio >= 1.0:
    surgeMultiplier = 1.0 + (1.5 - supplyDemandRatio) * 0.4  // Mild 1.0-1.2x
  elif supplyDemandRatio >= 0.5:
    surgeMultiplier = 1.2 + (1.0 - supplyDemandRatio) * 1.6  // Medium 1.2-2.0x
  else:
    surgeMultiplier = 2.0 + (0.5 - supplyDemandRatio) * 2.0  // High 2.0-3.0x

  // Cap surge
  surgeMultiplier = min(surgeMultiplier, MAX_SURGE_MULTIPLIER)  // Cap at 3.0x

  // Smoothing: don't change too fast
  previousSurge = getLastSurgeMultiplier(zone)
  smoothed = previousSurge * 0.7 + surgeMultiplier * 0.3  // Exponential smoothing

  return round(smoothed, 1)  // Round to 1 decimal (1.3x, 1.5x, etc.)
```

### 3.2 Demand Prediction Model

```
function predictDemand(zone, timestamp, horizon):
  features = {
    // Temporal
    hour_of_day: hour(timestamp),
    day_of_week: dayOfWeek(timestamp),
    is_weekend: isWeekend(timestamp),
    is_holiday: isHoliday(timestamp),  // Moroccan holidays
    is_ramadan: isRamadan(timestamp),
    minutes_since_iftar: minutesSinceIftar(timestamp),

    // Historical (same zone)
    demand_same_hour_last_week: getDemand(zone, timestamp - 7days),
    demand_same_hour_avg_4weeks: getAvgDemand(zone, timestamp, weeks=4),
    demand_last_hour: getDemand(zone, timestamp - 1hour),
    demand_trend_3h: getDemandTrend(zone, timestamp, hours=3),

    // External
    temperature: getTemperature(zone),
    is_raining: isRaining(zone),       // Rain increases delivery demand
    nearby_events: countNearbyEvents(zone, timestamp),

    // Zone characteristics
    zone_type: zone.type,  // residential, commercial, mixed, university
    zone_restaurant_count: zone.restaurantCount,
    zone_population_density: zone.populationDensity
  }

  // Gradient Boosted Trees (XGBoost/LightGBM) work well here
  return demandModel.predict(features)
```

### 3.3 Delivery Fee Calculation

```
function calculateDeliveryFee(order, restaurant, customer):
  distance = haversineDistance(restaurant.location, customer.location)
  zone = getDeliveryZone(customer.location)

  // Base fee: distance-based
  baseFee = BASE_FEE + (distance * PER_KM_RATE)
  // Morocco example: 10 MAD base + 3 MAD/km

  // Apply surge
  surgeMultiplier = getCurrentSurge(zone)
  surgedFee = baseFee * surgeMultiplier

  // Minimum fare
  finalFee = max(surgedFee, MINIMUM_DELIVERY_FEE)  // e.g., 10 MAD minimum

  // Maximum cap (customer protection)
  finalFee = min(finalFee, MAXIMUM_DELIVERY_FEE)    // e.g., 50 MAD maximum

  // Small order fee (below minimum order amount)
  if order.subtotal < MIN_ORDER_AMOUNT:
    finalFee += SMALL_ORDER_FEE  // e.g., 5 MAD

  // Subscription discount
  if customer.subscription == 'pro':
    finalFee = max(0, finalFee - PRO_DISCOUNT)  // e.g., free delivery for Pro

  return {
    baseFee,
    surgeMultiplier,
    surgeAmount: surgedFee - baseFee,
    smallOrderFee: order.subtotal < MIN_ORDER_AMOUNT ? SMALL_ORDER_FEE : 0,
    discount: customer.subscription == 'pro' ? PRO_DISCOUNT : 0,
    totalFee: finalFee
  }
```

### 3.4 Driver Incentives for Underserved Areas

```
function calculateDriverBonus(zone, timeSlot):
  supply = getDriverSupply(zone, timeSlot)
  demand = predictDemand(zone, timeSlot)

  // Calculate supply deficit
  deficit = max(0, demand - supply)

  if deficit == 0:
    return 0

  // Bonus scales with deficit severity
  bonusPerDelivery = min(
    MAX_BONUS,
    BASE_BONUS + (deficit / demand) * DEFICIT_BONUS_RATE
  )

  // Broadcast incentive to nearby drivers
  nearbyOfflineDrivers = getDriversNear(zone.center, radius: 5km, status: 'offline')
  for driver in nearbyOfflineDrivers:
    sendIncentiveNotification(driver, {
      zone: zone.name,
      bonusPerDelivery,
      estimatedDemand: demand,
      timeWindow: timeSlot,
      message: "Earn +{bonusPerDelivery} MAD per delivery in {zone.name} right now!"
    })

  return bonusPerDelivery
```

---

## 4. Anti-Fraud Systems

### 4.1 GPS Spoofing Detection

```
function detectGPSSpoofing(driver, locationUpdate):
  alerts = []

  // 1. Impossible speed check
  lastLocation = driver.lastKnownLocation
  timeDelta = locationUpdate.timestamp - lastLocation.timestamp
  distance = haversineDistance(lastLocation, locationUpdate)
  speed = distance / (timeDelta / 3600)  // km/h

  if speed > MAX_POSSIBLE_SPEED:  // 150 km/h for moped
    alerts.push({ type: 'impossible_speed', speed, distance, timeDelta })

  // 2. Location jump (teleportation)
  if distance > TELEPORT_THRESHOLD and timeDelta < TELEPORT_TIME_THRESHOLD:
    alerts.push({ type: 'teleportation', distance, timeDelta })

  // 3. Sensor cross-validation
  if locationUpdate.accelerometerData:
    isMoving = locationUpdate.accelerometerData.magnitude > MOVEMENT_THRESHOLD
    locationChanged = distance > 50  // 50 meters

    if locationChanged and not isMoving:
      alerts.push({ type: 'location_without_movement' })
    if not locationChanged and isMoving and timeDelta > 60:
      alerts.push({ type: 'movement_without_location_change' })

  // 4. Mock location API detection (Android)
  if locationUpdate.isMockLocation:
    alerts.push({ type: 'mock_location_enabled' })

  // 5. Known spoofing app detection
  if locationUpdate.installedApps:
    spoofingApps = ['fake_gps', 'mock_gps', 'location_faker', ...]
    detected = locationUpdate.installedApps.intersect(spoofingApps)
    if detected.length > 0:
      alerts.push({ type: 'spoofing_app_detected', apps: detected })

  // 6. GPS signal quality
  if locationUpdate.accuracy > GPS_ACCURACY_THRESHOLD:  // > 100m accuracy = suspect
    alerts.push({ type: 'poor_gps_accuracy', accuracy: locationUpdate.accuracy })

  // Score the alerts
  fraudScore = calculateFraudScore(alerts)
  if fraudScore > FRAUD_THRESHOLD:
    flagDriverForReview(driver, alerts, fraudScore)

  return { alerts, fraudScore, isBlocked: fraudScore > BLOCK_THRESHOLD }
```

### 4.2 Delivery Verification with Geofencing

```
function verifyDelivery(order, driver):
  customerLocation = order.deliveryAddress.coordinates
  driverLocation = driver.currentLocation

  // 1. Proximity check
  distance = haversineDistance(customerLocation, driverLocation)
  if distance > DELIVERY_RADIUS:  // 200 meters
    return {
      verified: false,
      reason: 'driver_too_far',
      distance,
      required: DELIVERY_RADIUS
    }

  // 2. Time-at-location check (driver must be in geofence for minimum time)
  timeInGeofence = getTimeInGeofence(driver, customerLocation, DELIVERY_RADIUS)
  if timeInGeofence < MIN_DELIVERY_TIME:  // At least 30 seconds
    return {
      verified: false,
      reason: 'insufficient_time_at_location',
      timeInGeofence,
      required: MIN_DELIVERY_TIME
    }

  // 3. Photo proof of delivery (for high-value or flagged orders)
  if order.requiresPhotoProof or order.totalAmount > PHOTO_PROOF_THRESHOLD:
    if not order.deliveryPhoto:
      return { verified: false, reason: 'photo_proof_required' }

    // Verify photo metadata
    photoMeta = extractPhotoMetadata(order.deliveryPhoto)
    if photoMeta.location:
      photoDistance = haversineDistance(customerLocation, photoMeta.location)
      if photoDistance > PHOTO_LOCATION_THRESHOLD:  // 300m
        return { verified: false, reason: 'photo_location_mismatch' }

    if abs(photoMeta.timestamp - now()) > PHOTO_TIME_THRESHOLD:  // 5 min
      return { verified: false, reason: 'photo_too_old' }

  // 4. PIN verification (optional, for cash orders)
  if order.paymentMethod == 'cash' and order.requiresPIN:
    if not order.deliveryPIN or order.deliveryPIN != order.expectedPIN:
      return { verified: false, reason: 'pin_mismatch' }

  return { verified: true }
```

### 4.3 Cash Theft Prevention

```
function trackCashCollection(driver, shift):
  expectedCash = 0
  reportedCash = 0

  for delivery in shift.completedDeliveries:
    if delivery.paymentMethod == 'cash':
      expectedCash += delivery.totalAmount
      reportedCash += delivery.reportedCashCollected or 0

  discrepancy = expectedCash - reportedCash
  discrepancyRate = discrepancy / max(1, expectedCash)

  if discrepancyRate > CASH_DISCREPANCY_THRESHOLD:  // > 5%
    flagCashDiscrepancy(driver, {
      expected: expectedCash,
      reported: reportedCash,
      discrepancy,
      rate: discrepancyRate
    })

  // Required cash settlement at end of shift
  return {
    expectedSettlement: expectedCash - driver.onlinePlatformFees,
    mustSettleBefore: shift.endTime + SETTLEMENT_GRACE_PERIOD,
    method: 'mobile_money_transfer'  // Morocco: use mobile money (Inwi Money, Orange Money)
  }

// Cash cap: limit maximum cash orders per shift
function shouldAllowCashOrder(driver, order):
  currentCashHeld = getUnremittedCash(driver)
  if currentCashHeld + order.totalAmount > MAX_CASH_PER_SHIFT:
    return false  // Route to online-payment-only drivers
  return true
```

### 4.4 Collusion Detection

```
function detectCollusion(timeWindow):
  // Pattern: same driver repeatedly delivers to same customer with refund requests
  suspiciousPatterns = db.query(`
    SELECT d.driver_id, o.customer_id,
           COUNT(*) as delivery_count,
           SUM(CASE WHEN r.refund_id IS NOT NULL THEN 1 ELSE 0 END) as refund_count
    FROM deliveries d
    JOIN orders o ON d.order_id = o.id
    LEFT JOIN refunds r ON o.id = r.order_id
    WHERE d.completed_at > NOW() - INTERVAL '30 days'
    GROUP BY d.driver_id, o.customer_id
    HAVING COUNT(*) > 5 AND
           SUM(CASE WHEN r.refund_id IS NOT NULL THEN 1 ELSE 0 END)::float / COUNT(*) > 0.3
  `)

  for pattern in suspiciousPatterns:
    // Check if driver and customer share device fingerprints
    driverDevices = getDeviceFingerprints(pattern.driver_id, role='driver')
    customerDevices = getDeviceFingerprints(pattern.customer_id, role='customer')

    sharedDevices = driverDevices.intersect(customerDevices)
    if sharedDevices.length > 0:
      createFraudCase({
        type: 'collusion',
        severity: 'high',
        evidence: { pattern, sharedDevices }
      })
    elif pattern.refund_count / pattern.delivery_count > 0.5:
      createFraudCase({
        type: 'suspected_collusion',
        severity: 'medium',
        evidence: { pattern }
      })
```

### 4.5 Device Fingerprinting

For production, consider integrating SHIELD (shield.com) or building a lighter in-house solution:

```
function generateDeviceFingerprint(deviceInfo):
  signals = {
    // Hardware
    device_model: deviceInfo.model,
    screen_resolution: deviceInfo.screenResolution,
    cpu_cores: deviceInfo.cpuCores,
    total_memory: deviceInfo.totalMemory,

    // Software
    os_version: deviceInfo.osVersion,
    app_version: deviceInfo.appVersion,
    timezone: deviceInfo.timezone,
    language: deviceInfo.language,

    // Network
    carrier: deviceInfo.carrier,
    wifi_mac_hash: hash(deviceInfo.wifiMac),  // Hashed for privacy

    // Behavioral (harder to fake)
    typing_pattern_hash: deviceInfo.typingPatternHash,
    touch_pressure_profile: deviceInfo.touchPressureProfile,
    accelerometer_noise_signature: deviceInfo.accelNoiseSignature
  }

  // Generate persistent device ID (survives app reinstall)
  fingerprint = hash(
    signals.device_model + signals.screen_resolution +
    signals.cpu_cores + signals.total_memory +
    signals.wifi_mac_hash + signals.accel_noise_signature
  )

  return {
    fingerprintId: fingerprint,
    signals,
    riskFactors: assessDeviceRisk(signals)
  }

function assessDeviceRisk(signals):
  risks = []

  if signals.os_version.isRooted:
    risks.push('rooted_device')
  if signals.isEmulator:
    risks.push('emulator_detected')
  if signals.hasAccessibilityServices and signals.accessibilityServiceCount > 3:
    risks.push('suspicious_accessibility_services')
  if signals.debuggable:
    risks.push('debug_mode_enabled')
  if signals.installedFromUnknownSources:
    risks.push('sideloaded_app')

  return risks
```

---

## 5. Driver Quality Scoring

### 5.1 Metrics and Weights

```
function calculateDriverScore(driver, period = 30):  // Last 30 days
  metrics = {
    // Delivery performance (40% weight)
    completionRate: getCompletionRate(driver, period),    // Target: >= 95%
    onTimeRate: getOnTimeDeliveryRate(driver, period),    // Target: >= 85%
    avgDeliveryTime: getAvgDeliveryTime(driver, period),  // vs zone average

    // Customer satisfaction (30% weight)
    customerRating: getAvgCustomerRating(driver, period), // 1-5 stars, target >= 4.5
    complaintRate: getComplaintRate(driver, period),       // Target: < 2%

    // Platform engagement (15% weight)
    acceptanceRate: getAcceptanceRate(driver, period),     // Target: >= 70%
    activeHours: getActiveHours(driver, period),           // Consistency matters
    peakHourParticipation: getPeakHourRate(driver, period), // Bonus for peak work

    // Compliance (15% weight)
    fraudScore: getFraudScore(driver, period),             // 0 = clean
    safetyIncidents: getSafetyIncidents(driver, period),   // Target: 0
    cashSettlementRate: getCashSettlementRate(driver, period) // Target: 100%
  }

  // Weighted composite score (0-100)
  score = (
    // Delivery performance (40%)
    (normalize(metrics.completionRate, 0.7, 1.0) * 15 +
     normalize(metrics.onTimeRate, 0.6, 1.0) * 15 +
     normalizeInverse(metrics.avgDeliveryTime, zoneAvg * 0.8, zoneAvg * 1.5) * 10) +

    // Customer satisfaction (30%)
    (normalize(metrics.customerRating, 3.0, 5.0) * 20 +
     normalizeInverse(metrics.complaintRate, 0, 0.1) * 10) +

    // Platform engagement (15%)
    (normalize(metrics.acceptanceRate, 0.3, 1.0) * 5 +
     normalize(metrics.activeHours, 10, 160) * 5 +
     normalize(metrics.peakHourParticipation, 0, 1.0) * 5) +

    // Compliance (15%)
    (normalizeInverse(metrics.fraudScore, 0, 100) * 5 +
     normalizeInverse(metrics.safetyIncidents, 0, 3) * 5 +
     normalize(metrics.cashSettlementRate, 0.8, 1.0) * 5)
  )

  return { score: clamp(score, 0, 100), metrics, tier: getTier(score) }

function normalize(value, min, max):
  return clamp((value - min) / (max - min), 0, 1)

function normalizeInverse(value, min, max):
  return 1 - normalize(value, min, max)
```

### 5.2 Tier System

```
TIER_THRESHOLDS = {
  diamond: { minScore: 90, color: '#b9f2ff', benefits: [
    'priority_order_access',
    'highest_base_rate',
    'instant_payout',
    'dedicated_support',
    'schedule_priority'
  ]},
  gold: { minScore: 75, color: '#ffd700', benefits: [
    'priority_order_access',
    'higher_base_rate',
    'daily_payout',
    'peak_hour_bonus_1.2x'
  ]},
  silver: { minScore: 60, color: '#c0c0c0', benefits: [
    'standard_order_access',
    'standard_base_rate',
    'weekly_payout',
    'peak_hour_bonus_1.1x'
  ]},
  bronze: { minScore: 40, color: '#cd7f32', benefits: [
    'limited_order_access',
    'standard_base_rate',
    'weekly_payout'
  ]},
  probation: { minScore: 0, color: '#ff4444', benefits: [
    'restricted_order_access',
    'reduced_base_rate',
    'biweekly_payout',
    'mandatory_training'
  ]}
}

// Tier impacts order assignment priority
function getDriverAssignmentPriority(driver):
  tierBonus = {
    diamond: 20,
    gold: 10,
    silver: 5,
    bronze: 0,
    probation: -10
  }
  return driver.qualityScore + tierBonus[driver.tier]
```

### 5.3 Deactivation Thresholds

```
DEACTIVATION_RULES = [
  { metric: 'customerRating', threshold: 4.0, direction: 'below',
    action: 'warning', message: 'Rating below 4.0 - improve within 2 weeks' },
  { metric: 'customerRating', threshold: 3.5, direction: 'below',
    action: 'deactivate', message: 'Rating critically low' },

  { metric: 'completionRate', threshold: 0.85, direction: 'below',
    action: 'warning', message: 'Too many incomplete deliveries' },
  { metric: 'completionRate', threshold: 0.75, direction: 'below',
    action: 'deactivate', message: 'Completion rate unacceptably low' },

  { metric: 'fraudScore', threshold: 70, direction: 'above',
    action: 'suspend_pending_review', message: 'Fraud investigation' },
  { metric: 'fraudScore', threshold: 90, direction: 'above',
    action: 'deactivate', message: 'Confirmed fraudulent behavior' },

  { metric: 'safetyIncidents', threshold: 2, direction: 'above',
    action: 'suspend_pending_review', message: 'Safety review required' },

  { metric: 'cashSettlementRate', threshold: 0.80, direction: 'below',
    action: 'suspend_cash_orders', message: 'Cash orders suspended until settlement' }
]

function evaluateDeactivation(driver):
  metrics = calculateDriverScore(driver).metrics
  actions = []

  for rule in DEACTIVATION_RULES:
    value = metrics[rule.metric]
    triggered = rule.direction == 'below' ? value < rule.threshold : value > rule.threshold

    if triggered:
      actions.push({
        rule: rule.metric,
        value,
        threshold: rule.threshold,
        action: rule.action,
        message: rule.message
      })

  // Execute most severe action
  if actions.some(a => a.action == 'deactivate'):
    deactivateDriver(driver, actions)
  elif actions.some(a => a.action == 'suspend_pending_review'):
    suspendDriver(driver, actions)
  elif actions.some(a => a.action == 'warning'):
    sendWarning(driver, actions)
```

### 5.4 Rating Manipulation Prevention

```
function detectRatingManipulation(driver):
  recentRatings = getRecentRatings(driver, days: 14)

  // 1. Sudden rating spike (possible fake reviews)
  lastWeekAvg = avg(recentRatings.filter(r => r.age > 7).map(r => r.stars))
  thisWeekAvg = avg(recentRatings.filter(r => r.age <= 7).map(r => r.stars))
  if thisWeekAvg - lastWeekAvg > 1.0 and thisWeekRatings.length > 5:
    flagForReview(driver, 'suspicious_rating_spike')

  // 2. All 5-star from same device fingerprints
  deviceGroups = groupBy(recentRatings, r => r.customerDeviceFingerprint)
  for deviceId, ratings in deviceGroups:
    if ratings.length > 3 and avg(ratings.map(r => r.stars)) > 4.8:
      flagForReview(driver, 'repeated_device_ratings', { deviceId })

  // 3. Ratings don't match delivery quality metrics
  if driver.avgRating > 4.8 and driver.onTimeRate < 0.7:
    flagForReview(driver, 'rating_metric_mismatch')

  // 4. Filter out suspected fake ratings from score
  legitimateRatings = recentRatings.filter(r => not r.isFlagged)
  driver.adjustedRating = avg(legitimateRatings.map(r => r.stars))
```

---

## 6. Real-Time Systems Architecture

### 6.1 Communication Protocol Selection

| Protocol | Latency | Direction | Battery | Use Case |
|----------|---------|-----------|---------|----------|
| WebSocket | ~50ms | Bidirectional | Medium | Customer order tracking, driver chat |
| SSE | ~100ms | Server->Client | Low | Customer-side delivery status |
| HTTP Polling | ~1-5s | Client->Server | High | Fallback only |
| Firebase FCM | ~200ms | Server->Client | Low | Push notifications when app backgrounded |

**Recommended architecture:**
- WebSocket (Socket.IO) for active delivery tracking (driver <-> server <-> customer)
- FCM/APNs push notifications for order offers to drivers, status changes when app is backgrounded
- SSE as WebSocket fallback for web clients

### 6.2 Location Update Architecture

```
// Driver app sends location updates
GPS_UPDATE_INTERVAL = {
  idle: 30000,           // 30s when not on delivery
  on_delivery: 5000,     // 5s during active delivery
  near_destination: 2000, // 2s when close to pickup/dropoff
  background: 60000      // 60s when app is backgrounded
}

// Server-side location ingestion pipeline
function handleLocationUpdate(driverId, location):
  // 1. Validate
  fraudCheck = detectGPSSpoofing(driver, location)
  if fraudCheck.isBlocked:
    return { error: 'location_rejected' }

  // 2. Write to Redis (hot path - real-time queries)
  redis.GEOADD('driver_locations', location.lng, location.lat, driverId)
  redis.HSET(`driver:${driverId}`, {
    lat: location.lat,
    lng: location.lng,
    heading: location.heading,
    speed: location.speed,
    timestamp: Date.now(),
    status: driver.status  // idle, en_route_pickup, at_restaurant, en_route_delivery
  })
  redis.EXPIRE(`driver:${driverId}`, 300)  // 5 min TTL (stale = offline)

  // 3. Publish to real-time channel (for customer tracking)
  if driver.activeOrderId:
    redis.PUBLISH(`order:${driver.activeOrderId}:tracking`, JSON.stringify({
      lat: location.lat,
      lng: location.lng,
      heading: location.heading,
      speed: location.speed,
      eta: recalculateETA(driver)
    }))

  // 4. Write to TimescaleDB (cold path - analytics/history)
  // Batched write, not on every update
  locationBuffer.add({ driverId, ...location, timestamp: Date.now() })
  if locationBuffer.size >= BATCH_SIZE or locationBuffer.age >= BATCH_INTERVAL:
    flushToTimescaleDB(locationBuffer)

// Find nearby drivers for order assignment
function findNearbyDrivers(restaurantLocation, radius):
  // Redis GEOSEARCH - returns drivers within radius, sorted by distance
  driverIds = redis.GEOSEARCH(
    'driver_locations',
    'FROMLONLAT', restaurantLocation.lng, restaurantLocation.lat,
    'BYRADIUS', radius, 'km',
    'ASC',
    'COUNT', 50
  )

  // Enrich with driver details
  drivers = []
  for id in driverIds:
    driverData = redis.HGETALL(`driver:${id}`)
    if driverData.status == 'idle' and driverData.timestamp > Date.now() - 300000:
      drivers.push({ id, ...driverData })

  return drivers
```

### 6.3 WebSocket Server Architecture (Socket.IO)

```typescript
// server/ws/deliveryTracking.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGINS },
  adapter: createAdapter(pubClient, subClient),  // Multi-server support
  pingInterval: 25000,
  pingTimeout: 20000,
});

// Driver namespace
const driverNs = io.of('/driver');
driverNs.use(authenticateDriver);  // JWT auth middleware

driverNs.on('connection', (socket) => {
  const driverId = socket.data.driverId;
  socket.join(`driver:${driverId}`);

  // Driver sends location updates
  socket.on('location_update', (data) => {
    handleLocationUpdate(driverId, data);
  });

  // Driver receives order offers
  // (sent via: driverNs.to(`driver:${driverId}`).emit('order_offer', offer))

  // Driver accepts/rejects order
  socket.on('order_response', (data) => {
    handleOrderResponse(driverId, data);
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    if (reason === 'transport close' || reason === 'ping timeout') {
      // Mark driver as potentially offline, start grace period
      markDriverDisconnected(driverId);
      setTimeout(() => {
        if (!isDriverConnected(driverId)) {
          markDriverOffline(driverId);
        }
      }, OFFLINE_GRACE_PERIOD);  // 60 seconds
    }
  });
});

// Customer namespace
const customerNs = io.of('/tracking');
customerNs.use(authenticateCustomer);

customerNs.on('connection', (socket) => {
  const orderId = socket.handshake.query.orderId;

  // Subscribe to order tracking updates
  socket.join(`order:${orderId}`);

  // Send current driver location immediately
  const tracking = await getCurrentTracking(orderId);
  if (tracking) {
    socket.emit('tracking_update', tracking);
  }
});

// Redis subscriber forwards location updates to customer rooms
const trackingSub = createClient({ url: REDIS_URL });
trackingSub.pSubscribe('order:*:tracking', (message, channel) => {
  const orderId = channel.split(':')[1];
  customerNs.to(`order:${orderId}`).emit('tracking_update', JSON.parse(message));
});
```

### 6.4 Offline Handling and Sync

```
function handleDriverReconnect(driver, syncData):
  // 1. Reconcile offline location history
  if syncData.offlineLocations and syncData.offlineLocations.length > 0:
    // Validate timestamps are plausible
    for location in syncData.offlineLocations:
      if isPlausibleLocation(location, driver):
        locationBuffer.add({ driverId: driver.id, ...location })

  // 2. Sync pending order status changes
  if syncData.pendingStatusUpdates:
    for update in syncData.pendingStatusUpdates:
      // Apply only if order is still assigned to this driver
      order = getOrder(update.orderId)
      if order and order.driverId == driver.id:
        processStatusUpdate(order, update)

  // 3. Resolve conflicts
  serverState = getDriverServerState(driver.id)
  if serverState.activeOrder and not syncData.hasActiveOrder:
    // Driver thinks they're free, server thinks they have an order
    // Server state wins - resend order details
    sendOrderDetails(driver, serverState.activeOrder)

  // 4. Update driver status
  redis.GEOADD('driver_locations', driver.currentLocation.lng, driver.currentLocation.lat, driver.id)
  markDriverOnline(driver.id)

  return { synced: true, conflictsResolved: conflictCount }
```

### 6.5 Database Architecture

```
Three-tier data storage:

1. Redis (Hot Path)
   - Current driver locations (GEOADD/GEOSEARCH)
   - Driver status and details (HSET)
   - Active order tracking channels (PUB/SUB)
   - Surge pricing cache
   - Rate limiting counters
   - TTL: 5 minutes for locations, 1 hour for surge

2. PostgreSQL + PostGIS (Warm Path)
   - All business entities (drivers, orders, restaurants, customers)
   - Delivery zones (PostGIS geometries)
   - Geofences for restaurants and areas
   - Order history and status
   - Driver profiles and scores
   - Payment records

3. TimescaleDB (Cold Path)
   - Location history (hypertable, time-partitioned)
   - Order event logs (for analytics)
   - Fraud detection data (behavioral patterns)
   - Metric time series (demand, supply, pricing)
   - Retention: 90 days hot, 1 year compressed, 3 years archived
```

---

## 7. Driver Onboarding Pipeline

### 7.1 Pipeline Stages

```
ONBOARDING_STAGES = [
  {
    stage: 'registration',
    required_fields: ['full_name', 'phone', 'email', 'city'],
    auto: true,
    duration: '5 minutes'
  },
  {
    stage: 'identity_verification',
    documents: [
      { type: 'national_id', name: 'CIN (Carte dIdentite Nationale)', required: true },
      { type: 'selfie_with_id', name: 'Selfie holding CIN', required: true }
    ],
    verification: 'automated_ocr + manual_review',
    provider: 'Veriff or Sumsub',  // KYC providers with Morocco support
    duration: '10-30 minutes (auto), 24h (manual fallback)'
  },
  {
    stage: 'vehicle_verification',
    documents: [
      { type: 'driving_license', name: 'Permis de conduire', required: true },
      { type: 'vehicle_registration', name: 'Carte grise', required: 'if_car_or_moto' },
      { type: 'insurance', name: 'Assurance vehicule', required: 'if_car_or_moto' },
      { type: 'vehicle_photo', name: 'Photo of vehicle', required: true }
    ],
    verification: 'automated_ocr + manual_review',
    duration: '24-48 hours'
  },
  {
    stage: 'background_check',
    checks: [
      { type: 'criminal_record', name: 'Casier judiciaire (Bulletin no. 3)', required: true },
      // In Morocco, the applicant obtains this from the court
    ],
    // Note: automated background check services are limited in Morocco
    // Alternative: require self-declaration + periodic random audits
    verification: 'document_upload + manual_review',
    duration: '1-5 business days'
  },
  {
    stage: 'training',
    modules: [
      { name: 'app_tutorial', type: 'in_app', duration: '15 min', required: true },
      { name: 'delivery_best_practices', type: 'video', duration: '10 min', required: true },
      { name: 'food_safety', type: 'quiz', duration: '5 min', required: true, passScore: 80 },
      { name: 'customer_interaction', type: 'video', duration: '5 min', required: true }
    ],
    duration: '35 minutes'
  },
  {
    stage: 'trial_period',
    restrictions: [
      'max_5_deliveries_per_day',
      'no_cash_orders',
      'no_high_value_orders',
      'supervised_first_delivery'
    ],
    duration: '20 deliveries or 1 week',
    graduation_criteria: {
      minCompletionRate: 0.90,
      minRating: 4.0,
      minDeliveries: 10,
      noFraudFlags: true
    }
  },
  {
    stage: 'activated',
    status: 'full_access',
    next_review: '30 days'
  }
]
```

### 7.2 Document Verification Flow

```
function processDocumentUpload(driver, documentType, file):
  // 1. File validation
  if file.size > MAX_FILE_SIZE:
    return { error: 'file_too_large' }
  if file.mimeType not in ALLOWED_MIME_TYPES:
    return { error: 'invalid_file_type' }

  // 2. Store securely
  storagePath = `drivers/${driver.id}/documents/${documentType}/${uuid()}`
  uploadUrl = await supabaseStorage.upload(storagePath, file)

  // 3. OCR extraction (for ID documents)
  if documentType in ['national_id', 'driving_license']:
    ocrResult = await ocrProvider.extract(file)
    extractedData = {
      name: ocrResult.fullName,
      id_number: ocrResult.documentNumber,
      date_of_birth: ocrResult.dateOfBirth,
      expiry_date: ocrResult.expiryDate,
      address: ocrResult.address
    }

    // 4. Cross-validate extracted data with registration
    mismatches = validateAgainstRegistration(driver, extractedData)
    if mismatches.length > 0:
      return { status: 'manual_review', mismatches }

    // 5. Check document expiry
    if extractedData.expiry_date and extractedData.expiry_date < now():
      return { status: 'rejected', reason: 'document_expired' }

  // 6. Liveness check (for selfie)
  if documentType == 'selfie_with_id':
    livenessResult = await kycProvider.checkLiveness(file)
    if not livenessResult.isLive:
      return { status: 'rejected', reason: 'liveness_check_failed' }

    // Face match against ID photo
    faceMatchResult = await kycProvider.compareFaces(
      file,
      driver.documents.find(d => d.type == 'national_id').url
    )
    if faceMatchResult.confidence < FACE_MATCH_THRESHOLD:
      return { status: 'manual_review', reason: 'face_match_low_confidence' }

  // 7. Update verification status
  await updateDocumentStatus(driver.id, documentType, {
    status: 'verified',
    uploadUrl,
    extractedData,
    verifiedAt: now()
  })

  // 8. Check if all required docs are verified -> advance stage
  await checkAndAdvanceOnboarding(driver)
```

### 7.3 Automated vs Manual Verification

| Aspect | Automated | Manual | Recommendation |
|--------|-----------|--------|----------------|
| Speed | Seconds-minutes | Hours-days | Automated first, manual fallback |
| Cost | $0.50-2 per check | $5-15 per check | Automated saves 80%+ |
| Accuracy | 95-98% for OCR | 99%+ with trained reviewer | Manual for edge cases |
| Scale | Unlimited | Limited by team | Must have automation for growth |
| Morocco-specific | Limited providers | Local team advantage | Hybrid approach |

**Recommendation:** Use Veriff or Sumsub for automated ID verification (both support Moroccan CIN). Fall back to manual review for OCR failures or low-confidence matches. Budget $1-2 per driver for automated verification.

---

## 8. Payment Settlement

### 8.1 Driver Payout Calculation

```
function calculateDriverPayout(driver, period):
  deliveries = getCompletedDeliveries(driver, period)

  earnings = {
    // Per-delivery fee
    deliveryFees: sum(deliveries.map(d => d.driverDeliveryFee)),

    // Distance bonus
    distanceBonus: sum(deliveries.map(d => {
      km = d.totalDistance / 1000
      return km > BASE_KM ? (km - BASE_KM) * PER_EXTRA_KM_RATE : 0
    })),

    // Tips
    tips: sum(deliveries.map(d => d.tipAmount || 0)),

    // Surge bonus
    surgeBonus: sum(deliveries.map(d => d.surgeBonus || 0)),

    // Zone incentive bonus
    zoneBonus: sum(deliveries.map(d => d.zoneBonus || 0)),

    // Peak hour bonus
    peakBonus: sum(deliveries.map(d => {
      if isPeakHour(d.completedAt):
        return d.driverDeliveryFee * (driver.tier.peakMultiplier - 1)
      return 0
    })),

    // Referral bonus
    referralBonus: getReferralBonuses(driver, period)
  }

  deductions = {
    // Platform commission
    platformCommission: sum(deliveries.map(d =>
      d.driverDeliveryFee * PLATFORM_COMMISSION_RATE  // e.g., 20%
    )),

    // Cash collected but not yet remitted
    unremittedCash: getUnremittedCash(driver),

    // Equipment rental (if applicable)
    equipmentRental: getEquipmentCharges(driver, period),

    // Penalties
    penalties: sum(getPenalties(driver, period).map(p => p.amount)),

    // Tax withholding (Morocco: auto-entrepreneur regime)
    taxWithholding: calculateTaxWithholding(totalEarnings)
  }

  totalEarnings = Object.values(earnings).reduce((a, b) => a + b, 0)
  totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0)
  netPayout = totalEarnings - totalDeductions

  return {
    period,
    earnings,
    deductions,
    totalEarnings,
    totalDeductions,
    netPayout,
    payoutMethod: driver.preferredPayoutMethod,  // bank_transfer, mobile_money
    scheduledDate: getNextPayoutDate(driver.tier)
  }
}
```

### 8.2 Payout Schedule by Tier

```
PAYOUT_SCHEDULES = {
  diamond: {
    frequency: 'instant',     // Real-time payout after each delivery
    method: ['bank_transfer', 'mobile_money'],
    processingTime: '< 1 hour',
    minimumPayout: 0          // No minimum
  },
  gold: {
    frequency: 'daily',
    method: ['bank_transfer', 'mobile_money'],
    processingTime: 'end_of_day',
    minimumPayout: 50         // 50 MAD minimum
  },
  silver: {
    frequency: 'weekly',
    method: ['bank_transfer', 'mobile_money'],
    processingTime: 'monday',
    minimumPayout: 100        // 100 MAD minimum
  },
  bronze: {
    frequency: 'weekly',
    method: ['bank_transfer'],
    processingTime: 'monday',
    minimumPayout: 100
  },
  probation: {
    frequency: 'biweekly',
    method: ['bank_transfer'],
    processingTime: '1st_and_15th',
    minimumPayout: 200
  }
}
```

### 8.3 Cash Collection Tracking

```
function processCashOrder(driver, order):
  // Driver collects cash from customer
  cashCollected = order.totalAmount  // Customer pays full amount in cash

  // Record the collection
  await db.cashLedger.create({
    driverId: driver.id,
    orderId: order.id,
    amount: cashCollected,
    type: 'collection',
    timestamp: now()
  })

  // Calculate what driver owes platform
  platformShare = order.deliveryFee * PLATFORM_COMMISSION_RATE + order.restaurantPayout
  driverKeeps = cashCollected - platformShare

  // Update driver's cash balance
  await db.driverWallet.update({
    where: { driverId: driver.id },
    data: {
      cashHeld: { increment: cashCollected },
      cashOwedToPlatform: { increment: platformShare },
      netCashBalance: { increment: driverKeeps }
    }
  })

  return {
    cashCollected,
    platformShare,
    driverKeeps,
    totalCashHeld: await getDriverCashBalance(driver.id)
  }

function processSettlement(driver):
  wallet = await db.driverWallet.findUnique({ where: { driverId: driver.id } })

  if wallet.cashOwedToPlatform <= 0:
    return { status: 'nothing_to_settle' }

  // Settlement methods for Morocco:
  // 1. Mobile money transfer (Inwi Money, Orange Money, CIH Mobile)
  // 2. Bank transfer
  // 3. Cash deposit at partner location (e.g., Wafacash, Cash Plus)

  settlement = await db.cashSettlement.create({
    driverId: driver.id,
    amount: wallet.cashOwedToPlatform,
    method: driver.preferredSettlementMethod,
    status: 'pending',
    dueDate: getSettlementDueDate(driver)
  })

  // Send settlement reminder
  sendSettlementReminder(driver, settlement)

  return settlement
}
```

### 8.4 Dispute Handling

```
function handleDeliveryDispute(order, initiator, reason):
  dispute = await db.disputes.create({
    orderId: order.id,
    initiatedBy: initiator,  // 'customer' | 'driver' | 'restaurant'
    reason,                   // 'not_delivered', 'wrong_items', 'late', 'damaged'
    status: 'open',
    evidence: {}
  })

  // Auto-resolve certain disputes
  if reason == 'not_delivered':
    // Check delivery verification data
    verification = await getDeliveryVerification(order.id)
    if verification.verified and verification.photoProof:
      // Strong evidence delivery happened
      dispute.autoResolution = 'delivery_confirmed'
      dispute.evidence = verification
      resolveDispute(dispute, 'in_favor_of_driver')
      return
    elif not verification.verified:
      // No proof of delivery
      dispute.autoResolution = 'no_delivery_proof'
      resolveDispute(dispute, 'in_favor_of_customer', {
        refundCustomer: true,
        deductFromDriver: true
      })
      return

  // Manual review needed
  dispute.status = 'under_review'
  assignToSupportTeam(dispute)

  // Freeze payout for disputed amount
  holdPayoutAmount(order.driverId, order.driverFee)
```

---

## 9. Database Schema

### 9.1 Core Driver Tables (Prisma Schema)

```prisma
// Add to prisma/schema.prisma

model Driver {
  id                String          @id @default(uuid())
  userId            String          @unique  // Links to existing User model
  user              User            @relation(fields: [userId], references: [id])

  // Profile
  fullName          String
  phone             String          @unique
  email             String?
  photoUrl          String?
  city              String

  // Vehicle
  vehicleType       VehicleType     // BICYCLE, MOPED, MOTORCYCLE, CAR
  vehiclePlate      String?
  vehicleModel      String?
  vehicleYear       Int?

  // Status
  status            DriverStatus    @default(PENDING_VERIFICATION)
  onboardingStage   String          @default("registration")
  isOnline          Boolean         @default(false)
  lastOnlineAt      DateTime?

  // Quality
  qualityScore      Float           @default(50)
  tier              DriverTier      @default(BRONZE)
  totalDeliveries   Int             @default(0)
  avgRating         Float           @default(5.0)
  completionRate    Float           @default(1.0)
  acceptanceRate    Float           @default(1.0)

  // Financial
  walletBalance     Int             @default(0)  // In centimes
  cashHeld          Int             @default(0)
  cashOwedToPlatform Int            @default(0)
  preferredPayoutMethod PayoutMethod @default(BANK_TRANSFER)
  bankAccountNumber String?
  mobileMoneyNumber String?

  // Timestamps
  activatedAt       DateTime?
  deactivatedAt     DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  // Relations
  documents         DriverDocument[]
  deliveries        Delivery[]
  locationHistory   DriverLocation[]
  payouts           DriverPayout[]
  cashLedger        CashLedgerEntry[]
  disputes          Dispute[]       @relation("DriverDisputes")
  ratings           DriverRating[]
  shifts            DriverShift[]
  fraudAlerts       FraudAlert[]

  @@index([city])
  @@index([status])
  @@index([tier])
  @@index([isOnline])
}

enum VehicleType {
  BICYCLE
  MOPED
  MOTORCYCLE
  CAR
}

enum DriverStatus {
  PENDING_VERIFICATION
  DOCUMENTS_SUBMITTED
  BACKGROUND_CHECK
  TRAINING
  TRIAL_PERIOD
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

enum DriverTier {
  DIAMOND
  GOLD
  SILVER
  BRONZE
  PROBATION
}

enum PayoutMethod {
  BANK_TRANSFER
  MOBILE_MONEY
  CASH_PICKUP
}

model DriverDocument {
  id            String              @id @default(uuid())
  driverId      String
  driver        Driver              @relation(fields: [driverId], references: [id])

  type          DocumentType
  fileUrl       String
  status        DocumentStatus      @default(PENDING)
  extractedData Json?               // OCR results
  reviewNotes   String?
  reviewedBy    String?             // Admin user ID
  expiresAt     DateTime?

  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@index([driverId, type])
  @@index([status])
}

enum DocumentType {
  NATIONAL_ID
  SELFIE_WITH_ID
  DRIVING_LICENSE
  VEHICLE_REGISTRATION
  INSURANCE
  VEHICLE_PHOTO
  CRIMINAL_RECORD
}

enum DocumentStatus {
  PENDING
  UNDER_REVIEW
  VERIFIED
  REJECTED
  EXPIRED
}

model Delivery {
  id                String          @id @default(uuid())
  orderId           String
  order             Order           @relation(fields: [orderId], references: [id])
  driverId          String
  driver            Driver          @relation(fields: [driverId], references: [id])

  // Assignment
  assignedAt        DateTime
  acceptedAt        DateTime?
  rejectedAt        DateTime?

  // Pickup
  pickupLocation    Json            // { lat, lng, address }
  arrivedAtPickupAt DateTime?
  pickedUpAt        DateTime?

  // Delivery
  deliveryLocation  Json            // { lat, lng, address }
  arrivedAtDropAt   DateTime?
  deliveredAt       DateTime?

  // Verification
  deliveryPhotoUrl  String?
  deliveryPIN       String?
  customerSignature String?
  verificationStatus VerificationStatus @default(PENDING)

  // Route
  routePolyline     String?         // Encoded polyline
  totalDistance      Int?            // Meters
  actualDuration    Int?            // Seconds
  estimatedDuration Int?            // Seconds (from ETA model)

  // Financial
  driverFee         Int             // Centimes
  surgeBonus        Int             @default(0)
  zoneBonus         Int             @default(0)
  tipAmount         Int             @default(0)

  // Status
  status            DeliveryStatus  @default(ASSIGNED)
  cancelReason      String?

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([driverId, status])
  @@index([orderId])
  @@index([status, assignedAt])
}

enum DeliveryStatus {
  ASSIGNED
  ACCEPTED
  EN_ROUTE_PICKUP
  AT_RESTAURANT
  PICKED_UP
  EN_ROUTE_DELIVERY
  ARRIVED_AT_CUSTOMER
  DELIVERED
  CANCELLED
  FAILED
}

enum VerificationStatus {
  PENDING
  VERIFIED
  FAILED
  DISPUTED
}

model DriverLocation {
  id          String      @id @default(uuid())
  driverId    String
  driver      Driver      @relation(fields: [driverId], references: [id])

  latitude    Float
  longitude   Float
  accuracy    Float?
  heading     Float?
  speed       Float?
  altitude    Float?

  // For fraud detection
  isMock      Boolean     @default(false)
  provider    String?     // gps, network, fused

  timestamp   DateTime    @default(now())

  @@index([driverId, timestamp])
  @@index([timestamp])
}

model DeliveryZone {
  id          String      @id @default(uuid())
  name        String
  city        String

  // PostGIS polygon stored as GeoJSON
  boundary    Json        // GeoJSON polygon

  // Pricing
  baseFee     Int         // Centimes
  perKmRate   Int         // Centimes per km
  minFee      Int         // Minimum fee in centimes
  maxFee      Int         // Maximum fee in centimes

  // Operational
  isActive    Boolean     @default(true)
  maxDrivers  Int?

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  @@index([city])
  @@index([isActive])
}

model DriverPayout {
  id              String        @id @default(uuid())
  driverId        String
  driver          Driver        @relation(fields: [driverId], references: [id])

  amount          Int           // Centimes
  method          PayoutMethod
  status          PayoutStatus  @default(PENDING)

  // Breakdown
  deliveryFees    Int
  tips            Int
  bonuses         Int
  deductions      Int

  // Processing
  transactionRef  String?
  processedAt     DateTime?
  failedAt        DateTime?
  failureReason   String?

  periodStart     DateTime
  periodEnd       DateTime

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([driverId, status])
  @@index([status, createdAt])
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REVERSED
}

model CashLedgerEntry {
  id          String          @id @default(uuid())
  driverId    String
  driver      Driver          @relation(fields: [driverId], references: [id])
  orderId     String?

  type        CashLedgerType  // COLLECTION, SETTLEMENT, ADJUSTMENT
  amount      Int             // Centimes (positive = driver received, negative = driver paid)
  balance     Int             // Running balance after this entry

  method      String?         // Settlement method used
  reference   String?         // Transaction reference

  createdAt   DateTime        @default(now())

  @@index([driverId, createdAt])
  @@index([type])
}

enum CashLedgerType {
  COLLECTION
  SETTLEMENT
  ADJUSTMENT
  PENALTY
}

model FraudAlert {
  id          String          @id @default(uuid())
  driverId    String
  driver      Driver          @relation(fields: [driverId], references: [id])

  type        String          // gps_spoofing, impossible_speed, collusion, etc.
  severity    String          // low, medium, high, critical
  score       Float
  evidence    Json            // Detailed evidence data

  status      String          @default("open")  // open, investigating, resolved, dismissed
  resolution  String?
  resolvedBy  String?
  resolvedAt  DateTime?

  createdAt   DateTime        @default(now())

  @@index([driverId, status])
  @@index([type, createdAt])
  @@index([severity, status])
}

model DriverRating {
  id          String      @id @default(uuid())
  driverId    String
  driver      Driver      @relation(fields: [driverId], references: [id])
  orderId     String      @unique
  customerId  String

  stars       Int         // 1-5
  comment     String?
  isFlagged   Boolean     @default(false)  // Suspected fake rating

  createdAt   DateTime    @default(now())

  @@index([driverId, createdAt])
  @@index([stars])
}

model DriverShift {
  id          String      @id @default(uuid())
  driverId    String
  driver      Driver      @relation(fields: [driverId], references: [id])

  startedAt   DateTime
  endedAt     DateTime?

  // Metrics
  deliveriesCompleted Int @default(0)
  totalEarnings       Int @default(0)  // Centimes
  totalDistance        Int @default(0)  // Meters
  onlineMinutes       Int @default(0)

  @@index([driverId, startedAt])
}

model SurgePricing {
  id          String      @id @default(uuid())
  zoneId      String

  multiplier  Float
  demandCount Int
  supplyCount Int

  activeFrom  DateTime
  activeTo    DateTime?

  createdAt   DateTime    @default(now())

  @@index([zoneId, activeFrom])
}

model Dispute {
  id            String        @id @default(uuid())
  orderId       String
  driverId      String?
  driver        Driver?       @relation("DriverDisputes", fields: [driverId], references: [id])
  customerId    String

  initiatedBy   String        // customer, driver, restaurant, system
  reason        String
  description   String?
  evidence      Json?

  status        String        @default("open")  // open, under_review, resolved, escalated
  resolution    String?       // in_favor_of_customer, in_favor_of_driver, split, dismissed
  refundAmount  Int?

  assignedTo    String?       // Support agent
  resolvedAt    DateTime?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([status])
  @@index([driverId])
  @@index([orderId])
}
```

### 9.2 Required Database Extensions

```sql
-- PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- For distance calculations
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- For full-text search on driver/zone names
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 9.3 Key Indexes for Performance

```sql
-- Spatial index on delivery zones (requires PostGIS geometry column)
-- If using native PostGIS columns instead of JSON:
-- CREATE INDEX idx_delivery_zones_boundary ON delivery_zones USING GIST (boundary);

-- Composite indexes for common query patterns
CREATE INDEX idx_deliveries_driver_active ON "Delivery" ("driverId", "status")
  WHERE "status" IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE_PICKUP', 'AT_RESTAURANT', 'PICKED_UP', 'EN_ROUTE_DELIVERY');

CREATE INDEX idx_drivers_online_city ON "Driver" ("city", "isOnline")
  WHERE "isOnline" = true;

CREATE INDEX idx_fraud_alerts_active ON "FraudAlert" ("severity", "status")
  WHERE "status" IN ('open', 'investigating');

-- TimescaleDB hypertable for location history (if using TimescaleDB)
-- SELECT create_hypertable('DriverLocation', 'timestamp');
-- SELECT add_retention_policy('DriverLocation', INTERVAL '90 days');
```

---

## 10. Technology Recommendations for Diyafa

### 10.1 Phased Implementation Plan

**Phase 1: MVP (4-6 weeks)**
Core order assignment, driver app, basic tracking

| Component | Technology | Why |
|-----------|-----------|-----|
| Order assignment | Nearest-driver (Level 0) + priority queue | Simple, works for low volume |
| Routing | OSRM self-hosted (Morocco data) | Free, fast, accurate for Morocco |
| Real-time tracking | Socket.IO + Redis pub/sub | Already in Node.js ecosystem |
| Location storage | Redis GEOADD/GEOSEARCH | Sub-ms proximity queries |
| Business data | PostgreSQL (existing Supabase) | Already in stack |
| Push notifications | FCM (Firebase) | Free, reliable |
| Driver app | React Native (Expo) | Code sharing with web |
| ETA | OSRM duration + static buffers | Good enough for launch |

**Phase 2: Optimization (2-3 months)**
Batching, surge pricing, quality scoring

| Component | Technology | Why |
|-----------|-----------|-----|
| Order assignment | Hungarian algorithm (batch) | Better global optimization |
| Route optimization | VROOM + OSRM | Multi-vehicle, millisecond |
| Surge pricing | Redis + time-series demand | Real-time supply/demand |
| ETA model | XGBoost with Morocco-specific features | Accurate, fast inference |
| Driver scoring | PostgreSQL materialized views | Nightly score recalculation |
| Fraud detection | Rule-based (GPS + behavioral) | 80% coverage with rules |

**Phase 3: Intelligence (3-6 months)**
ML-based assignment, advanced fraud, predictive operations

| Component | Technology | Why |
|-----------|-----------|-----|
| Order assignment | MIP solver (HiGHS or CBC) | Open-source, production-grade |
| Demand prediction | LightGBM model | Fast training, good accuracy |
| ETA model | DeepETA-style neural network | Best accuracy |
| Fraud detection | SHIELD integration or ML ensemble | Professional-grade detection |
| Analytics | TimescaleDB + Grafana | Time-series at scale |
| Location history | TimescaleDB hypertable | Compressed, partitioned |

### 10.2 Infrastructure Cost Estimate (Morocco)

```
Phase 1 MVP Monthly Costs:
  Supabase Pro:          $25/mo    (existing)
  Redis Cloud (25MB):    $0/mo     (free tier) or self-hosted
  OSRM Server (2GB VPS): $10/mo   (Hetzner/OVH)
  VROOM Server:          $0/mo     (co-hosted with OSRM)
  FCM Push:              $0/mo     (free)
  SMS verification:      ~$50/mo   (Twilio, ~500 drivers)
  KYC provider:          ~$100/mo  (Veriff, ~50 verifications)
  ----------------------------------------
  Total:                 ~$185/mo

Phase 2 Monthly Costs:
  Add TimescaleDB:       $30/mo    (Timescale Cloud)
  Scale Redis (100MB):   $10/mo
  ML model serving:      $20/mo    (small CPU instance)
  ----------------------------------------
  Total:                 ~$245/mo

Phase 3 Monthly Costs:
  Scale PostgreSQL:      $50/mo
  Scale Redis (1GB):     $30/mo
  ML infrastructure:     $100/mo
  SHIELD (if used):      ~$500/mo  (enterprise pricing)
  ----------------------------------------
  Total:                 ~$925/mo
```

### 10.3 Morocco-Specific Considerations

**Payment landscape:**
- Cash is dominant (~60% of transactions). Plan for robust cash tracking from day 1.
- Mobile money growing fast: Inwi Money, Orange Money, CIH Mobile, Wafa Cash.
- Bank transfers via CMI (Centre Monetique Interbancaire).
- Card penetration at ~40% and growing (Glovo reports 56%).

**Regulatory:**
- Drivers are independent contractors (Glovo precedent in Morocco).
- Auto-entrepreneur tax regime is standard for gig workers.
- Competition Council is active (Glovo faced antitrust allegations for market dominance in 2025).
- Plan for compliance with driver treatment standards.

**Operational:**
- Medina areas in cities like Marrakech and Fez: GPS unreliable, narrow streets, need moped/bicycle-only zones.
- Ramadan completely changes demand patterns. Build Ramadan mode from the start.
- Friday prayer rush (12:30-14:00) is a weekly surge event.
- Summer heat (40C+) affects driver supply. Plan for heat bonuses.
- French AND Arabic language support mandatory for driver app.
- WhatsApp is the primary communication channel (integrate for driver support).

**Competitive landscape:**
- Glovo: dominant player, 4,500 couriers, 6,500 partners, 38 cities.
- Diyafa advantage: white-label delivery for restaurants (no Glovo commission on restaurant side).
- Target initially: restaurants already on Diyafa who want their own delivery fleet.

---

## Sources

### Primary Sources (Engineering Blogs)
- [DoorDash: Next-Generation Optimization for Dasher Dispatch](https://careersatdoordash.com/blog/next-generation-optimization-for-dasher-dispatch-at-doordash/) - MIP formulation details
- [DoorDash: Using ML and Optimization to Solve Dispatch](https://careersatdoordash.com/blog/using-ml-and-optimization-to-solve-doordashs-dispatch-problem/) - ML + optimization pipeline
- [DoorDash: Iterating Real-time Assignment Through Experimentation](https://careersatdoordash.com/blog/optimizing-real-time-algorithms-experimentation/)
- [Uber: DeepETA - Predicting Arrival Times Using Deep Learning](https://www.uber.com/blog/deepeta-how-uber-predicts-arrival-times/) - Neural network ETA architecture
- [Uber Eats: Predicting Time to Cook, Arrive, and Deliver](https://www.infoq.com/articles/uber-eats-time-predictions/) - ETA decomposition
- [Evolution of Food Delivery Dispatching](https://ilyazinkovich.github.io/2020/06/16/delivery-dispatching-evolution.html) - Level 0 through Level X

### Technical Documentation
- [Google OR-Tools: Vehicle Routing](https://developers.google.com/optimization/routing) - VRP solver
- [Google OR-Tools: Pickups and Deliveries](https://developers.google.com/optimization/routing/pickup_delivery)
- [VROOM Project](http://vroom-project.org/) - Open-source route optimization
- [VROOM GitHub](https://github.com/VROOM-Project/vroom) - C++20 VRP solver
- [Redis Geospatial](https://redis.io/docs/latest/develop/data-types/geospatial/) - GEOADD/GEOSEARCH
- [Redis: Real-time Vehicle Tracking](https://redis.io/blog/create-a-real-time-vehicle-tracking-system-with-redis/)

### Fraud Prevention
- [SHIELD: Ultimate Guide to Food Delivery Fraud](https://shield.com/blog/the-ultimate-guide-to-food-delivery-fraud)
- [Radar: Food Delivery Fraud Prevention](https://radar.com/blog/food-delivery-fraud) - Location-based fraud detection
- [Radar: Real-time Delivery Tracking](https://radar.com/blog/real-time-delivery-tracking-for-food-delivery-apps)

### Morocco Market
- [Glovo's Moroccan Success: Innovating in Emerging Markets](https://bewilderedinmorocco.com/glovos-moroccan-success-innovating-in-emerging-markets/)
- [Glovo Faces Antitrust Allegations in Morocco](https://www.moroccoworldnews.com/2025/05/204406/glovo-faces-antitrust-allegations-in-moroccos-food-delivery-market/)
- [Glovo Leverages Local Startups in Morocco](https://launchbaseafrica.com/2024/06/03/to-scale-in-morocco-global-delivery-giant-glovo-leverages-local-startups-who-are-they/)

### Academic Papers
- [Smart Delivery Assignment through ML and Hungarian Algorithm (MDPI)](https://www.mdpi.com/2624-6511/7/3/47)
- [Faster Deliveries and Smarter Order Assignments (Wiley)](https://onlinelibrary.wiley.com/doi/10.1002/joom.1354)
- [Courier Routing Using Reinforcement Learning (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0360835221007750)
- [Short-Term Demand Prediction with ConvLSTM (MDPI)](https://www.mdpi.com/2079-8954/11/10/485)

### System Design References
- [System Design: DoorDash](https://medium.com/@YodgorbekKomilo/system-design-of-doordash-e7a8197bc15b)
- [Geofencing at Scale: QuadTrees and Geohashes](https://systemdr.substack.com/p/geofencing-at-scale-quadtrees-geohashes)
- [Building Real-Time Driver Tracking](https://medium.com/@maitysubham4041/building-a-scalable-real-time-driver-tracking-system-9f1f23636836)
- [Database Design for Food Delivery (Zomato/Swiggy)](https://medium.com/towards-data-engineering/database-design-for-a-food-delivery-app-like-zomato-swiggy-86c16319b5c5)

### Driver Operations
- [DoorDash Dasher Ratings Explained](https://help.doordash.com/dashers/s/article/Dasher-Ratings-Explained?language=en_US)
- [Driver Settlement Configuration (Dispatch Science)](https://support.dispatchscience.com/support/solutions/articles/36000196098-driver-settlements)
- [DoorDash Payout and Monthly Statement](https://merchants.doordash.com/en-us/learning-center/payout-and-monthly-statement)
