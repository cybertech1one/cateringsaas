-- ════════════════════════════════════════════════════════════════
-- CATERING SERVICES MODULE
-- Enables restaurants to offer catering packages for events
-- (weddings/diffa, corporate, Ramadan iftar, birthdays, etc.)
-- ════════════════════════════════════════════════════════════════

-- ── 1. Catering Menus ──────────────────────────────────────────
-- Top-level catering menu (separate from restaurant menus)
-- One restaurant can have multiple catering menus (e.g., Wedding, Corporate)
CREATE TABLE IF NOT EXISTS public.catering_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,  -- optional link to restaurant
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT,
  event_type VARCHAR(50) NOT NULL DEFAULT 'general',
    -- general, wedding, corporate, birthday, ramadan_iftar, eid, funeral, graduation, engagement
  min_guests INT NOT NULL DEFAULT 10,
  max_guests INT,
  base_price_per_person INT NOT NULL DEFAULT 0,  -- centimes (MAD)
  currency VARCHAR(10) NOT NULL DEFAULT 'MAD',
  city VARCHAR(100),
  service_area TEXT,  -- description of areas served
  lead_time_days INT NOT NULL DEFAULT 3,  -- minimum days advance booking
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  contact_phone VARCHAR(30),
  contact_email VARCHAR(200),
  whatsapp_number VARCHAR(30),

  -- Branding
  logo_url TEXT,
  cover_image_url TEXT,

  -- Service options (JSON for flexibility)
  service_options JSONB NOT NULL DEFAULT '{"delivery": true, "setup": true, "staffService": false, "equipmentRental": false, "cleanup": false}'::jsonb,

  -- SEO
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Catering Packages ───────────────────────────────────────
-- Pre-built bundles (e.g., "Gold Wedding Package", "Corporate Lunch")
CREATE TABLE IF NOT EXISTS public.catering_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catering_menu_id UUID NOT NULL REFERENCES public.catering_menus(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price_per_person INT NOT NULL DEFAULT 0,  -- centimes
  min_guests INT NOT NULL DEFAULT 10,
  max_guests INT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  image_url TEXT,
  includes_text TEXT,  -- human-readable summary, e.g. "3 appetizers + 2 mains + dessert + drinks"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Catering Categories ─────────────────────────────────────
-- e.g., "Appetizers", "Main Courses", "Desserts", "Beverages", "Live Stations"
CREATE TABLE IF NOT EXISTS public.catering_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catering_menu_id UUID NOT NULL REFERENCES public.catering_menus(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_optional BOOLEAN NOT NULL DEFAULT false,  -- optional add-on category
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Catering Items ──────────────────────────────────────────
-- Individual dishes/items available for catering
CREATE TABLE IF NOT EXISTS public.catering_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catering_category_id UUID NOT NULL REFERENCES public.catering_categories(id) ON DELETE CASCADE,
  catering_menu_id UUID NOT NULL REFERENCES public.catering_menus(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price_per_person INT,          -- per-person price (centimes), NULL if included in package
  price_per_unit INT,            -- flat price (centimes), for items like whole cakes
  unit_label VARCHAR(50),        -- e.g., "per platter", "per piece", "per kg"
  min_quantity INT DEFAULT 1,
  serves_count INT,              -- how many people one unit serves
  is_vegetarian BOOLEAN NOT NULL DEFAULT false,
  is_vegan BOOLEAN NOT NULL DEFAULT false,
  is_halal BOOLEAN NOT NULL DEFAULT true,
  is_gluten_free BOOLEAN NOT NULL DEFAULT false,
  allergens TEXT[],              -- array of allergen names
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. Package Items (many-to-many) ────────────────────────────
-- Links items to packages with quantity/selection rules
CREATE TABLE IF NOT EXISTS public.catering_package_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES public.catering_packages(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.catering_items(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.catering_categories(id) ON DELETE CASCADE,
  is_included BOOLEAN NOT NULL DEFAULT true,     -- included in package or add-on?
  max_selections INT,                            -- max items customer can pick from this category
  UNIQUE(package_id, item_id)
);

-- ── 6. Catering Inquiries / Bookings ───────────────────────────
-- Customer requests for catering quotes/bookings
CREATE TABLE IF NOT EXISTS public.catering_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catering_menu_id UUID NOT NULL REFERENCES public.catering_menus(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.catering_packages(id) ON DELETE SET NULL,

  -- Customer info
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  customer_email VARCHAR(200),

  -- Event details
  event_type VARCHAR(50) NOT NULL DEFAULT 'general',
  event_date DATE NOT NULL,
  event_time TIME,
  guest_count INT NOT NULL,
  venue_address TEXT,
  venue_city VARCHAR(100),

  -- Selections (JSON for flexibility)
  selected_items JSONB DEFAULT '[]'::jsonb,
  special_requests TEXT,
  dietary_notes TEXT,

  -- Pricing
  estimated_total INT,  -- centimes
  quoted_total INT,     -- restaurant's quote (centimes)
  deposit_amount INT,   -- required deposit (centimes)

  -- Status
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
    -- pending, reviewed, quoted, confirmed, deposit_paid, completed, cancelled
  admin_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. Catering Themes ─────────────────────────────────────────
-- Branding/design for public catering pages (separate from menu themes)
CREATE TABLE IF NOT EXISTS public.catering_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  catering_menu_id UUID NOT NULL UNIQUE REFERENCES public.catering_menus(id) ON DELETE CASCADE,
  primary_color VARCHAR(7) NOT NULL DEFAULT '#B8860B',
  secondary_color VARCHAR(7) NOT NULL DEFAULT '#8B6914',
  background_color VARCHAR(7) NOT NULL DEFAULT '#FFFDF7',
  surface_color VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
  text_color VARCHAR(7) NOT NULL DEFAULT '#1A1A1A',
  accent_color VARCHAR(7) NOT NULL DEFAULT '#C2703E',
  heading_font VARCHAR(100) NOT NULL DEFAULT 'Cormorant',
  body_font VARCHAR(100) NOT NULL DEFAULT 'EB Garamond',
  layout_style VARCHAR(30) NOT NULL DEFAULT 'elegant',
  card_style VARCHAR(30) NOT NULL DEFAULT 'elevated',
  border_radius VARCHAR(30) NOT NULL DEFAULT 'medium',
  header_style VARCHAR(30) NOT NULL DEFAULT 'banner',
  custom_css TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── Indexes ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_catering_menus_user_id ON public.catering_menus(user_id);
CREATE INDEX IF NOT EXISTS idx_catering_menus_slug ON public.catering_menus(slug);
CREATE INDEX IF NOT EXISTS idx_catering_menus_event_type ON public.catering_menus(event_type);
CREATE INDEX IF NOT EXISTS idx_catering_menus_city ON public.catering_menus(city);
CREATE INDEX IF NOT EXISTS idx_catering_menus_published ON public.catering_menus(is_published) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_catering_packages_menu_id ON public.catering_packages(catering_menu_id);
CREATE INDEX IF NOT EXISTS idx_catering_packages_sort ON public.catering_packages(catering_menu_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_catering_categories_menu_id ON public.catering_categories(catering_menu_id);
CREATE INDEX IF NOT EXISTS idx_catering_categories_sort ON public.catering_categories(catering_menu_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_catering_items_category_id ON public.catering_items(catering_category_id);
CREATE INDEX IF NOT EXISTS idx_catering_items_menu_id ON public.catering_items(catering_menu_id);
CREATE INDEX IF NOT EXISTS idx_catering_items_available ON public.catering_items(is_available) WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_catering_package_items_package ON public.catering_package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_catering_package_items_item ON public.catering_package_items(item_id);

CREATE INDEX IF NOT EXISTS idx_catering_inquiries_menu_id ON public.catering_inquiries(catering_menu_id);
CREATE INDEX IF NOT EXISTS idx_catering_inquiries_status ON public.catering_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_catering_inquiries_event_date ON public.catering_inquiries(event_date);
CREATE INDEX IF NOT EXISTS idx_catering_inquiries_phone ON public.catering_inquiries(customer_phone);

CREATE INDEX IF NOT EXISTS idx_catering_themes_menu_id ON public.catering_themes(catering_menu_id);


-- ── RLS Policies ───────────────────────────────────────────────

ALTER TABLE public.catering_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_themes ENABLE ROW LEVEL SECURITY;

-- Service role bypass (tRPC uses service key)
CREATE POLICY "service_role_all_catering_menus" ON public.catering_menus FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_catering_packages" ON public.catering_packages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_catering_categories" ON public.catering_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_catering_items" ON public.catering_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_catering_package_items" ON public.catering_package_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_catering_inquiries" ON public.catering_inquiries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_catering_themes" ON public.catering_themes FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Owner policies
CREATE POLICY "catering_menus_owner_all" ON public.catering_menus FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "catering_menus_public_read" ON public.catering_menus FOR SELECT TO anon
  USING (is_published = true);

-- Package/Category/Item policies via catering_menu ownership
CREATE POLICY "catering_packages_owner_all" ON public.catering_packages FOR ALL TO authenticated
  USING (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()))
  WITH CHECK (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()));
CREATE POLICY "catering_packages_public_read" ON public.catering_packages FOR SELECT TO anon
  USING (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE is_published = true));

CREATE POLICY "catering_categories_owner_all" ON public.catering_categories FOR ALL TO authenticated
  USING (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()))
  WITH CHECK (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()));
CREATE POLICY "catering_categories_public_read" ON public.catering_categories FOR SELECT TO anon
  USING (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE is_published = true));

CREATE POLICY "catering_items_owner_all" ON public.catering_items FOR ALL TO authenticated
  USING (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()))
  WITH CHECK (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()));
CREATE POLICY "catering_items_public_read" ON public.catering_items FOR SELECT TO anon
  USING (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE is_published = true));

CREATE POLICY "catering_package_items_owner_all" ON public.catering_package_items FOR ALL TO authenticated
  USING (package_id IN (SELECT cp.id FROM public.catering_packages cp JOIN public.catering_menus cm ON cp.catering_menu_id = cm.id WHERE cm.user_id = auth.uid()))
  WITH CHECK (package_id IN (SELECT cp.id FROM public.catering_packages cp JOIN public.catering_menus cm ON cp.catering_menu_id = cm.id WHERE cm.user_id = auth.uid()));
CREATE POLICY "catering_package_items_public_read" ON public.catering_package_items FOR SELECT TO anon
  USING (package_id IN (SELECT cp.id FROM public.catering_packages cp JOIN public.catering_menus cm ON cp.catering_menu_id = cm.id WHERE cm.is_published = true));

-- Inquiries: public can insert, owner can manage
CREATE POLICY "catering_inquiries_public_insert" ON public.catering_inquiries FOR INSERT TO anon
  WITH CHECK (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE is_published = true));
CREATE POLICY "catering_inquiries_owner_all" ON public.catering_inquiries FOR ALL TO authenticated
  USING (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()))
  WITH CHECK (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()));

-- Themes
CREATE POLICY "catering_themes_owner_all" ON public.catering_themes FOR ALL TO authenticated
  USING (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()))
  WITH CHECK (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE user_id = auth.uid()));
CREATE POLICY "catering_themes_public_read" ON public.catering_themes FOR SELECT TO anon
  USING (catering_menu_id IN (SELECT id FROM public.catering_menus WHERE is_published = true));
