-- ============================================================================
-- DIYAFA FOUNDATION MIGRATION
-- Multi-tenant catering platform: organizations, events, quotes, payments,
-- staff, equipment, messaging, reviews, invoices, timelines
-- ============================================================================
-- This builds on the existing 7 catering tables from 20260222000002:
--   catering_menus, catering_packages, catering_categories, catering_items,
--   catering_package_items, catering_inquiries, catering_themes
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE MULTI-TENANT TABLES
-- ============================================================================

-- ── 1.1 Organizations ──────────────────────────────────────────────────────
-- The central multi-tenant table. Every caterer, restaurant, hotel, venue,
-- or event planner is an organization.
CREATE TABLE IF NOT EXISTS public.organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(300) NOT NULL UNIQUE,
  type            VARCHAR(50) NOT NULL DEFAULT 'caterer',
    -- caterer, restaurant, hotel, venue, event_planner
  description     TEXT,
  bio             TEXT,
  logo_url        TEXT,
  cover_url       TEXT,

  -- Location
  city            VARCHAR(100),
  address         TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,

  -- Contact
  phone           VARCHAR(30),
  email           VARCHAR(200),
  whatsapp_number VARCHAR(30),
  website         VARCHAR(500),
  instagram       VARCHAR(100),
  facebook        VARCHAR(100),

  -- Business details
  cuisines        TEXT[] DEFAULT ARRAY[]::TEXT[],
  specialties     TEXT[] DEFAULT ARRAY[]::TEXT[],
  event_types     TEXT[] DEFAULT ARRAY[]::TEXT[],
  service_styles  TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages       TEXT[] DEFAULT ARRAY['ar', 'fr']::TEXT[],
  min_guests      INT DEFAULT 10,
  max_guests      INT DEFAULT 500,
  price_range     VARCHAR(30) DEFAULT 'mid_range',
    -- budget, mid_range, premium, luxury
  rating          DECIMAL(3,2) DEFAULT 0.00,
  review_count    INT DEFAULT 0,

  -- Business registration (Morocco)
  registre_commerce   VARCHAR(50),
  identifiant_fiscal  VARCHAR(50),
  patente_number      VARCHAR(50),

  -- Flags
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  is_featured     BOOLEAN NOT NULL DEFAULT false,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free',
    -- free, pro, business, enterprise

  -- Settings (flexible JSON for per-org config)
  settings        JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Stats (denormalized for performance)
  total_events_completed INT DEFAULT 0,
  avg_response_time_minutes INT,
  booking_rate    DECIMAL(5,2) DEFAULT 0.00,

  -- SEO
  meta_title      VARCHAR(200),
  meta_description VARCHAR(500),

  -- Timestamps
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 1.2 Organization Members ───────────────────────────────────────────────
-- Links users to organizations with roles. Supports invited workflow.
CREATE TABLE IF NOT EXISTS public.org_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            VARCHAR(30) NOT NULL DEFAULT 'staff',
    -- super_admin, org_owner, admin, manager, staff
  permissions     JSONB DEFAULT '{}'::JSONB,
  is_active       BOOLEAN NOT NULL DEFAULT true,

  -- Invited workflow
  invited_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at      TIMESTAMPTZ DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(org_id, user_id)
);


-- ============================================================================
-- SECTION 2: EVENT LIFECYCLE
-- ============================================================================

-- ── 2.1 Client Profiles ────────────────────────────────────────────────────
-- Client contact info and preferences. Clients can be anonymous (phone only)
-- or linked to auth.users for the marketplace phase.
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name            VARCHAR(200) NOT NULL,
  phone           VARCHAR(30) NOT NULL,
  email           VARCHAR(200),
  city            VARCHAR(100),
  address         TEXT,
  preferred_language VARCHAR(10) DEFAULT 'fr',
  notes           TEXT,

  -- Stats
  total_events    INT DEFAULT 0,
  total_spent     INT DEFAULT 0,         -- centimes
  last_event_date DATE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 2.2 Events ─────────────────────────────────────────────────────────────
-- The core entity. 12-state lifecycle from inquiry to settlement.
-- Events replace catering_inquiries as the primary booking entity for Diyafa.
CREATE TABLE IF NOT EXISTS public.events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES public.client_profiles(id) ON DELETE SET NULL,

  -- Event status (12-state lifecycle)
  status          VARCHAR(30) NOT NULL DEFAULT 'inquiry',
    -- inquiry, quote_sent, quote_revised, quote_accepted,
    -- deposit_pending, deposit_received, confirmed,
    -- in_preparation, in_execution, completed,
    -- settlement_pending, settled
    -- Terminal: cancelled

  -- Event type
  event_type      VARCHAR(50) NOT NULL DEFAULT 'general',
    -- wedding, corporate, ramadan_iftar, eid, birthday, conference,
    -- funeral, engagement, henna, diffa, graduation, other

  -- Event details
  title           VARCHAR(300),
  event_date      DATE NOT NULL,
  event_end_date  DATE,                  -- for multi-day events
  event_time      TIME,
  event_end_time  TIME,
  is_multi_day    BOOLEAN DEFAULT false,
  guest_count     INT NOT NULL DEFAULT 50,

  -- Venue
  venue_name      VARCHAR(200),
  venue_address   TEXT,
  venue_city      VARCHAR(100),
  venue_lat       DOUBLE PRECISION,
  venue_lng       DOUBLE PRECISION,

  -- Customer info (denormalized for quick access)
  customer_name   VARCHAR(200) NOT NULL,
  customer_phone  VARCHAR(30) NOT NULL,
  customer_email  VARCHAR(200),

  -- Service preferences
  service_style   VARCHAR(50),
    -- buffet, plated, cocktail, boxed, live_station, family_style
  dietary_requirements TEXT,
  special_requests TEXT,

  -- Financial
  total_amount    INT DEFAULT 0,         -- centimes (final agreed amount)
  deposit_amount  INT DEFAULT 0,         -- centimes
  balance_due     INT DEFAULT 0,         -- centimes
  currency        VARCHAR(10) DEFAULT 'MAD',

  -- Budget range (from inquiry)
  budget_min      INT,                   -- centimes per person
  budget_max      INT,                   -- centimes per person

  -- Source tracking
  source          VARCHAR(50) DEFAULT 'direct',
    -- direct, marketplace, referral, whatsapp, phone, qr_code

  -- Menu/Package selection
  catering_menu_id UUID REFERENCES public.catering_menus(id) ON DELETE SET NULL,
  package_id      UUID REFERENCES public.catering_packages(id) ON DELETE SET NULL,
  selected_items  JSONB DEFAULT '[]'::JSONB,

  -- Notes
  client_notes    TEXT,
  internal_notes  TEXT,
  admin_notes     TEXT,

  -- Cancellation
  cancelled_at    TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Activity tracking
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- SECTION 3: QUOTES (VERSIONED)
-- ============================================================================

-- ── 3.1 Quotes ─────────────────────────────────────────────────────────────
-- Multiple versioned quotes per event. Supports negotiation workflow.
CREATE TABLE IF NOT EXISTS public.quotes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  version         INT NOT NULL DEFAULT 1,
  status          VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- draft, sent, revised, accepted, rejected, expired

  -- Pricing
  items           JSONB NOT NULL DEFAULT '[]'::JSONB,
    -- Flexible structure: [{section, items: [{name, desc, qty, unitType, unitPrice, subtotal}]}]
  subtotal        INT NOT NULL DEFAULT 0,        -- centimes
  tax_rate        DECIMAL(5,2) DEFAULT 0,        -- 20% for B2B (TVA)
  tax_amount      INT DEFAULT 0,                 -- centimes
  seasonal_adjustment INT DEFAULT 0,             -- centimes (premium/discount)
  volume_discount INT DEFAULT 0,                 -- centimes
  additional_charges INT DEFAULT 0,              -- centimes
  total           INT NOT NULL DEFAULT 0,        -- centimes
  per_head_price  INT,                           -- centimes (total / guest_count)

  -- Terms
  valid_until     DATE,
  cancellation_policy TEXT,
  terms_and_conditions TEXT,
  notes           TEXT,

  -- PDF
  pdf_url         TEXT,

  -- Timestamps
  sent_at         TIMESTAMPTZ,
  viewed_at       TIMESTAMPTZ,
  responded_at    TIMESTAMPTZ,
  expired_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- SECTION 4: PAYMENTS
-- ============================================================================

-- ── 4.1 Payment Milestones ─────────────────────────────────────────────────
-- Milestone-based payments: deposit, progress, final.
-- Linked directly to events (no intermediate schedule table for simplicity).
CREATE TABLE IF NOT EXISTS public.payment_milestones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Milestone info
  label           VARCHAR(100) NOT NULL,
    -- e.g., "Deposit (30%)", "Pre-event (50%)", "Final (20%)"
  milestone_type  VARCHAR(30) NOT NULL DEFAULT 'deposit',
    -- deposit, progress, final, full
  percentage      DECIMAL(5,2) NOT NULL,
  amount          INT NOT NULL,                  -- centimes
  due_date        DATE NOT NULL,

  -- Status
  status          VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- pending, paid, overdue, cancelled, waived

  -- Payment details
  payment_method  VARCHAR(30),
    -- cod, bank_transfer, cmi, check, mobile_money
  payment_reference VARCHAR(200),
  receipt_url     TEXT,
  notes           TEXT,

  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- SECTION 5: CATERING MENUS (ORG-SCOPED)
-- ============================================================================

-- ── 5.1 Org Catering Menus ─────────────────────────────────────────────────
-- Organization-scoped catering menus. Bridges the existing catering_menus
-- (user_id based) to the new org-based system.
-- The existing catering_menus table remains; this adds org_id linkage.
ALTER TABLE public.catering_menus
  ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add menu_type column for pricing model classification
ALTER TABLE public.catering_menus
  ADD COLUMN IF NOT EXISTS menu_type VARCHAR(30) DEFAULT 'per_head';
    -- per_head, per_dish, package, custom


-- ── 5.2 Catering Menu Items (already exist, add org convenience) ───────────
-- We do NOT alter catering_items since they chain through categories.
-- The org_id is derivable via: item -> category -> catering_menu -> org_id.


-- ============================================================================
-- SECTION 6: STAFF ASSIGNMENTS
-- ============================================================================

-- ── 6.1 Staff Assignments ──────────────────────────────────────────────────
-- Maps org members or external staff to events with specific roles.
CREATE TABLE IF NOT EXISTS public.staff_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Staff details (denormalized for external/non-user staff)
  staff_name      VARCHAR(200) NOT NULL,
  staff_phone     VARCHAR(30),
  staff_role      VARCHAR(50) NOT NULL DEFAULT 'server',
    -- chef, sous_chef, cook, server, bartender, setup_crew,
    -- coordinator, driver, manager, cleaner

  -- Shift
  shift_start     TIME,
  shift_end       TIME,
  tasks           TEXT[],

  -- Status
  status          VARCHAR(30) NOT NULL DEFAULT 'assigned',
    -- assigned, confirmed, checked_in, checked_out, no_show

  -- Pay
  pay_rate        INT,                   -- centimes (hourly or daily)
  pay_type        VARCHAR(20) DEFAULT 'daily',
    -- hourly, daily, flat
  total_pay       INT DEFAULT 0,         -- centimes
  is_paid         BOOLEAN DEFAULT false,

  -- Time tracking
  checked_in_at   TIMESTAMPTZ,
  checked_out_at  TIMESTAMPTZ,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(event_id, staff_member_id)
);


-- ============================================================================
-- SECTION 7: EQUIPMENT
-- ============================================================================

-- ── 7.1 Equipment Inventory ────────────────────────────────────────────────
-- Organization-level equipment inventory.
CREATE TABLE IF NOT EXISTS public.equipment (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  category        VARCHAR(50) NOT NULL DEFAULT 'serving',
    -- serving, cooking, table, decoration, linen, transport, audio_visual
  total_quantity  INT NOT NULL DEFAULT 1,
  available_quantity INT NOT NULL DEFAULT 1,
  condition       VARCHAR(30) DEFAULT 'good',
    -- new, good, fair, needs_repair, retired
  cost_per_unit   INT,                   -- centimes (purchase price)
  rental_price    INT,                   -- centimes per day (if rented out)
  image_url       TEXT,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 7.2 Equipment Allocations ──────────────────────────────────────────────
-- Per-event equipment reservations and tracking.
CREATE TABLE IF NOT EXISTS public.equipment_allocations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_id    UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quantity        INT NOT NULL DEFAULT 1,

  -- Status
  status          VARCHAR(30) NOT NULL DEFAULT 'reserved',
    -- reserved, picked_up, in_use, returned, damaged, lost

  -- Tracking
  picked_up_at    TIMESTAMPTZ,
  returned_at     TIMESTAMPTZ,
  damage_notes    TEXT,
  damage_cost     INT,                   -- centimes

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- SECTION 8: COMMUNICATION
-- ============================================================================

-- ── 8.1 Event Messages ─────────────────────────────────────────────────────
-- In-app messaging between org and client, scoped per event.
CREATE TABLE IF NOT EXISTS public.event_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Sender info
  sender_role     VARCHAR(20) NOT NULL DEFAULT 'org',
    -- org, client, system
  sender_name     VARCHAR(200),

  -- Message content
  message_type    VARCHAR(20) NOT NULL DEFAULT 'text',
    -- text, image, file, quote_link, invoice_link, system
  content         TEXT NOT NULL,
  attachments     JSONB DEFAULT '[]'::JSONB,
    -- [{url, type, name, size}]

  -- Read tracking
  is_read         BOOLEAN DEFAULT false,
  read_at         TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- SECTION 9: REVIEWS
-- ============================================================================

-- ── 9.1 Event Reviews ──────────────────────────────────────────────────────
-- Multi-dimensional reviews for completed events.
CREATE TABLE IF NOT EXISTS public.event_reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        UUID REFERENCES public.events(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES public.client_profiles(id) ON DELETE SET NULL,

  -- Reviewer info
  reviewer_name   VARCHAR(200) NOT NULL,
  reviewer_phone  VARCHAR(30),
  event_type      VARCHAR(50),
  guest_count     INT,
  event_date      DATE,

  -- Multi-dimensional ratings (1-5)
  rating_overall      INT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_food         INT CHECK (rating_food BETWEEN 1 AND 5),
  rating_service      INT CHECK (rating_service BETWEEN 1 AND 5),
  rating_value        INT CHECK (rating_value BETWEEN 1 AND 5),
  rating_presentation INT CHECK (rating_presentation BETWEEN 1 AND 5),
  rating_punctuality  INT CHECK (rating_punctuality BETWEEN 1 AND 5),
  rating_communication INT CHECK (rating_communication BETWEEN 1 AND 5),

  -- Content
  comment         TEXT,
  photos          TEXT[],

  -- Org response
  response        TEXT,
  responded_at    TIMESTAMPTZ,

  -- Flags
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, published, rejected
  is_verified     BOOLEAN DEFAULT false,
  is_featured     BOOLEAN DEFAULT false,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- SECTION 10: INVOICES
-- ============================================================================

-- ── 10.1 Invoices ──────────────────────────────────────────────────────────
-- TVA-compliant invoices for Moroccan market. Auto-numbered.
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  invoice_number  VARCHAR(50) NOT NULL UNIQUE,
    -- Format: "DYF-2026-00001"

  -- Client details
  client_name     VARCHAR(200) NOT NULL,
  client_phone    VARCHAR(30),
  client_email    VARCHAR(200),
  client_address  TEXT,
  client_ice      VARCHAR(50),           -- Morocco ICE for corporate

  -- Org details (snapshot at invoice time)
  org_name        VARCHAR(200),
  org_ice         VARCHAR(50),
  org_rc          VARCHAR(50),           -- Registre de Commerce
  org_address     TEXT,

  -- Financial
  subtotal        INT NOT NULL,          -- centimes
  tva_rate        DECIMAL(5,2) DEFAULT 0,
  tva_amount      INT DEFAULT 0,         -- centimes
  total_amount    INT NOT NULL,          -- centimes
  amount_paid     INT DEFAULT 0,         -- centimes
  amount_due      INT NOT NULL,          -- centimes
  currency        VARCHAR(10) DEFAULT 'MAD',

  -- Status
  status          VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- draft, sent, paid, partial, overdue, cancelled
  issued_at       TIMESTAMPTZ,
  due_date        DATE,
  paid_at         TIMESTAMPTZ,

  -- PDF
  pdf_url         TEXT,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- SECTION 11: EVENT TIMELINE
-- ============================================================================

-- ── 11.1 Event Timeline ────────────────────────────────────────────────────
-- Prep schedule and execution timeline items per event.
CREATE TABLE IF NOT EXISTS public.event_timeline (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Task info
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  category        VARCHAR(50) NOT NULL DEFAULT 'prep',
    -- shopping, prep, cooking, assembly, packing, transport,
    -- setup, service, teardown, cleanup

  -- Scheduling
  start_time      TIMESTAMPTZ,
  end_time        TIMESTAMPTZ,
  duration_minutes INT,

  -- Assignment
  assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_name   VARCHAR(200),

  -- Dependencies
  depends_on      UUID[],                -- array of timeline item IDs

  -- Status
  status          VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- pending, in_progress, completed, skipped
  completed_at    TIMESTAMPTZ,

  sort_order      INT DEFAULT 0,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- SECTION 12: INDEXES
-- ============================================================================

-- ── Organizations ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_city ON public.organizations(city);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organizations_is_featured ON public.organizations(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_organizations_rating ON public.organizations(rating DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON public.organizations(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_organizations_cuisines ON public.organizations USING GIN(cuisines);
CREATE INDEX IF NOT EXISTS idx_organizations_event_types ON public.organizations USING GIN(event_types);

-- ── Org Members ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON public.org_members(org_id, role);

-- ── Client Profiles ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_client_profiles_org_id ON public.client_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_phone ON public.client_profiles(org_id, phone);
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON public.client_profiles(user_id) WHERE user_id IS NOT NULL;

-- ── Events ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(org_id, status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(org_id, event_date);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(org_id, event_type);
CREATE INDEX IF NOT EXISTS idx_events_client_id ON public.events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_customer_phone ON public.events(customer_phone);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(org_id, created_at DESC);

-- ── Quotes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_quotes_org_id ON public.quotes(org_id);
CREATE INDEX IF NOT EXISTS idx_quotes_event_id ON public.quotes(event_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(org_id, status);

-- ── Payment Milestones ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payment_milestones_org_id ON public.payment_milestones(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_event_id ON public.payment_milestones(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_status ON public.payment_milestones(org_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_milestones_due_date ON public.payment_milestones(due_date)
  WHERE status IN ('pending', 'overdue');

-- ── Catering Menus (org_id addition) ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_catering_menus_org_id ON public.catering_menus(org_id) WHERE org_id IS NOT NULL;

-- ── Staff Assignments ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_staff_assignments_org_id ON public.staff_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_event_id ON public.staff_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_staff_id ON public.staff_assignments(staff_member_id)
  WHERE staff_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_assignments_status ON public.staff_assignments(org_id, status);

-- ── Equipment ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_equipment_org_id ON public.equipment(org_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(org_id, category);

-- ── Equipment Allocations ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_equipment_allocations_org_id ON public.equipment_allocations(org_id);
CREATE INDEX IF NOT EXISTS idx_equipment_allocations_event_id ON public.equipment_allocations(event_id);
CREATE INDEX IF NOT EXISTS idx_equipment_allocations_equipment_id ON public.equipment_allocations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_allocations_status ON public.equipment_allocations(org_id, status);

-- ── Event Messages ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_messages_org_id ON public.event_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON public.event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_created ON public.event_messages(event_id, created_at DESC);

-- ── Event Reviews ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_reviews_org_id ON public.event_reviews(org_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_event_id ON public.event_reviews(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reviews_rating ON public.event_reviews(org_id, rating_overall DESC);
CREATE INDEX IF NOT EXISTS idx_event_reviews_status ON public.event_reviews(status)
  WHERE status = 'published';

-- ── Invoices ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_event_id ON public.invoices(event_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(org_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date)
  WHERE status IN ('sent', 'partial', 'overdue');
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);

-- ── Event Timeline ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_timeline_org_id ON public.event_timeline(org_id);
CREATE INDEX IF NOT EXISTS idx_event_timeline_event_id ON public.event_timeline(event_id);
CREATE INDEX IF NOT EXISTS idx_event_timeline_status ON public.event_timeline(event_id, status);
CREATE INDEX IF NOT EXISTS idx_event_timeline_assigned ON public.event_timeline(assigned_to)
  WHERE assigned_to IS NOT NULL;


-- ============================================================================
-- SECTION 13: ROW-LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_timeline ENABLE ROW LEVEL SECURITY;

-- ── Service Role Bypass (tRPC uses service key) ────────────────────────────
-- All tables: service_role has full access
CREATE POLICY "service_role_all_organizations" ON public.organizations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_org_members" ON public.org_members
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_client_profiles" ON public.client_profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_events" ON public.events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_quotes" ON public.quotes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_payment_milestones" ON public.payment_milestones
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_staff_assignments" ON public.staff_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_equipment" ON public.equipment
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_equipment_allocations" ON public.equipment_allocations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_event_messages" ON public.event_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_event_reviews" ON public.event_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_invoices" ON public.invoices
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_event_timeline" ON public.event_timeline
  FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ── Organizations ──────────────────────────────────────────────────────────

-- Public: anyone can read active organizations (marketplace discovery)
CREATE POLICY "organizations_public_read" ON public.organizations
  FOR SELECT TO anon
  USING (is_active = true);

-- Authenticated: members can read their own org
CREATE POLICY "organizations_member_read" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
    OR is_active = true
  );

-- Admin+: can update their org
CREATE POLICY "organizations_admin_write" ON public.organizations
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  );

-- Authenticated: can create an organization (becoming org_owner)
CREATE POLICY "organizations_create" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);


-- ── Org Members ────────────────────────────────────────────────────────────

-- Members can read their org's members
CREATE POLICY "org_members_read" ON public.org_members
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Admin+ can insert/update/delete members
CREATE POLICY "org_members_admin_write" ON public.org_members
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  );


-- ── Client Profiles ────────────────────────────────────────────────────────

-- Org members can read their org's clients
CREATE POLICY "client_profiles_org_read" ON public.client_profiles
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Org admins can write clients
CREATE POLICY "client_profiles_org_write" ON public.client_profiles
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  );

-- Clients can read their own profile
CREATE POLICY "client_profiles_self_read" ON public.client_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- ── Events ─────────────────────────────────────────────────────────────────

-- Org members can read their org's events
CREATE POLICY "events_org_read" ON public.events
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Org members (manager+) can write events
CREATE POLICY "events_org_write" ON public.events
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  );

-- Clients can read their own events (via client_profiles.user_id)
CREATE POLICY "events_client_read" ON public.events
  FOR SELECT TO authenticated
  USING (
    client_id IN (SELECT id FROM public.client_profiles WHERE user_id = auth.uid())
  );

-- Anonymous can create inquiries (public quote request form)
CREATE POLICY "events_public_insert" ON public.events
  FOR INSERT TO anon
  WITH CHECK (status = 'inquiry');


-- ── Quotes ─────────────────────────────────────────────────────────────────

-- Org members can read/write quotes
CREATE POLICY "quotes_org_read" ON public.quotes
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "quotes_org_write" ON public.quotes
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  );

-- Clients can read quotes for their events
CREATE POLICY "quotes_client_read" ON public.quotes
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.client_profiles cp ON e.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );


-- ── Payment Milestones ─────────────────────────────────────────────────────

-- Org members can read payment milestones
CREATE POLICY "payment_milestones_org_read" ON public.payment_milestones
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Org admins can write payment milestones
CREATE POLICY "payment_milestones_org_write" ON public.payment_milestones
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  );

-- Clients can read payment milestones for their events
CREATE POLICY "payment_milestones_client_read" ON public.payment_milestones
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.client_profiles cp ON e.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );


-- ── Staff Assignments ──────────────────────────────────────────────────────

-- Org members can read staff assignments
CREATE POLICY "staff_assignments_org_read" ON public.staff_assignments
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Org managers+ can write staff assignments
CREATE POLICY "staff_assignments_org_write" ON public.staff_assignments
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  );

-- Staff can read their own assignments
CREATE POLICY "staff_assignments_self_read" ON public.staff_assignments
  FOR SELECT TO authenticated
  USING (staff_member_id = auth.uid());


-- ── Equipment ──────────────────────────────────────────────────────────────

-- Org members can read equipment
CREATE POLICY "equipment_org_read" ON public.equipment
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Org admins can write equipment
CREATE POLICY "equipment_org_write" ON public.equipment
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  );


-- ── Equipment Allocations ──────────────────────────────────────────────────

-- Org members can read allocations
CREATE POLICY "equipment_allocations_org_read" ON public.equipment_allocations
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Org managers+ can write allocations
CREATE POLICY "equipment_allocations_org_write" ON public.equipment_allocations
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  );


-- ── Event Messages ─────────────────────────────────────────────────────────

-- Org members can read/write messages
CREATE POLICY "event_messages_org_read" ON public.event_messages
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "event_messages_org_write" ON public.event_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Clients can read messages for their events
CREATE POLICY "event_messages_client_read" ON public.event_messages
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.client_profiles cp ON e.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Clients can send messages for their events
CREATE POLICY "event_messages_client_write" ON public.event_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.client_profiles cp ON e.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );


-- ── Event Reviews ──────────────────────────────────────────────────────────

-- Public: anyone can read published reviews
CREATE POLICY "event_reviews_public_read" ON public.event_reviews
  FOR SELECT TO anon
  USING (status = 'published');

-- Authenticated: read published reviews or own org's reviews
CREATE POLICY "event_reviews_authenticated_read" ON public.event_reviews
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    OR org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Org admins can manage reviews (respond, feature, etc.)
CREATE POLICY "event_reviews_org_write" ON public.event_reviews
  FOR UPDATE TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  );

-- Anyone can submit a review (public form)
CREATE POLICY "event_reviews_public_insert" ON public.event_reviews
  FOR INSERT TO anon
  WITH CHECK (status = 'pending');

CREATE POLICY "event_reviews_authenticated_insert" ON public.event_reviews
  FOR INSERT TO authenticated
  WITH CHECK (true);


-- ── Invoices ───────────────────────────────────────────────────────────────

-- Org members can read invoices
CREATE POLICY "invoices_org_read" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Org admins can write invoices
CREATE POLICY "invoices_org_write" ON public.invoices
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin')
        AND is_active = true
    )
  );

-- Clients can read invoices for their events
CREATE POLICY "invoices_client_read" ON public.invoices
  FOR SELECT TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM public.events e
      JOIN public.client_profiles cp ON e.client_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );


-- ── Event Timeline ─────────────────────────────────────────────────────────

-- Org members can read timeline
CREATE POLICY "event_timeline_org_read" ON public.event_timeline
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- Org managers+ can write timeline
CREATE POLICY "event_timeline_org_write" ON public.event_timeline
  FOR ALL TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'org_owner', 'admin', 'manager')
        AND is_active = true
    )
  );

-- Staff can read timeline items assigned to them
CREATE POLICY "event_timeline_staff_read" ON public.event_timeline
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());


-- ============================================================================
-- SECTION 14: HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.diyafa_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_org_members
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_client_profiles
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_quotes
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_payment_milestones
  BEFORE UPDATE ON public.payment_milestones
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_staff_assignments
  BEFORE UPDATE ON public.staff_assignments
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_equipment
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_equipment_allocations
  BEFORE UPDATE ON public.equipment_allocations
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_event_reviews
  BEFORE UPDATE ON public.event_reviews
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();

CREATE TRIGGER set_updated_at_event_timeline
  BEFORE UPDATE ON public.event_timeline
  FOR EACH ROW EXECUTE FUNCTION public.diyafa_set_updated_at();


-- ============================================================================
-- END OF DIYAFA FOUNDATION MIGRATION
-- 13 new tables, 1 altered table, 50+ indexes, 40+ RLS policies,
-- 12 auto-update triggers
-- ============================================================================
