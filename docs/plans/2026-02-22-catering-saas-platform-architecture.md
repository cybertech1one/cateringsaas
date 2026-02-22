# CaterQR: Catering SaaS Platform -- Technical Architecture

**Date:** February 22, 2026
**Author:** Architect Agent
**Status:** Proposed
**Base:** Fork of FeastQR (menusaas) -- Next.js 14 + tRPC + Prisma + Supabase + Tailwind

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Fundamental Constraints](#2-fundamental-constraints)
3. [Platform Model Decision](#3-platform-model-decision)
4. [Core Platform Architecture](#4-core-platform-architecture)
5. [Booking and Event Management Engine](#5-booking-and-event-management-engine)
6. [Menu and Pricing Engine](#6-menu-and-pricing-engine)
7. [Financial System](#7-financial-system)
8. [Logistics and Operations](#8-logistics-and-operations)
9. [Discovery and Marketplace](#9-discovery-and-marketplace)
10. [Communication System](#10-communication-system)
11. [AI Features](#11-ai-features)
12. [Database Schema Design](#12-database-schema-design)
13. [Analytics and Insights](#13-analytics-and-insights)
14. [FeastQR Reuse Assessment](#14-feastqr-reuse-assessment)
15. [Implementation Roadmap](#15-implementation-roadmap)
16. [Moroccan Market Specifics](#16-moroccan-market-specifics)
17. [Risk Assessment](#17-risk-assessment)

---

## 1. Executive Summary

CaterQR is a catering-specialized SaaS platform cloned from FeastQR's battle-tested Next.js 14 stack, purpose-built for the Moroccan and MENA catering market. It addresses a fundamentally different problem domain than restaurant menu ordering:

**Restaurant ordering** = real-time, small transactions, individual customers, fixed menu.
**Catering** = advance booking, large-scale events, negotiations, custom menus, milestone payments, logistics coordination.

The platform targets Morocco's $10.26B hospitality market (2025), focusing on the undigitized catering segment where most booking still happens via WhatsApp messages and phone calls. Morocco hosts approximately 200,000 weddings per year with average catering spend of 15,000-80,000 MAD, representing a $600M+ addressable segment for weddings alone, before adding corporate events, Ramadan iftars, and social occasions.

### Constitutional Principles (Immutable Rules)

1. **Catering is NOT ordering** -- Every design decision respects the advance-booking, negotiation-heavy nature of catering. No forced checkout flows. Inquiries first.
2. **COD-first, digital-second** -- 60-74% of Morocco operates on cash. Every payment flow must have a COD path. CMI is the gateway, not Stripe.
3. **WhatsApp-native** -- WhatsApp is Morocco's primary business communication channel. Every customer touchpoint must have a WhatsApp fallback.
4. **Arabic RTL as first-class** -- Not an afterthought. RTL layout, Arabic typography, and Darija-friendly UX from day one.
5. **Offline-resilient** -- Caterers work in venues with poor connectivity. Critical workflows must work offline and sync later.
6. **Multi-tenant isolation** -- Each caterer's data is strictly isolated. No cross-tenant data leakage. RLS on every table.

---

## 2. Fundamental Constraints

### 2.1 Technical Constraints (Physics of Catering)

| Constraint | Implication | Design Response |
|-----------|-------------|-----------------|
| Events are scheduled days/weeks ahead | No real-time urgency for ordering | Calendar-centric UX, not cart-centric |
| Guest counts are large (50-1000+) | Pricing scales non-linearly | Tiered pricing engine, not simple multiplication |
| Menus are negotiated, not selected | Cannot use e-commerce checkout | Quote-request-negotiate-confirm workflow |
| Multiple payment milestones | Cannot charge once | Payment schedule engine with deposit/milestone tracking |
| Equipment must be tracked | Not just food delivery | Asset management module |
| Staff must be coordinated | Human scheduling is hard | Calendar + availability + assignment system |
| Events span multiple hours | Not a 30-minute delivery window | Timeline/agenda builder per event |
| Seasonal demand spikes (Ramadan, wedding season) | Capacity planning critical | Calendar heatmap, advance booking visibility |

### 2.2 Market Constraints (Morocco Specifics)

| Constraint | Implication |
|-----------|-------------|
| CMI is the only viable payment gateway | No Stripe/PayPal. Must integrate CMI directly |
| 60-74% COD | Must track cash deposits, bank transfers, partial payments |
| WhatsApp > Email | Notification system must be WhatsApp-first |
| Arabic + French + Darija | Trilingual UI, RTL support, Darija in communications |
| Limited internet in rural venues | PWA with offline mode, sync-when-connected |
| No formal addresses | Location via GPS coordinates + WhatsApp location sharing |
| Tax system (TVA 20%) | Invoice must be TVA-compliant for corporate clients |
| Ramadan shifts everything | Iftar catering is massive; operating hours change entirely |
| Wedding season (June-September) | Demand 3-5x normal; capacity management critical |

### 2.3 CAP Theorem Application

For a catering platform, we choose **AP (Availability + Partition tolerance)** over strict Consistency:

- **Why:** A caterer checking their calendar from a venue with spotty internet must always be able to read their schedule (even if slightly stale). Booking conflicts are resolved via human negotiation, not database locks.
- **Implementation:** Eventual consistency with optimistic locking on bookings. Conflict detection (double-booking alerts), not conflict prevention (locking calendars).

---

## 3. Platform Model Decision

### 3.1 Analysis of Options

| Model | Pros | Cons | Revenue Model |
|-------|------|------|---------------|
| **Pure SaaS** (Caterer tool) | Simpler, caterer-focused, predictable revenue | No demand generation, caterers must find clients themselves | Subscription ($X/month) |
| **Pure Marketplace** (Glovo for catering) | Network effects, demand generation | Chicken-and-egg, needs massive investment, commission pushback | Commission per booking (15-20%) |
| **Hybrid** (SaaS + Marketplace) | Best of both, multiple revenue streams | More complex, two products to build | Subscription + lead fees |

### 3.2 Recommendation: Phased Hybrid (SaaS-First, Marketplace-Later)

**Phase 1 (Months 1-6): SaaS Tool for Caterers**
- Build the caterer management tool (CRM, menus, quotes, calendar, invoicing)
- Revenue: Freemium subscription (Free tier with limits, Pro at 199 MAD/month, Business at 499 MAD/month)
- Go-to-market: WhatsApp groups of caterers, direct sales in Casablanca + Marrakech

**Phase 2 (Months 6-12): Discovery Layer**
- Add public caterer profiles and search/browse
- SEO pages for "traiteur [city]", "catering [event-type] [city]"
- Revenue: Lead generation fees (10-20 MAD per qualified inquiry)

**Phase 3 (Months 12-18): Full Marketplace**
- Client accounts, booking through platform, reviews
- Revenue: Transaction fee on confirmed bookings (5-8%) + subscription

### 3.3 Why SaaS-First

The fundamental constraint is that Morocco's catering industry is undigitized. Caterers currently manage everything via:
- WhatsApp message threads
- Paper notebooks
- Excel spreadsheets
- Phone calls

Before building a marketplace, we need caterers actively using digital tools. The SaaS tool creates the supply side, generates data, and builds trust. The marketplace becomes viable only after caterers have portfolios, calendars, and reviews on the platform.

---

## 4. Core Platform Architecture

### 4.1 Multi-Tenant Architecture

```
                    +-------------------+
                    |   Load Balancer   |
                    | (Vercel / Custom) |
                    +--------+----------+
                             |
                    +--------v----------+
                    |  Next.js 14 App   |
                    |  (App Router)     |
                    +--------+----------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v-----+ +-----v------+ +-----v--------+
     | tRPC Router   | | Static/SSG | | API Routes   |
     | (30+ routers) | | (SEO pages)| | (webhooks)   |
     +---------+-----+ +------+-----+ +------+-------+
               |               |              |
     +---------v---------------v--------------v------+
     |              Prisma ORM (Multi-Schema)         |
     +---+---------+---------+---------+----------+--+
         |         |         |         |          |
    +----v--+ +----v--+ +---v---+ +---v----+ +--v-----+
    |Supabase| |Supabase| |Supabase| |Supabase| |Supabase|
    |  Auth  | |  DB    | |Storage | | Real-  | |  Edge  |
    |        | |(Postgres| |       | | time   | | Funcs  |
    +--------+ +--------+ +-------+ +--------+ +--------+
```

### 4.2 Tenant Isolation Strategy

Every table in the public schema includes a `user_id` column referencing `auth.users(id)`. Row-Level Security (RLS) policies enforce that:

1. **Caterers** see only their own data (menus, inquiries, events, invoices)
2. **Clients** see only published caterer profiles and their own inquiries/bookings
3. **Admin** has cross-tenant visibility via service role
4. **Service role** (tRPC backend) bypasses RLS for cross-tenant operations (marketplace search, analytics)

This is the same pattern FeastQR uses successfully with 30+ tables and 68+ RLS policies.

### 4.3 Application Layer Architecture (tRPC Routers)

```
src/server/api/routers/
  auth.ts                    # [REUSE] Supabase auth (register, login, profile)
  caterers.ts                # [NEW] Caterer profile CRUD, verification, portfolio
  catering-menus.ts          # [EVOLVE] Evolve from existing catering.ts router
  packages.ts                # [NEW] Package builder, pricing tiers
  events.ts                  # [NEW] Event lifecycle (inquiry -> booking -> execution)
  quotes.ts                  # [NEW] Quote generation, negotiation, approval
  calendar.ts                # [NEW] Availability, scheduling, conflict detection
  payments.ts                # [EVOLVE] Deposits, milestones, COD, CMI integration
  invoices.ts                # [NEW] Invoice generation, TVA, PDF export
  equipment.ts               # [NEW] Asset tracking, inventory
  staff.ts                   # [EVOLVE] Staff scheduling for events
  messaging.ts               # [NEW] In-app messaging, WhatsApp integration
  reviews.ts                 # [REUSE] Review system (adapt for events)
  analytics.ts               # [EVOLVE] Catering-specific analytics
  directory.ts               # [EVOLVE] Caterer discovery, search
  notifications.ts           # [REUSE] Push + WhatsApp notifications
  ai.ts                      # [EVOLVE] AI menu suggestions, quote generation
  theme.ts                   # [REUSE] Caterer page branding
  marketing.ts               # [REUSE] Coupons, campaigns
  settings.ts                # [NEW] Platform settings, caterer preferences
```

### 4.4 Route Structure

```
PUBLIC ROUTES (SSR/SSG):
  /                           # Landing page (catering-focused)
  /explore                    # Browse caterers by city
  /explore/[city]             # City-specific caterer listings
  /explore/[city]/[event]     # City + event type (traiteur-mariage-casablanca)
  /caterer/[slug]             # Public caterer profile + portfolio
  /caterer/[slug]/menu/[id]   # Public catering menu view
  /caterer/[slug]/quote       # Request a quote (public form)
  /login                      # Auth
  /register                   # Auth (caterer + client registration)
  /for-caterers               # B2B landing (why join CaterQR)

AUTHENTICATED ROUTES (Client Portal):
  /my-events                  # Client's booked/pending events
  /my-events/[id]             # Event detail with timeline
  /my-events/[id]/messages    # Chat with caterer
  /my-events/[id]/invoice     # View/pay invoice

AUTHENTICATED ROUTES (Caterer Dashboard):
  /dashboard                  # Overview (upcoming events, pending inquiries, revenue)
  /dashboard/events           # All events (calendar + list view)
  /dashboard/events/[id]      # Event detail (timeline, checklist, staff)
  /dashboard/inquiries        # Inquiry management (new, quoted, confirmed)
  /dashboard/inquiries/[id]   # Inquiry detail + quote builder
  /dashboard/menus            # Catering menu management
  /dashboard/menus/[id]       # Menu editor (packages, items, pricing)
  /dashboard/packages         # Package templates
  /dashboard/calendar         # Availability calendar
  /dashboard/clients          # Client CRM
  /dashboard/staff            # Staff management + scheduling
  /dashboard/equipment        # Equipment inventory
  /dashboard/invoices         # Invoice management
  /dashboard/payments         # Payment tracking (deposits, milestones)
  /dashboard/analytics        # Revenue, bookings, trends
  /dashboard/reviews          # Review management
  /dashboard/portfolio        # Photo gallery management
  /dashboard/settings         # Profile, branding, payment setup
  /dashboard/marketing        # Promotions, campaigns

ADMIN ROUTES:
  /admin                      # Platform admin
  /admin/caterers             # Caterer management + verification
  /admin/analytics            # Platform-wide analytics (GMV, take rate)
  /admin/reports              # Financial reports
```

---

## 5. Booking and Event Management Engine

### 5.1 Event Lifecycle State Machine

```
                    +-----------+
                    |  INQUIRY  |  (Customer submits request)
                    +-----+-----+
                          |
                    +-----v-----+
                    |  REVIEWED  |  (Caterer has seen it)
                    +-----+-----+
                          |
                    +-----v-----+
                    |  QUOTED   |  (Caterer sent a quote)
                    +-----+-----+
                         / \
                        /   \
           +-----------+     +-----------+
           | DECLINED  |     | ACCEPTED  |
           +-----------+     +-----+-----+
                                   |
                             +-----v-----+
                             |  DEPOSIT   |  (Deposit paid)
                             |   PAID     |
                             +-----+-----+
                                   |
                             +-----v-----+
                             | CONFIRMED |  (Event is a go)
                             +-----+-----+
                                   |
                          +--------+--------+
                          |        |        |
                    +-----v-+ +---v----+ +-v--------+
                    | PREP  | | SETUP  | | EXECUTION|
                    +-------+ +--------+ +----+-----+
                                              |
                                        +-----v-----+
                                        | COMPLETED  |
                                        +-----+-----+
                                              |
                                        +-----v-----+
                                        |  SETTLED   |  (All payments cleared)
                                        +-----------+
```

States with their allowed transitions:

```typescript
const EVENT_STATES = {
  inquiry:      ['reviewed', 'cancelled'],
  reviewed:     ['quoted', 'cancelled'],
  quoted:       ['accepted', 'declined', 'quoted'], // re-quote allowed
  declined:     ['quoted'],                         // re-negotiate
  accepted:     ['deposit_paid', 'cancelled'],
  deposit_paid: ['confirmed', 'cancelled'],         // cancellation with deposit forfeiture rules
  confirmed:    ['prep', 'cancelled'],
  prep:         ['setup'],
  setup:        ['execution'],
  execution:    ['completed'],
  completed:    ['settled'],
  settled:      [],                                 // terminal
  cancelled:    [],                                 // terminal
} as const;
```

### 5.2 Event Creation Flow

**Step 1: Client Discovery**
- Client browses caterer profiles on marketplace
- OR client receives caterer's CaterQR link via WhatsApp
- OR client scans caterer's QR code at a venue/event

**Step 2: Quote Request (Public Form)**
```
Event Type:        [Wedding] [Corporate] [Birthday] [Iftar] [Other]
Event Date:        [Date Picker - must be >= lead_time_days from today]
Guest Count:       [Number Input] (slider with caterer's min-max range)
Venue:             [City Dropdown] + [Address/GPS] + [WhatsApp location]
Budget Range:      [Per-person slider: 100-500 MAD]
Service Style:     [Buffet] [Plated] [Cocktail] [Boxed] [Live Station]
Dietary Needs:     [Halal] [Vegetarian] [Vegan] [Gluten-free] [Allergies: ___]
Package Interest:  [Select from caterer's packages] or [Custom]
Special Requests:  [Text area]
Contact Info:      Name, Phone (Moroccan format), Email (optional), WhatsApp (checkbox)
```

**Step 3: Caterer Receives Inquiry**
- WhatsApp notification to caterer's phone
- Push notification in app
- Inquiry appears in dashboard with all details
- Caterer can respond via in-app messaging or WhatsApp

**Step 4: Quote Generation**
- Caterer uses Quote Builder (see section 6)
- Quote includes: itemized menu, pricing breakdown, payment schedule, T&C
- Quote sent to client via WhatsApp + in-app + email

**Step 5: Negotiation**
- Client can counter (change items, guest count, budget)
- Caterer can revise quote (multiple versions tracked)
- All negotiation logged with timestamps

**Step 6: Acceptance and Deposit**
- Client accepts quote
- Payment schedule created (deposit + milestones)
- Deposit collected (COD/bank transfer/CMI)
- Event moves to "confirmed"

### 5.3 Calendar Management

```typescript
// Calendar data structure
interface CatererCalendar {
  // Block dates (vacations, holidays, personal)
  blockedDates: Array<{
    date: string;          // YYYY-MM-DD
    reason?: string;
    isRecurring: boolean;  // e.g., every Friday
  }>;

  // Capacity per day (a caterer might do 2 small events or 1 large)
  dailyCapacity: {
    maxEvents: number;       // default: 2
    maxGuests: number;       // default: 500
    maxStaffAvailable: number;
  };

  // Existing bookings (from events table)
  bookedEvents: Array<{
    id: string;
    date: string;
    guestCount: number;
    status: EventStatus;
    clientName: string;
    eventType: string;
  }>;

  // Busy seasons (auto-detected from historical data)
  seasonalDemand: Array<{
    month: number;
    demandLevel: 'low' | 'medium' | 'high' | 'peak';
    avgEvents: number;
  }>;
}
```

**Conflict Detection Rules:**
1. Two confirmed events on the same date: WARNING (allowed if total guests < dailyCapacity.maxGuests)
2. Event on a blocked date: BLOCKED (not allowed)
3. Event within 2 days of another event with 200+ guests: WARNING (setup/teardown overlap)
4. Three events in 3 consecutive days: WARNING (staff fatigue)

### 5.4 Multi-Day Event Support

Some events span multiple days (multi-day weddings, corporate retreats, conferences):

```typescript
interface MultiDayEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  days: Array<{
    date: string;
    dayLabel: string;         // "Day 1: Henna Night", "Day 2: Wedding Ceremony"
    startTime: string;
    endTime: string;
    guestCount: number;       // may vary per day
    menuId: string;           // different menu per day
    venueAddress: string;     // may change per day
    staffAssignments: StaffAssignment[];
    equipmentNeeds: EquipmentNeed[];
    timeline: TimelineItem[];
  }>;
  totalBudget: number;
  paymentSchedule: PaymentMilestone[];
}
```

---

## 6. Menu and Pricing Engine

### 6.1 Pricing Models

Catering pricing is inherently more complex than restaurant pricing. The engine must support three models simultaneously:

**Model A: Per-Person Pricing**
```
Gold Package: 250 MAD/person (min 50, max 300 guests)
  - 3 appetizers (choose from 8)
  - 2 main courses (choose from 6)
  - 1 dessert (choose from 4)
  - Drinks package included
  - Staff service included
```

**Model B: Per-Dish/Unit Pricing**
```
Whole Lamb Mechoui: 3,500 MAD (serves 15-20)
Bastilla Royale: 450 MAD/piece (serves 8-10)
Mint Tea Service: 15 MAD/person
Couscous Station: 2,200 MAD (serves 30)
```

**Model C: Custom Quote (No Fixed Pricing)**
```
"Contact us for a custom quote"
- Used for luxury/destination events
- Caterer provides bespoke pricing after consultation
- Quote builder generates itemized proposal
```

### 6.2 Tiered Pricing Engine

```typescript
interface PricingTier {
  id: string;
  name: string;              // "Standard", "Premium", "Luxury"
  minGuests: number;
  maxGuests: number;
  pricePerPerson: number;    // in centimes (MAD)

  // Volume discounts
  volumeDiscounts: Array<{
    minGuests: number;        // e.g., 100
    discountPercent: number;  // e.g., 5
  }>;

  // Seasonal adjustments
  seasonalPricing: Array<{
    startDate: string;       // "06-01" (June 1)
    endDate: string;         // "09-30" (September 30)
    multiplier: number;      // 1.2 (20% premium for wedding season)
    label: string;           // "Wedding Season"
  }>;

  // Day-of-week adjustments
  weekendPremium: number;    // 1.15 (15% more for Friday/Saturday)

  // Included services
  includedServices: string[];  // ["delivery", "setup", "staff"]
  addonServices: Array<{
    name: string;
    pricePerPerson?: number;
    flatPrice?: number;
  }>;
}
```

### 6.3 Quote Builder

The Quote Builder is the central tool for caterers to create proposals:

```typescript
interface CateringQuote {
  id: string;
  version: number;           // Track revisions (v1, v2, v3...)
  eventId: string;
  catererId: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

  // Event context
  eventDate: string;
  guestCount: number;
  eventType: string;
  venueAddress: string;

  // Line items
  sections: Array<{
    name: string;             // "Appetizers", "Main Course", "Setup"
    items: Array<{
      name: string;
      description?: string;
      quantity: number;
      unitType: 'per_person' | 'per_unit' | 'flat';
      unitPrice: number;      // centimes
      subtotal: number;
    }>;
    sectionTotal: number;
  }>;

  // Pricing
  subtotal: number;
  seasonalAdjustment: number;
  volumeDiscount: number;
  additionalCharges: Array<{
    name: string;             // "Delivery to Marrakech", "Premium Tableware"
    amount: number;
  }>;
  tva: number;               // 20% for corporate, 0% for individuals
  totalAmount: number;

  // Payment schedule
  paymentSchedule: Array<{
    label: string;            // "Deposit (30%)", "Pre-event (50%)", "Post-event (20%)"
    percentage: number;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue';
    paymentMethod?: string;
  }>;

  // Terms
  validUntil: string;         // Quote expiry date
  cancellationPolicy: string;
  termsAndConditions: string;

  // Metadata
  createdAt: string;
  sentAt?: string;
  respondedAt?: string;
  notes?: string;
}
```

### 6.4 Menu Builder for Caterers

Caterers need to create reusable menu templates that can be customized per event:

```
Catering Menu Structure:
  |
  +-- Packages (pre-built bundles)
  |     +-- "Gold Wedding" (250 MAD/person)
  |     |     +-- Category: Appetizers (choose 3 from 8)
  |     |     +-- Category: Main Courses (choose 2 from 6)
  |     |     +-- Category: Desserts (choose 1 from 4)
  |     |     +-- Category: Beverages (included)
  |     |
  |     +-- "Corporate Lunch" (180 MAD/person)
  |           +-- Category: Starters (choose 2 from 5)
  |           +-- Category: Main (choose 1 from 4)
  |           +-- Category: Dessert (1 included)
  |
  +-- A La Carte Items (individual pricing)
  |     +-- Whole Lamb Mechoui (3,500 MAD)
  |     +-- Extra Couscous Station (2,200 MAD)
  |     +-- Fruit Display (800 MAD)
  |
  +-- Add-on Services
        +-- Staff Service (50 MAD/person)
        +-- Equipment Rental (flat fee)
        +-- Decoration Package (3,000-15,000 MAD)
        +-- Live Cooking Station (2,500 MAD)
```

### 6.5 Dietary and Allergen Management at Scale

For events with 50-1000 guests, dietary management is critical:

```typescript
interface EventDietaryProfile {
  eventId: string;
  totalGuests: number;

  // Dietary breakdown (collected from client or RSVPs)
  dietaryCounts: {
    standard: number;        // No restrictions
    vegetarian: number;
    vegan: number;
    glutenFree: number;
    dairyFree: number;
    nutFree: number;
    halal: number;           // Typically 100% in Morocco
    kosher: number;
    other: Array<{ name: string; count: number }>;
  };

  // Allergen alerts
  allergenAlerts: Array<{
    allergen: string;
    guestCount: number;
    severity: 'preference' | 'intolerance' | 'allergy' | 'anaphylaxis';
    notes: string;
  }>;

  // Menu adjustments needed
  menuAdjustments: Array<{
    originalItem: string;
    substituteItem: string;
    reason: string;
    affectedGuests: number;
  }>;
}
```

---

## 7. Financial System

### 7.1 Payment Architecture

```
         +------------------------------------------+
         |           Payment Orchestrator            |
         |  (src/server/payments/orchestrator.ts)    |
         +----+-------+-------+--------+--------+---+
              |       |       |        |        |
         +----v--+ +--v---+ +v-----+ +v-----+ +v--------+
         | CMI   | | Bank | | COD  | | Cash | | Mobile   |
         |Gateway| |Trans | |Track | | Plus | | Money    |
         +-------+ +------+ +------+ +------+ +(Inwi etc)|
                                                +----------+
```

### 7.2 Deposit and Milestone Payment System

```typescript
interface PaymentSchedule {
  id: string;
  eventId: string;
  totalAmount: number;     // centimes
  currency: string;        // "MAD"

  milestones: Array<{
    id: string;
    label: string;
    percentage: number;
    amount: number;         // centimes
    dueDate: string;
    status: 'pending' | 'due' | 'paid' | 'overdue' | 'waived';
    paidAt?: string;
    paymentMethod?: 'cmi' | 'bank_transfer' | 'cash' | 'mobile_money';
    paymentReference?: string;  // Bank transfer ref, CMI transaction ID
    receiptUrl?: string;
    notes?: string;
  }>;

  // Cancellation rules
  cancellationPolicy: {
    fullRefundBefore: number;    // days before event for full refund
    partialRefundBefore: number; // days before for partial refund
    partialRefundPercent: number;
    noRefundBefore: number;      // days before = no refund
  };
}
```

**Default Payment Schedule Templates:**

```typescript
const PAYMENT_TEMPLATES = {
  standard: {
    name: "Standard (30/50/20)",
    milestones: [
      { label: "Deposit", percentage: 30, dueDaysBeforeEvent: 30 },
      { label: "Pre-event", percentage: 50, dueDaysBeforeEvent: 7 },
      { label: "Final", percentage: 20, dueDaysAfterEvent: 3 },
    ],
  },
  half_half: {
    name: "Half-Half (50/50)",
    milestones: [
      { label: "Deposit", percentage: 50, dueDaysBeforeEvent: 14 },
      { label: "Balance", percentage: 50, dueDaysBeforeEvent: 1 },
    ],
  },
  full_advance: {
    name: "Full Advance",
    milestones: [
      { label: "Full Payment", percentage: 100, dueDaysBeforeEvent: 7 },
    ],
  },
  corporate: {
    name: "Corporate (NET 30)",
    milestones: [
      { label: "Deposit", percentage: 30, dueDaysBeforeEvent: 14 },
      { label: "Balance", percentage: 70, dueDaysAfterEvent: 30 },
    ],
  },
};
```

### 7.3 CMI Integration Architecture

```typescript
// src/server/payments/cmi.ts
interface CMIPaymentConfig {
  merchantId: string;          // CMI merchant account
  storeKey: string;            // Secure key
  callbackUrl: string;         // /api/webhooks/cmi
  okUrl: string;               // /payment/success
  failUrl: string;             // /payment/failed
  currency: '504';             // MAD currency code
  language: 'fr' | 'ar';
  encoding: 'UTF-8';
}

// Payment flow:
// 1. Generate CMI form data with HMAC hash
// 2. Redirect to CMI hosted payment page (3D Secure mandatory)
// 3. CMI posts back to callbackUrl
// 4. Verify HMAC signature
// 5. Update payment milestone status
// 6. Send WhatsApp confirmation to caterer + client
```

### 7.4 Invoice Generation

```typescript
interface CateringInvoice {
  id: string;
  invoiceNumber: string;      // "CQR-2026-00123"
  eventId: string;
  catererId: string;
  clientId?: string;

  // Client details
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  clientICE?: string;          // Morocco tax ID for corporate

  // Caterer details
  catererName: string;
  catererICE: string;
  catererRC: string;           // Registre de Commerce
  catererAddress: string;

  // Line items (from accepted quote)
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  subtotal: number;
  tvaRate: number;             // 20% for B2B, 0% for individuals
  tvaAmount: number;
  totalAmount: number;

  // Payment tracking
  payments: Array<{
    date: string;
    amount: number;
    method: string;
    reference: string;
  }>;
  amountPaid: number;
  amountDue: number;

  // Status
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  issuedAt: string;
  dueDate: string;
  paidAt?: string;

  // PDF generation
  pdfUrl?: string;
}
```

### 7.5 Commission and Fee Structure (Marketplace Phase)

```
Revenue Streams:
  1. Subscription:     Free / Pro (199 MAD/mo) / Business (499 MAD/mo)
  2. Lead Fees:        10-20 MAD per qualified inquiry (marketplace phase)
  3. Transaction Fee:  5-8% on bookings made through platform
  4. Featured Listing: 500-2,000 MAD/month for promoted placement
  5. AI Credits:       Usage-based AI features (menu generation, photo enhancement)
```

---

## 8. Logistics and Operations

### 8.1 Delivery Planning for Large Orders

Catering delivery is fundamentally different from food delivery:
- Deliveries are scheduled (not on-demand)
- Loads are large (van/truck, not motorcycle)
- Setup time at venue (30-120 minutes)
- Equipment must go AND come back

```typescript
interface DeliveryPlan {
  eventId: string;
  eventDate: string;
  venueAddress: string;
  venueCoordinates?: { lat: number; lng: number };

  // Timeline
  loadingStartTime: string;    // When to start loading at kitchen
  departureTime: string;       // When vehicle leaves kitchen
  estimatedArrival: string;    // ETA at venue
  setupStartTime: string;      // When setup begins at venue
  serviceStartTime: string;    // When food service begins
  serviceEndTime: string;      // When food service ends
  teardownEndTime: string;     // When cleanup is done
  returnTime: string;          // When vehicle returns to base

  // Vehicle
  vehicleType: 'car' | 'van' | 'truck' | 'multiple';
  vehicleDetails?: string;
  driverName?: string;
  driverPhone?: string;

  // Load manifest
  foodItems: Array<{
    name: string;
    quantity: number;
    containerType: string;     // "chafing dish", "tray", "cooler"
    temperatureRequirement: 'hot' | 'cold' | 'ambient';
    specialHandling?: string;
  }>;

  equipmentItems: Array<{
    name: string;
    quantity: number;
    returnRequired: boolean;
  }>;

  // Checklist
  loadingChecklist: Array<{
    item: string;
    checked: boolean;
    checkedBy?: string;
    checkedAt?: string;
  }>;
  setupChecklist: Array<{
    item: string;
    checked: boolean;
  }>;
  teardownChecklist: Array<{
    item: string;
    checked: boolean;
  }>;
}
```

### 8.2 Equipment Tracking

```typescript
interface Equipment {
  id: string;
  catererId: string;
  name: string;               // "Chafing Dish - Large"
  category: string;           // "serving", "cooking", "table", "decoration", "linen"
  totalQuantity: number;
  availableQuantity: number;
  condition: 'new' | 'good' | 'fair' | 'needs_repair' | 'retired';
  purchasePrice?: number;
  rentalPricePerDay?: number;  // If also rented out
  imageUrl?: string;
  notes?: string;
}

interface EquipmentAllocation {
  id: string;
  equipmentId: string;
  eventId: string;
  quantity: number;
  status: 'reserved' | 'deployed' | 'returned' | 'damaged' | 'lost';
  deployedAt?: string;
  returnedAt?: string;
  damageNotes?: string;
  damageCost?: number;
}
```

### 8.3 Staff Scheduling and Assignment

```typescript
interface CateringStaffMember {
  id: string;
  catererId: string;
  name: string;
  phone: string;
  role: 'chef' | 'sous_chef' | 'cook' | 'server' | 'bartender' | 'setup_crew' | 'driver' | 'manager';
  isFullTime: boolean;
  hourlyRate?: number;         // centimes
  dailyRate?: number;          // centimes
  skills: string[];            // ["pastry", "live_cooking", "bar_service"]
  availability: {
    defaultAvailable: DayOfWeek[];
    blockedDates: string[];
  };
  rating?: number;             // Internal performance rating
}

interface StaffAssignment {
  id: string;
  eventId: string;
  staffId: string;
  role: string;                // Role for THIS event
  shiftStart: string;          // "06:00" (start prep)
  shiftEnd: string;            // "23:00" (after cleanup)
  tasks: string[];             // ["prep: couscous", "serve: main course", "cleanup"]
  status: 'assigned' | 'confirmed' | 'declined' | 'completed';
  payAmount: number;           // centimes
  isPaid: boolean;
}
```

### 8.4 Kitchen Prep Timeline

```typescript
interface PrepTimeline {
  eventId: string;
  eventDate: string;
  serviceTime: string;

  // Working backwards from service time
  tasks: Array<{
    id: string;
    name: string;              // "Marinate lamb", "Prep pastilla filling"
    assignedTo: string[];      // Staff member IDs
    startTime: string;         // Could be day before
    endTime: string;
    duration: number;          // minutes
    dependencies: string[];    // Task IDs that must complete first
    status: 'pending' | 'in_progress' | 'completed';
    notes?: string;
    category: 'shopping' | 'prep' | 'cooking' | 'assembly' | 'packing' | 'transport' | 'setup';
  }>;
}
```

---

## 9. Discovery and Marketplace

### 9.1 Caterer Profile

```typescript
interface CatererProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;                 // "traiteur-atlas-casablanca"
  description: string;          // Rich text / markdown
  tagline?: string;             // "Authentic Moroccan Feasts Since 1995"

  // Location
  city: string;
  serviceArea: string[];        // Cities/regions served
  address?: string;

  // Contact
  phone: string;
  whatsappNumber: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;

  // Business details
  yearsInBusiness?: number;
  teamSize?: number;
  cuisineTypes: string[];       // ["moroccan", "international", "fusion"]
  eventTypes: string[];         // ["wedding", "corporate", "birthday", "iftar"]
  serviceStyles: string[];      // ["buffet", "plated", "cocktail", "live_station"]
  capacityRange: { min: number; max: number };
  priceRange: { min: number; max: number };  // per person in MAD
  languages: string[];          // ["ar", "fr", "en"]

  // Portfolio
  coverImageUrl?: string;
  logoUrl?: string;
  galleryImages: Array<{
    url: string;
    caption?: string;
    eventType?: string;
    dateTaken?: string;
  }>;

  // Verification
  isVerified: boolean;
  verifiedAt?: string;
  verificationDocuments?: string[];
  registreCommerce?: string;
  identifiantFiscal?: string;

  // Stats (computed)
  totalEventsCompleted: number;
  averageRating: number;
  reviewCount: number;
  responseTime: string;         // "Usually responds within 2 hours"
  bookingRate: number;          // % of inquiries that become bookings

  // SEO
  metaTitle?: string;
  metaDescription?: string;
}
```

### 9.2 Search and Discovery

**Search Dimensions:**

```typescript
interface CatererSearchFilters {
  city?: string;
  serviceArea?: string[];       // "Will deliver to my city"
  eventType?: string;
  cuisineType?: string;
  serviceStyle?: string;
  guestCountRange?: { min: number; max: number };
  budgetPerPerson?: { min: number; max: number };
  eventDate?: string;           // Show only available caterers
  minRating?: number;
  isVerified?: boolean;
  hasPortfolio?: boolean;
  languages?: string[];
  sortBy: 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'reviews' | 'response_time';
}
```

**SEO Strategy:**

Generate static pages for high-value search combinations:

```
/explore/casablanca                          # "Catering in Casablanca"
/explore/casablanca/wedding                  # "Wedding Catering Casablanca"
/explore/marrakech/corporate                 # "Corporate Catering Marrakech"
/explore/rabat/iftar                         # "Iftar Catering Rabat"
/explore/fes/birthday                        # "Birthday Catering Fes"
```

Each page has:
- JSON-LD structured data (LocalBusiness, FoodService)
- Open Graph metadata
- City-specific content (Arabic + French)
- Caterer cards with mini-reviews
- FAQ section with JSON-LD
- "Request Quotes" CTA

### 9.3 Reviews and Ratings

```typescript
interface CateringReview {
  id: string;
  catererId: string;
  eventId?: string;            // Optional link to specific event
  reviewerName: string;
  reviewerPhone?: string;      // For verification
  eventType: string;
  guestCount?: number;
  eventDate?: string;

  // Multi-dimensional rating (not just one star)
  ratings: {
    overall: number;           // 1-5
    foodQuality: number;       // 1-5
    presentation: number;      // 1-5
    serviceStaff: number;      // 1-5
    punctuality: number;       // 1-5
    valueForMoney: number;     // 1-5
    communication: number;     // 1-5
  };

  comment: string;
  images?: string[];           // Event photos from client
  response?: string;           // Caterer's response
  respondedAt?: string;

  status: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;         // Linked to a confirmed event on platform

  createdAt: string;
}
```

---

## 10. Communication System

### 10.1 In-App Messaging

```typescript
interface Conversation {
  id: string;
  eventId?: string;             // Linked to specific event/inquiry
  participants: Array<{
    userId: string;
    role: 'caterer' | 'client';
    name: string;
  }>;
  lastMessageAt: string;
  unreadCount: Record<string, number>;  // Per participant
  status: 'active' | 'archived';
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'caterer' | 'client' | 'system';
  type: 'text' | 'image' | 'file' | 'quote' | 'invoice' | 'system';
  content: string;
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
    size: number;
  }>;
  metadata?: {
    quoteId?: string;
    invoiceId?: string;
    eventId?: string;
  };
  readBy: Record<string, string>;  // userId -> readAt timestamp
  createdAt: string;
}
```

**Implementation:** Use Supabase Realtime for live messaging. Subscribe to `messages` table changes filtered by `conversationId`. This avoids the need for a separate WebSocket server.

### 10.2 WhatsApp Integration

WhatsApp is the primary communication channel in Morocco. The system must support:

**Tier 1: WhatsApp Links (No API needed)**
- Generate pre-formatted WhatsApp messages
- `https://wa.me/212XXXXXXX?text=...`
- Used for: quote sharing, inquiry notifications, booking confirmations

**Tier 2: WhatsApp Business API (Phase 2)**
- Automated message templates (approved by Meta)
- Used for: status updates, payment reminders, review requests
- Provider: 360dialog or MessageBird (available in Morocco)

**Message Templates:**

```
INQUIRY_RECEIVED:
"Nouvelle demande de traiteur!
Client: {{client_name}}
Evenement: {{event_type}}
Date: {{event_date}}
Invites: {{guest_count}}
Budget: {{budget_range}} MAD/pers
Voir details: {{link}}"

QUOTE_SENT:
"Bonjour {{client_name}},
Votre devis pour {{event_type}} le {{event_date}} est pret.
Total: {{total}} MAD ({{per_person}} MAD/pers)
Valide jusqu'au: {{expiry_date}}
Voir le devis: {{link}}"

DEPOSIT_REMINDER:
"Rappel: L'acompte de {{amount}} MAD pour votre {{event_type}} du {{event_date}} est du le {{due_date}}.
Payer: {{payment_link}}"

EVENT_TOMORROW:
"Rappel: Votre evenement {{event_type}} est demain!
Heure d'arrivee: {{arrival_time}}
Lieu: {{venue_address}}
Contact traiteur: {{caterer_phone}}"
```

### 10.3 Notification Priority Matrix

| Event | In-App | Push | WhatsApp | Email | SMS |
|-------|--------|------|----------|-------|-----|
| New inquiry | Yes | Yes | Yes | No | No |
| Quote sent | Yes | Yes | Yes | Yes | No |
| Quote accepted | Yes | Yes | Yes | Yes | No |
| Payment received | Yes | Yes | Yes | Yes | No |
| Payment overdue | Yes | Yes | Yes | Yes | Yes |
| Event tomorrow | Yes | Yes | Yes | Yes | Yes |
| Review request | Yes | No | Yes | Yes | No |
| New message | Yes | Yes | No | No | No |
| Calendar conflict | Yes | Yes | No | No | No |

---

## 11. AI Features

### 11.1 AI Menu Suggestions

```typescript
// Input: Event details
interface MenuSuggestionInput {
  eventType: string;
  guestCount: number;
  budgetPerPerson: number;
  cuisinePreference: string;
  serviceStyle: string;
  dietaryRestrictions: string[];
  season: string;              // Derived from event date
  isRamadan: boolean;          // Special iftar menus
}

// Output: Suggested menu structure
interface MenuSuggestion {
  packageName: string;
  description: string;
  estimatedCostPerPerson: number;
  categories: Array<{
    name: string;
    recommendedItemCount: number;
    suggestedItems: Array<{
      name: string;
      description: string;
      isTraditional: boolean;
      allergens: string[];
    }>;
  }>;
  servingNotes: string;        // "For 200 guests, consider 2 couscous stations"
  seasonalTips: string;        // "June wedding: add refreshing gazpacho amuse-bouche"
}
```

### 11.2 Smart Pricing Recommendations

Using historical data from the platform:

```typescript
interface PricingRecommendation {
  eventType: string;
  city: string;
  guestCount: number;

  // Market positioning
  marketAverage: number;       // Average per-person price in this city/event
  marketRange: { low: number; high: number };
  suggestedPrice: number;
  positioning: 'budget' | 'mid-range' | 'premium' | 'luxury';

  // Competitive context
  competitorPrices: Array<{
    catererName: string;       // Anonymized
    priceRange: { min: number; max: number };
    rating: number;
  }>;

  // Seasonal advice
  seasonalFactor: number;      // 1.0 = normal, 1.2 = high season
  demandLevel: 'low' | 'medium' | 'high' | 'peak';
  recommendation: string;     // "Wedding season: you can charge 15-20% premium"
}
```

### 11.3 Automated Quote Generation

AI generates a first draft of a quote based on:
- Client's inquiry details
- Caterer's menu and pricing
- Historical quotes for similar events
- Seasonal adjustments

The caterer reviews and adjusts before sending.

### 11.4 Portfolio Photo Enhancement

Using the existing AI Vision infrastructure from FeastQR:
- Auto-enhance food photos (brightness, color, sharpness)
- Generate descriptive captions
- Suggest which photos to feature
- Detect and flag low-quality images

### 11.5 Demand Forecasting

```typescript
interface DemandForecast {
  month: string;
  city: string;
  predictedInquiries: number;
  predictedBookings: number;
  avgGuestCount: number;
  avgRevenuePerEvent: number;
  topEventTypes: string[];
  recommendation: string;     // "Ramadan starts March 1: prepare iftar packages"

  // Based on
  historicalData: number;      // months of data
  confidenceLevel: number;     // 0-1
}
```

---

## 12. Database Schema Design

### 12.1 Entity Relationship Overview

```
                    +----------------+
                    |    auth.users   |
                    +--------+-------+
                             |
                    +--------v--------+
                    |    profiles      |
                    +--------+--------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+          +--------v--------+
     | caterer_profiles |          |  client_profiles |
     +--------+--------+          +--------+--------+
              |                             |
              |  +----------+               |
              +->|  events   |<-------------+
              |  +-----+----+
              |        |
     +--------v--------v--------+
     |        quotes            |
     +--------+-----------------+
              |
     +--------v--------+   +----------------+
     | quote_line_items |   | payment_schedule |
     +-----------------+   +--------+--------+
                                    |
                           +--------v--------+
                           |    payments      |
                           +-----------------+

     +----------------+   +-----------------+
     | catering_menus |-->| catering_pkgs   |
     +-------+--------+   +--------+--------+
             |                      |
     +-------v--------+   +--------v--------+
     | catering_cats  |   | pkg_items (m2m) |
     +-------+--------+   +-----------------+
             |
     +-------v--------+
     | catering_items |
     +----------------+

     +-----------------+   +------------------+
     |   staff_pool    |-->| staff_assignments |
     +-----------------+   +------------------+

     +-----------------+   +------------------+
     |   equipment     |-->| equip_allocations |
     +-----------------+   +------------------+

     +-----------------+   +------------------+
     |  conversations  |-->|    messages       |
     +-----------------+   +------------------+

     +-----------------+
     | catering_reviews|
     +-----------------+

     +-----------------+
     |    invoices      |
     +-----------------+
```

### 12.2 New Tables (Beyond Existing FeastQR Schema)

The existing FeastQR catering tables provide a solid foundation. Here is what we KEEP, EVOLVE, and ADD:

**KEEP AS-IS (7 tables already in schema):**
- `catering_menus` -- Top-level catering menu
- `catering_packages` -- Pre-built bundles
- `catering_categories` -- Menu categories
- `catering_items` -- Individual dishes/items
- `catering_package_items` -- Many-to-many link
- `catering_inquiries` -- Customer requests (EVOLVE to full event lifecycle)
- `catering_themes` -- Branding for public pages

**EVOLVE (modify existing tables):**

```sql
-- Evolve catering_inquiries into full events table
ALTER TABLE public.catering_inquiries
  ADD COLUMN client_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN event_end_date DATE,
  ADD COLUMN is_multi_day BOOLEAN DEFAULT false,
  ADD COLUMN venue_coordinates POINT,
  ADD COLUMN venue_name VARCHAR(200),
  ADD COLUMN service_style VARCHAR(50),
  ADD COLUMN budget_min INT,
  ADD COLUMN budget_max INT,
  ADD COLUMN source VARCHAR(50) DEFAULT 'direct',  -- direct, marketplace, referral, whatsapp
  ADD COLUMN assigned_staff_count INT DEFAULT 0,
  ADD COLUMN total_equipment_items INT DEFAULT 0,
  ADD COLUMN last_message_at TIMESTAMPTZ,
  ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
```

**ADD (new tables):**

```sql
-- 1. Caterer Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.caterer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(200) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT,
  tagline VARCHAR(300),

  -- Location
  city VARCHAR(100),
  service_areas TEXT[],        -- Array of cities/regions
  address TEXT,

  -- Contact
  phone VARCHAR(30),
  whatsapp_number VARCHAR(30),
  email VARCHAR(200),
  website VARCHAR(500),
  instagram VARCHAR(100),
  facebook VARCHAR(100),

  -- Business details
  years_in_business INT,
  team_size INT,
  cuisine_types TEXT[],
  event_types TEXT[],
  service_styles TEXT[],
  capacity_min INT DEFAULT 10,
  capacity_max INT DEFAULT 500,
  price_min INT,               -- centimes per person
  price_max INT,               -- centimes per person
  languages TEXT[] DEFAULT ARRAY['ar', 'fr'],

  -- Branding
  logo_url TEXT,
  cover_image_url TEXT,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  registre_commerce VARCHAR(50),
  identifiant_fiscal VARCHAR(50),

  -- Settings
  default_payment_template VARCHAR(50) DEFAULT 'standard',
  default_lead_time_days INT DEFAULT 7,
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_message TEXT,

  -- SEO
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),

  -- Stats (denormalized for performance)
  total_events_completed INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  avg_response_time_minutes INT,
  booking_rate DECIMAL(5,2) DEFAULT 0,

  -- Publication
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Caterer Portfolio (event photos)
CREATE TABLE IF NOT EXISTS public.caterer_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caterer_id UUID NOT NULL REFERENCES public.caterer_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption VARCHAR(500),
  event_type VARCHAR(50),
  event_date DATE,
  is_featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Client Profiles (for marketplace phase)
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(200),
  city VARCHAR(100),
  preferred_language VARCHAR(10) DEFAULT 'fr',
  total_events_booked INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Quotes (versioned proposals)
CREATE TABLE IF NOT EXISTS public.catering_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID NOT NULL REFERENCES public.catering_inquiries(id) ON DELETE CASCADE,
  caterer_id UUID NOT NULL REFERENCES public.caterer_profiles(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- draft, sent, viewed, accepted, rejected, expired, superseded

  -- Pricing summary
  subtotal INT NOT NULL DEFAULT 0,
  seasonal_adjustment INT DEFAULT 0,
  volume_discount INT DEFAULT 0,
  additional_charges INT DEFAULT 0,
  tva_rate DECIMAL(5,2) DEFAULT 0,
  tva_amount INT DEFAULT 0,
  total_amount INT NOT NULL DEFAULT 0,
  price_per_person INT,

  -- Terms
  valid_until DATE,
  cancellation_policy TEXT,
  terms_and_conditions TEXT,
  notes TEXT,

  -- PDF
  pdf_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ
);

-- 5. Quote Line Items
CREATE TABLE IF NOT EXISTS public.catering_quote_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES public.catering_quotes(id) ON DELETE CASCADE,
  section_name VARCHAR(200) NOT NULL,  -- "Appetizers", "Main Course", "Services"
  section_order INT DEFAULT 0,
  item_name VARCHAR(200) NOT NULL,
  item_description TEXT,
  quantity INT DEFAULT 1,
  unit_type VARCHAR(20) DEFAULT 'per_person',  -- per_person, per_unit, flat
  unit_price INT NOT NULL,     -- centimes
  subtotal INT NOT NULL,       -- centimes
  item_order INT DEFAULT 0,
  catering_item_id UUID REFERENCES public.catering_items(id) ON DELETE SET NULL
);

-- 6. Payment Schedules (milestone-based)
CREATE TABLE IF NOT EXISTS public.catering_payment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID NOT NULL REFERENCES public.catering_inquiries(id) ON DELETE CASCADE,
  template_name VARCHAR(50),
  total_amount INT NOT NULL,
  currency VARCHAR(10) DEFAULT 'MAD',

  -- Cancellation policy
  full_refund_days_before INT DEFAULT 30,
  partial_refund_days_before INT DEFAULT 14,
  partial_refund_percent INT DEFAULT 50,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Payment Milestones
CREATE TABLE IF NOT EXISTS public.catering_payment_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES public.catering_payment_schedules(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,     -- "Deposit (30%)", "Pre-event (50%)"
  percentage DECIMAL(5,2) NOT NULL,
  amount INT NOT NULL,              -- centimes
  due_date DATE NOT NULL,
  status VARCHAR(30) DEFAULT 'pending',
    -- pending, due, paid, overdue, waived
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(30),       -- cmi, bank_transfer, cash, mobile_money
  payment_reference VARCHAR(200),   -- Bank ref or CMI transaction ID
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Equipment Inventory
CREATE TABLE IF NOT EXISTS public.catering_equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caterer_id UUID NOT NULL REFERENCES public.caterer_profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,    -- serving, cooking, table, decoration, linen
  total_quantity INT NOT NULL DEFAULT 1,
  available_quantity INT NOT NULL DEFAULT 1,
  condition VARCHAR(30) DEFAULT 'good',
  purchase_price INT,               -- centimes
  rental_price_per_day INT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Equipment Allocations (per event)
CREATE TABLE IF NOT EXISTS public.catering_equipment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL REFERENCES public.catering_equipment(id) ON DELETE CASCADE,
  inquiry_id UUID NOT NULL REFERENCES public.catering_inquiries(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  status VARCHAR(30) DEFAULT 'reserved',
    -- reserved, deployed, returned, damaged, lost
  deployed_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  damage_notes TEXT,
  damage_cost INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Catering Staff Pool
CREATE TABLE IF NOT EXISTS public.catering_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caterer_id UUID NOT NULL REFERENCES public.caterer_profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(30),
  role VARCHAR(50) NOT NULL,        -- chef, sous_chef, cook, server, setup_crew, driver
  is_full_time BOOLEAN DEFAULT false,
  hourly_rate INT,                  -- centimes
  daily_rate INT,                   -- centimes
  skills TEXT[],
  default_available_days TEXT[],    -- ["monday", "tuesday", ...]
  blocked_dates DATE[],
  rating DECIMAL(3,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Staff Assignments (per event)
CREATE TABLE IF NOT EXISTS public.catering_staff_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID NOT NULL REFERENCES public.catering_inquiries(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.catering_staff(id) ON DELETE CASCADE,
  assigned_role VARCHAR(50),
  shift_start TIME,
  shift_end TIME,
  tasks TEXT[],
  status VARCHAR(30) DEFAULT 'assigned',
    -- assigned, confirmed, declined, completed
  pay_amount INT,                   -- centimes
  is_paid BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(inquiry_id, staff_id)
);

-- 12. Conversations (messaging)
CREATE TABLE IF NOT EXISTS public.catering_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID REFERENCES public.catering_inquiries(id) ON DELETE SET NULL,
  caterer_id UUID NOT NULL REFERENCES public.caterer_profiles(id) ON DELETE CASCADE,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name VARCHAR(200),
  client_phone VARCHAR(30),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_caterer INT DEFAULT 0,
  unread_client INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Messages
CREATE TABLE IF NOT EXISTS public.catering_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.catering_conversations(id) ON DELETE CASCADE,
  sender_id UUID,                   -- auth.users ID (NULL for system messages)
  sender_role VARCHAR(20) NOT NULL, -- caterer, client, system
  message_type VARCHAR(20) DEFAULT 'text',
    -- text, image, file, quote, invoice, system
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Catering Reviews (multi-dimensional)
CREATE TABLE IF NOT EXISTS public.catering_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caterer_id UUID NOT NULL REFERENCES public.caterer_profiles(id) ON DELETE CASCADE,
  inquiry_id UUID REFERENCES public.catering_inquiries(id) ON DELETE SET NULL,
  reviewer_name VARCHAR(200) NOT NULL,
  reviewer_phone VARCHAR(30),
  event_type VARCHAR(50),
  guest_count INT,
  event_date DATE,

  -- Multi-dimensional ratings
  rating_overall INT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_food_quality INT CHECK (rating_food_quality BETWEEN 1 AND 5),
  rating_presentation INT CHECK (rating_presentation BETWEEN 1 AND 5),
  rating_service_staff INT CHECK (rating_service_staff BETWEEN 1 AND 5),
  rating_punctuality INT CHECK (rating_punctuality BETWEEN 1 AND 5),
  rating_value_for_money INT CHECK (rating_value_for_money BETWEEN 1 AND 5),
  rating_communication INT CHECK (rating_communication BETWEEN 1 AND 5),

  comment TEXT,
  images TEXT[],
  response TEXT,
  responded_at TIMESTAMPTZ,

  status VARCHAR(20) DEFAULT 'pending',
    -- pending, approved, rejected
  is_verified BOOLEAN DEFAULT false, -- true if linked to confirmed event

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Invoices
CREATE TABLE IF NOT EXISTS public.catering_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  inquiry_id UUID NOT NULL REFERENCES public.catering_inquiries(id) ON DELETE CASCADE,
  caterer_id UUID NOT NULL REFERENCES public.caterer_profiles(id) ON DELETE CASCADE,

  -- Client
  client_name VARCHAR(200) NOT NULL,
  client_phone VARCHAR(30),
  client_email VARCHAR(200),
  client_address TEXT,
  client_ice VARCHAR(50),       -- Morocco tax ID (Identifiant Commun de l'Entreprise)

  -- Caterer
  caterer_business_name VARCHAR(200),
  caterer_ice VARCHAR(50),
  caterer_rc VARCHAR(50),       -- Registre de Commerce
  caterer_address TEXT,

  -- Amounts
  subtotal INT NOT NULL,
  tva_rate DECIMAL(5,2) DEFAULT 0,
  tva_amount INT DEFAULT 0,
  total_amount INT NOT NULL,
  amount_paid INT DEFAULT 0,
  amount_due INT NOT NULL,
  currency VARCHAR(10) DEFAULT 'MAD',

  -- Status
  status VARCHAR(20) DEFAULT 'draft',
    -- draft, sent, partial, paid, overdue, cancelled
  issued_at TIMESTAMPTZ,
  due_date DATE,
  paid_at TIMESTAMPTZ,

  -- PDF
  pdf_url TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Invoice Line Items
CREATE TABLE IF NOT EXISTS public.catering_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.catering_invoices(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price INT NOT NULL,      -- centimes
  total INT NOT NULL,           -- centimes
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Event Day Agenda (for multi-day or detailed planning)
CREATE TABLE IF NOT EXISTS public.catering_event_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID NOT NULL REFERENCES public.catering_inquiries(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  day_label VARCHAR(200),       -- "Day 1: Henna Night"
  start_time TIME,
  end_time TIME,
  guest_count INT,
  venue_name VARCHAR(200),
  venue_address TEXT,
  menu_id UUID REFERENCES public.catering_menus(id) ON DELETE SET NULL,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Prep Timeline Tasks
CREATE TABLE IF NOT EXISTS public.catering_prep_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID NOT NULL REFERENCES public.catering_inquiries(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) DEFAULT 'prep',
    -- shopping, prep, cooking, assembly, packing, transport, setup, teardown
  assigned_to UUID[] DEFAULT ARRAY[]::UUID[],
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INT,
  depends_on UUID[],            -- task IDs that must complete first
  status VARCHAR(30) DEFAULT 'pending',
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Delivery Plans
CREATE TABLE IF NOT EXISTS public.catering_delivery_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inquiry_id UUID NOT NULL UNIQUE REFERENCES public.catering_inquiries(id) ON DELETE CASCADE,
  venue_coordinates POINT,
  vehicle_type VARCHAR(30),
  driver_name VARCHAR(200),
  driver_phone VARCHAR(30),

  loading_start_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  estimated_arrival TIMESTAMPTZ,
  setup_start_time TIMESTAMPTZ,
  service_start_time TIMESTAMPTZ,
  service_end_time TIMESTAMPTZ,
  teardown_end_time TIMESTAMPTZ,
  return_time TIMESTAMPTZ,

  food_manifest JSONB DEFAULT '[]'::jsonb,
  equipment_manifest JSONB DEFAULT '[]'::jsonb,
  loading_checklist JSONB DEFAULT '[]'::jsonb,
  setup_checklist JSONB DEFAULT '[]'::jsonb,
  teardown_checklist JSONB DEFAULT '[]'::jsonb,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 12.3 Index Strategy

```sql
-- Caterer profiles
CREATE INDEX idx_caterer_profiles_user_id ON public.caterer_profiles(user_id);
CREATE INDEX idx_caterer_profiles_slug ON public.caterer_profiles(slug);
CREATE INDEX idx_caterer_profiles_city ON public.caterer_profiles(city);
CREATE INDEX idx_caterer_profiles_published ON public.caterer_profiles(is_published) WHERE is_published = true;
CREATE INDEX idx_caterer_profiles_rating ON public.caterer_profiles(average_rating DESC) WHERE is_published = true;
CREATE INDEX idx_caterer_profiles_event_types ON public.caterer_profiles USING GIN(event_types);
CREATE INDEX idx_caterer_profiles_cuisine_types ON public.caterer_profiles USING GIN(cuisine_types);

-- Quotes
CREATE INDEX idx_catering_quotes_inquiry ON public.catering_quotes(inquiry_id);
CREATE INDEX idx_catering_quotes_status ON public.catering_quotes(status);
CREATE INDEX idx_catering_quotes_caterer ON public.catering_quotes(caterer_id);

-- Payments
CREATE INDEX idx_payment_milestones_schedule ON public.catering_payment_milestones(schedule_id);
CREATE INDEX idx_payment_milestones_status ON public.catering_payment_milestones(status);
CREATE INDEX idx_payment_milestones_due ON public.catering_payment_milestones(due_date) WHERE status IN ('pending', 'due');

-- Equipment
CREATE INDEX idx_equipment_caterer ON public.catering_equipment(caterer_id);
CREATE INDEX idx_equipment_alloc_event ON public.catering_equipment_allocations(inquiry_id);
CREATE INDEX idx_equipment_alloc_status ON public.catering_equipment_allocations(status);

-- Staff
CREATE INDEX idx_staff_caterer ON public.catering_staff(caterer_id);
CREATE INDEX idx_staff_assignments_event ON public.catering_staff_assignments(inquiry_id);

-- Messaging
CREATE INDEX idx_conversations_caterer ON public.catering_conversations(caterer_id);
CREATE INDEX idx_conversations_last_msg ON public.catering_conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON public.catering_messages(conversation_id);
CREATE INDEX idx_messages_created ON public.catering_messages(conversation_id, created_at DESC);

-- Reviews
CREATE INDEX idx_catering_reviews_caterer ON public.catering_reviews(caterer_id);
CREATE INDEX idx_catering_reviews_rating ON public.catering_reviews(caterer_id, rating_overall DESC);
CREATE INDEX idx_catering_reviews_status ON public.catering_reviews(status);

-- Invoices
CREATE INDEX idx_invoices_caterer ON public.catering_invoices(caterer_id);
CREATE INDEX idx_invoices_inquiry ON public.catering_invoices(inquiry_id);
CREATE INDEX idx_invoices_status ON public.catering_invoices(status);
CREATE INDEX idx_invoices_due ON public.catering_invoices(due_date) WHERE status IN ('sent', 'partial', 'overdue');
```

---

## 13. Analytics and Insights

### 13.1 Caterer Dashboard Analytics

```typescript
interface CatererDashboard {
  // Period: today, week, month, quarter, year, all
  period: string;

  // KPIs
  totalRevenue: number;
  totalEvents: number;
  avgRevenuePerEvent: number;
  avgGuestsPerEvent: number;
  bookingRate: number;           // % of inquiries -> confirmed
  avgResponseTime: number;       // minutes
  customerSatisfaction: number;  // avg rating

  // Pipeline
  pipeline: {
    newInquiries: number;
    quotedNotResponded: number;
    confirmedUpcoming: number;
    overduePayments: number;
  };

  // Revenue breakdown
  revenueByEventType: Array<{ type: string; revenue: number; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number; events: number }>;

  // Popular items
  topPackages: Array<{ name: string; bookings: number; revenue: number }>;
  topItems: Array<{ name: string; timesOrdered: number }>;

  // Calendar heatmap
  busyDays: Array<{ date: string; eventCount: number; guestCount: number }>;

  // Client insights
  repeatClients: number;
  newClients: number;
  topClients: Array<{ name: string; events: number; totalSpent: number }>;
}
```

### 13.2 Platform Analytics (Admin)

```typescript
interface PlatformAnalytics {
  // GMV (Gross Merchandise Value)
  totalGMV: number;
  gmvGrowthRate: number;

  // Supply
  totalCaterers: number;
  activeCaterers: number;        // Active in last 30 days
  verifiedCaterers: number;
  avgCatererRating: number;
  caterersByCity: Array<{ city: string; count: number }>;

  // Demand
  totalInquiries: number;
  inquiryConversionRate: number;
  avgDealSize: number;
  inquiriesByEventType: Array<{ type: string; count: number }>;
  inquiriesByCity: Array<{ city: string; count: number }>;

  // Revenue
  platformRevenue: number;       // Subscriptions + commissions
  takeRate: number;              // Platform revenue / GMV
  arpu: number;                  // Average Revenue Per User (caterer)
  mrr: number;                   // Monthly Recurring Revenue

  // Engagement
  dau: number;                   // Daily Active Users
  mau: number;                   // Monthly Active Users
  avgSessionDuration: number;
  featureUsage: Record<string, number>;

  // Seasonal trends
  monthlyTrends: Array<{
    month: string;
    inquiries: number;
    bookings: number;
    gmv: number;
    avgDealSize: number;
  }>;
}
```

---

## 14. FeastQR Reuse Assessment

### 14.1 Direct Reuse (No Modification)

| Module | Files | Why |
|--------|-------|-----|
| Auth system | `src/server/api/routers/auth.ts`, `src/providers/AuthProvider` | Same Supabase auth, same flow |
| i18n framework | `src/i18n/`, `src/providers/LanguageProvider` | Same EN/FR/AR structure |
| Theme engine | `src/lib/theme/`, `themeToCSS`, `buildGoogleFontsUrl` | Same CSS custom property system |
| UI components | `src/components/ui/` (shadcn) | Universal component library |
| Security utils | `src/server/security.ts`, `src/server/rateLimit.ts` | Same security patterns |
| Cache system | `src/server/cache.ts` | Same TTL-based caching |
| Logger | `src/server/logger.ts` | Same structured logging |
| PWA | `src/components/PWA/` | Same service worker, offline support |
| Cookie consent | Cookie consent banner | Same GDPR compliance |
| AI providers | `src/server/ai/` | Same OpenAI/Anthropic/Gemini abstraction |
| Notifications | `src/server/pushNotification.ts` | Same Web Push infrastructure |

### 14.2 Evolve (Modify Existing)

| Module | What Changes | Effort |
|--------|-------------|--------|
| Catering router | Evolve 29 endpoints to full event lifecycle | Medium |
| Theme types | Add catering-specific theme options (event-page vs menu-page) | Small |
| Analytics router | Add catering KPIs alongside menu analytics | Medium |
| Reviews | Add multi-dimensional ratings, event context | Small |
| Marketing | Adapt coupons/campaigns for catering context | Small |
| Directory | Caterer search replaces restaurant search | Medium |
| Payments | Add milestone payments, CMI gateway, invoicing | Large |
| Staff | Evolve staff management for event-based scheduling | Medium |

### 14.3 Build New

| Module | Description | Effort |
|--------|-------------|--------|
| Caterer profiles | Full profile management + portfolio | Medium |
| Quote builder | Multi-version quote system with line items | Large |
| Calendar engine | Availability, conflicts, booking calendar | Large |
| Event lifecycle | State machine, multi-day support, timelines | Large |
| Equipment tracking | Inventory + per-event allocation | Medium |
| Messaging system | Real-time conversations (Supabase Realtime) | Medium |
| Invoice generator | PDF generation, TVA, Moroccan compliance | Medium |
| CMI integration | Payment gateway integration | Medium |
| Delivery planning | Logistics for large-scale catering | Small |
| Demand forecasting | AI-powered seasonal predictions | Small |

### 14.4 Remove (Not Needed for Catering)

| Module | Why |
|--------|-----|
| QR code generation | Caterers do not scan QR codes at tables |
| Kitchen display system (KDS) | Events use prep timelines, not live order screens |
| Table ordering / cart | No real-time ordering; inquiry-based |
| Loyalty stamps | Not applicable to infrequent catering bookings |
| Menu scheduling (weekly calendar) | Replaced by event calendar |
| Sold-out toggle | Replaced by availability management |
| Delivery zone management (radius) | Replaced by service area management |
| Driver management | No on-demand drivers; staff-based logistics |

---

## 15. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Core caterer tool -- create menus, receive inquiries, generate quotes.

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 1 | Fork FeastQR, strip non-catering modules, rebrand to CaterQR | Clean codebase, new branding |
| 1 | Caterer profile setup flow (onboarding wizard) | Registration + profile page |
| 2 | Evolve catering menus (packages, items, categories) [P] | Menu builder dashboard |
| 2 | Public caterer page (`/caterer/[slug]`) [P] | SEO-ready caterer profiles |
| 3 | Quote builder (create, version, send) [P] | Quote management dashboard |
| 3 | Event lifecycle state machine [P] | Inquiry -> Quote -> Confirm flow |
| 4 | Payment schedule creation [P] | Milestone tracking |
| 4 | WhatsApp notification links [P] | Quote sharing via WhatsApp |

[P] = Parallelizable tasks

**DB Migration:** 12 new tables, 7 evolved tables
**Tests:** Target 200+ tests for new routers
**Routes:** 15-20 new routes

### Phase 2: Operations (Weeks 5-8)

**Goal:** Full event management -- staff, equipment, calendar, invoicing.

| Week | Tasks |
|------|-------|
| 5 | Calendar management + availability [P] |
| 5 | Staff pool + per-event assignment [P] |
| 6 | Equipment inventory + allocation [P] |
| 6 | Event day agenda + prep timeline [P] |
| 7 | Invoice generation + PDF export [P] |
| 7 | COD payment tracking + bank transfer confirmation [P] |
| 8 | In-app messaging (Supabase Realtime) |
| 8 | Mobile-responsive dashboard polish |

### Phase 3: Discovery (Weeks 9-12)

**Goal:** Public marketplace -- search, SEO, reviews.

| Week | Tasks |
|------|-------|
| 9 | Explore page (caterer search + filters) [P] |
| 9 | City SEO pages (SSG for top 12 Moroccan cities) [P] |
| 10 | Event type pages (/explore/casablanca/wedding) [P] |
| 10 | Multi-dimensional review system [P] |
| 11 | Caterer verification system [P] |
| 11 | Featured/promoted listings [P] |
| 12 | Client portal (my events, payments, messages) |
| 12 | Public quote request form |

### Phase 4: Intelligence (Weeks 13-16)

**Goal:** AI features, analytics, marketplace optimization.

| Week | Tasks |
|------|-------|
| 13 | Caterer dashboard analytics [P] |
| 13 | AI menu suggestion engine [P] |
| 14 | AI quote generation [P] |
| 14 | Demand forecasting [P] |
| 15 | CMI payment gateway integration |
| 15 | WhatsApp Business API integration |
| 16 | Platform admin dashboard |
| 16 | Launch preparation (seed data, testing, documentation) |

---

## 16. Moroccan Market Specifics

### 16.1 Event Types (Culturally Specific)

| Event Type | Moroccan Term | Season | Typical Guest Count | Avg Budget/Person |
|-----------|---------------|--------|--------------------|--------------------|
| Wedding | Mariage / 'Ars | June-Sep | 200-800 | 150-500 MAD |
| Diffa | Diffa | Year-round | 100-500 | 200-600 MAD |
| Engagement | Khtoba | Year-round | 50-200 | 100-300 MAD |
| Henna Night | Laylat al-Henna | Pre-wedding | 50-150 | 80-200 MAD |
| Ramadan Iftar | Iftar | Ramadan (1 month) | 50-1000 | 80-250 MAD |
| Eid Celebration | Aid | Post-Ramadan | 50-300 | 100-300 MAD |
| Corporate | Corporate | Sep-Jun | 30-200 | 150-400 MAD |
| Birthday | Anniversaire | Year-round | 20-100 | 80-200 MAD |
| Funeral | 3aza | Year-round | 50-300 | 50-100 MAD |
| Graduation | Takharruj | Jun-Jul | 30-150 | 100-250 MAD |

### 16.2 City Launch Priority

| Priority | City | Population | Why |
|----------|------|-----------|-----|
| 1 | Casablanca | 3.7M | Largest market, most corporate events, tech-savvy |
| 2 | Marrakech | 930K | Wedding destination, tourism events, high-end |
| 3 | Rabat | 580K | Government/corporate events, diplomatic catering |
| 4 | Fes | 1.1M | Traditional events, destination weddings |
| 5 | Tanger | 950K | Growing market, European-influenced events |
| 6 | Agadir | 420K | Tourism events, beach weddings |

### 16.3 Payment Methods in Practice

```
Morocco Payment Reality:
  - Cash deposit (hand-delivered)       ~40%
  - Bank transfer (virement)            ~25%
  - Cash on delivery (at event)         ~20%
  - Check                               ~10%
  - Card payment (CMI online)           ~5%

CaterQR Strategy:
  1. Track ALL payment methods (even offline ones)
  2. Let caterer mark "payment received" with method + reference
  3. CMI for online convenience, but never force it
  4. Send payment confirmations via WhatsApp
  5. Gentle nudges toward digital (receipts, tracking, safety)
```

### 16.4 Regulatory Compliance

- **TVA (20%):** Required for B2B invoices. Most individual catering is TVA-exempt.
- **Patente:** Business license required for caterers. Verification during onboarding.
- **ICE:** Identifiant Commun de l'Entreprise -- 15-digit tax ID for businesses.
- **RC:** Registre de Commerce -- business registration number.
- **Facture conforme:** Invoices must meet Moroccan legal requirements (ICE, RC, TVA number).
- **Data protection:** Morocco's Law 09-08 on personal data protection (CNDP).

---

## 17. Risk Assessment

### 17.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| CMI integration complexity | High | High | Start with WhatsApp-link payments, add CMI in Phase 4 |
| Real-time messaging scale | Medium | Medium | Supabase Realtime handles small-medium scale; Redis pub/sub for growth |
| PDF invoice generation | Low | Medium | Use @react-pdf/renderer (already works with React) |
| Offline sync conflicts | Medium | Medium | Last-write-wins for simple fields, manual resolution for complex |
| Multi-tenant data leakage | Low | Critical | RLS on every table, service-key-only cross-tenant queries, audit log |

### 17.2 Market Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Caterers resist digital tools | High | High | WhatsApp-first UX, minimal learning curve, immediate value (quote PDFs) |
| Low initial marketplace liquidity | High | Medium | SaaS-first strategy builds supply before marketplace |
| Existing WhatsApp workflows are "good enough" | Medium | High | Position as WhatsApp enhancement, not replacement |
| Wedding seasonality creates revenue volatility | High | Medium | Diversify event types (corporate, Ramadan, social) |
| Competition from global platforms | Low | Medium | Morocco-specific features (Darija, CMI, cultural events) are defensible |

### 17.3 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Caterers disintermediate (bypass platform for payments) | High | High | Focus on SaaS value (tools), not transaction fees |
| Low ARPU from freemium | Medium | Medium | Generous free tier builds adoption; Pro features drive upgrades |
| Regulatory changes | Low | Medium | Stay compliant, join industry associations |

---

## Appendix A: Technology Stack Detail

```
FRONTEND:
  Next.js 14 (App Router)          # SSR + SSG + Client
  React 18                         # UI framework
  Tailwind CSS                     # Styling
  shadcn/ui                        # Component library
  react-i18next                    # i18n (EN/FR/AR + RTL)
  lucide-react                     # Icons
  @react-pdf/renderer              # Invoice/quote PDFs
  react-big-calendar               # Calendar views
  zustand                          # Client state (cart -> event builder)
  recharts                         # Analytics charts

BACKEND:
  tRPC                             # Type-safe API layer
  Prisma ORM                       # Database access
  Supabase Auth                    # Authentication
  Supabase Storage                 # File storage (portfolio images, PDFs)
  Supabase Realtime                # Live messaging
  Supabase Edge Functions          # Webhooks, scheduled tasks

DATABASE:
  PostgreSQL (Supabase-hosted)     # Primary database
  Row-Level Security               # Multi-tenant isolation

PAYMENTS:
  CMI Gateway                      # Morocco's standard payment gateway
  Manual tracking                  # Cash, bank transfer, check

AI:
  OpenAI / Anthropic / Gemini      # Menu suggestions, quote generation, photo enhancement
  Existing FeastQR AI abstraction  # Multi-provider support

COMMUNICATIONS:
  WhatsApp Business API            # Primary notification channel
  Web Push (VAPID)                 # Browser notifications
  Resend / Postmark                # Email (invoices, quotes)
  SMS (Orange Morocco API)         # Urgent alerts (payment overdue)

DEPLOYMENT:
  Vercel                           # Hosting + edge functions
  Supabase (managed)               # Database + auth + storage
  Cloudflare R2                    # Image CDN (portfolio photos)

MONITORING:
  Existing FeastQR monitoring      # Health checks, error tracking
  Sentry                           # Error reporting
  PostHog                          # Product analytics
```

## Appendix B: Glossary (Moroccan Context)

| Term | Meaning |
|------|---------|
| Traiteur | Caterer (French) |
| Diffa | Traditional Moroccan feast/banquet |
| 'Ars | Wedding (Darija) |
| Khtoba | Engagement ceremony |
| Laylat al-Henna | Henna night (pre-wedding) |
| Iftar | Meal breaking the Ramadan fast |
| Aid / Eid | Islamic holiday celebration |
| 3aza | Funeral/mourning gathering |
| MAD | Moroccan Dirham (currency) |
| CMI | Centre Monetique Interbancaire (payment gateway) |
| ICE | Identifiant Commun de l'Entreprise (tax ID) |
| RC | Registre de Commerce (business registration) |
| TVA | Taxe sur la Valeur Ajoutee (VAT, 20%) |
| CNDP | Commission Nationale de controle de la protection des Donnees a caractere Personnel |
| Patente | Business operating license |
| Virement | Bank wire transfer |

---

## Sources

- [Morocco Hospitality Industry - Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/hospitality-industry-in-morocco)
- [Online Payments in Morocco 2025 - AzulWeb](https://azulweb.ma/en/accept-online-payments-morocco/)
- [CMI Morocco Payment Gateway - CartDNA](https://www.cartdna.com/shopify-payment-methods/cmi-morocco)
- [Top Payment Gateways in Morocco - NowPayments](https://nowpayments.io/blog/payment-gateway-morocco)
- [Best Catering Software 2026 - Software Advice](https://www.softwareadvice.com/catering/)
- [HoneyCart vs CaterZen Comparison](https://www.softwareadvice.com/catering/honeycart-profile/vs/restaurant-catering-systems/)
- [CaterTrax Features and Reviews](https://www.getapp.com/hospitality-travel-software/a/catertrax/)
- [Digital Transformation in Catering - Retain Technologies](https://retaintechnologies.com/en/digital-transformation-in-catering-companies/)
- [CMI Node.js Integration Package](https://github.com/aitmiloud/cmi-node)
- [Payment Platform Morocco - Void.ma](https://void.ma/en/secteurs/plateforme-paiement-maroc/)

---

*This architecture document is designed for a 12-16 week implementation cycle, targeting a Morocco launch in Q3 2026. The phased approach (SaaS-first, marketplace-later) reduces risk while building the supply side of the platform. All designs respect the fundamental constraints of the Moroccan market: COD-first payments, WhatsApp-native communication, Arabic RTL support, and culturally-specific event types.*
