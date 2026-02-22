-- ============================================================
-- Migration: Multi-Location Restaurant Features
-- Adds: restaurants, locations, operating_hours, table_zones,
--        allergens, dish_allergens, menu_schedules, promotions,
--        reviews, analytics_events, audit_log
-- Plus: Comprehensive RLS policies for ALL tables
-- ============================================================

-- ── New Enums ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.day_of_week AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.allergen_type AS ENUM (
    'gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans',
    'dairy', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites',
    'lupin', 'molluscs'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.promotion_type AS ENUM ('daily_special', 'happy_hour', 'discount', 'combo', 'seasonal');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.schedule_type AS ENUM ('breakfast', 'brunch', 'lunch', 'afternoon', 'dinner', 'late_night', 'all_day');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── Restaurants ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  cuisine_type TEXT,
  is_chain BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON public.restaurants(user_id);

-- ── Locations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'Morocco',
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'Africa/Casablanca',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_restaurant_id ON public.locations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON public.locations(is_active);

-- ── Operating Hours ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.operating_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  day_of_week public.day_of_week NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operating_hours_location_id ON public.operating_hours(location_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_operating_hours_unique ON public.operating_hours(location_id, day_of_week);

-- ── Special Hours (holidays, events) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.special_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_special_hours_location_id ON public.special_hours(location_id);
CREATE INDEX IF NOT EXISTS idx_special_hours_date ON public.special_hours(date);

-- ── Table Zones (QR per table) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.table_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  zone_name TEXT,
  capacity INT DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_zones_location_id ON public.table_zones(location_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_zones_unique ON public.table_zones(location_id, table_number);

-- ── Allergens (standard + custom) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.allergens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT,
  type public.allergen_type,
  is_custom BOOLEAN DEFAULT false,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed standard allergens
INSERT INTO public.allergens (name, type, is_custom) VALUES
  ('Gluten', 'gluten', false),
  ('Crustaceans', 'crustaceans', false),
  ('Eggs', 'eggs', false),
  ('Fish', 'fish', false),
  ('Peanuts', 'peanuts', false),
  ('Soybeans', 'soybeans', false),
  ('Dairy', 'dairy', false),
  ('Tree Nuts', 'nuts', false),
  ('Celery', 'celery', false),
  ('Mustard', 'mustard', false),
  ('Sesame', 'sesame', false),
  ('Sulphites', 'sulphites', false),
  ('Lupin', 'lupin', false),
  ('Molluscs', 'molluscs', false)
ON CONFLICT DO NOTHING;

-- ── Dish Allergens (junction) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dish_allergens (
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES public.allergens(id) ON DELETE CASCADE,
  severity TEXT DEFAULT 'contains',
  PRIMARY KEY (dish_id, allergen_id)
);

CREATE INDEX IF NOT EXISTS idx_dish_allergens_dish_id ON public.dish_allergens(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_allergens_allergen_id ON public.dish_allergens(allergen_id);

-- ── Menu Schedules ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.menu_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  schedule_type public.schedule_type NOT NULL DEFAULT 'all_day',
  start_time TIME,
  end_time TIME,
  days public.day_of_week[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday']::public.day_of_week[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_schedules_menu_id ON public.menu_schedules(menu_id);

-- ── Promotions / Specials ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  promotion_type public.promotion_type NOT NULL DEFAULT 'daily_special',
  discount_percent INT,
  discount_amount INT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applicable_days public.day_of_week[],
  start_time TIME,
  end_time TIME,
  menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
  dish_id UUID REFERENCES public.dishes(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_id ON public.promotions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON public.promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status public.review_status DEFAULT 'pending',
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_menu_id ON public.reviews(menu_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);

-- ── Analytics Events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_menu_id ON public.analytics_events(menu_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);

-- ── Audit Log ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.app_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.app_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.app_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.app_audit_log(action);

-- ── Link menus to locations (optional) ───────────────────────
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_id ON public.menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menus_location_id ON public.menus(location_id);

-- ── Add sold_out to dishes ───────────────────────────────────
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS is_sold_out BOOLEAN DEFAULT false;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS prep_time_minutes INT;
ALTER TABLE public.dishes ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- ── Add sort_order to categories ─────────────────────────────
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;

-- ── Add orders link to location + table ──────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_zone_id UUID REFERENCES public.table_zones(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_location_id ON public.orders(location_id);

-- ── Customer favorites ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_favorites_menu_id ON public.customer_favorites(menu_id);
CREATE INDEX IF NOT EXISTS idx_favorites_dish_id ON public.customer_favorites(dish_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique ON public.customer_favorites(dish_id, session_id);

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ════════════════════════════════════════════════════════════

-- Enable RLS on ALL public tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables that may not have it
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes_translation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories_translation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ── Restaurants RLS ──────────────────────────────────────────
DROP POLICY IF EXISTS "restaurants_owner_all" ON public.restaurants;
CREATE POLICY "restaurants_owner_all" ON public.restaurants
  FOR ALL USING (user_id = auth.uid());

-- ── Locations RLS ────────────────────────────────────────────
DROP POLICY IF EXISTS "locations_owner_all" ON public.locations;
CREATE POLICY "locations_owner_all" ON public.locations
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

-- ── Operating Hours RLS ──────────────────────────────────────
DROP POLICY IF EXISTS "operating_hours_owner_all" ON public.operating_hours;
CREATE POLICY "operating_hours_owner_all" ON public.operating_hours
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM public.locations l
      JOIN public.restaurants r ON l.restaurant_id = r.id
      WHERE r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "operating_hours_public_read" ON public.operating_hours;
CREATE POLICY "operating_hours_public_read" ON public.operating_hours
  FOR SELECT USING (true);

-- ── Special Hours RLS ────────────────────────────────────────
DROP POLICY IF EXISTS "special_hours_owner_all" ON public.special_hours;
CREATE POLICY "special_hours_owner_all" ON public.special_hours
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM public.locations l
      JOIN public.restaurants r ON l.restaurant_id = r.id
      WHERE r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "special_hours_public_read" ON public.special_hours;
CREATE POLICY "special_hours_public_read" ON public.special_hours
  FOR SELECT USING (true);

-- ── Table Zones RLS ──────────────────────────────────────────
DROP POLICY IF EXISTS "table_zones_owner_all" ON public.table_zones;
CREATE POLICY "table_zones_owner_all" ON public.table_zones
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM public.locations l
      JOIN public.restaurants r ON l.restaurant_id = r.id
      WHERE r.user_id = auth.uid()
    )
  );

-- ── Allergens RLS (standard readable by all, custom by owner) ──
DROP POLICY IF EXISTS "allergens_public_read" ON public.allergens;
CREATE POLICY "allergens_public_read" ON public.allergens
  FOR SELECT USING (is_custom = false OR restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "allergens_owner_write" ON public.allergens;
CREATE POLICY "allergens_owner_write" ON public.allergens
  FOR ALL USING (is_custom = true AND restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));

-- ── Dish Allergens RLS ───────────────────────────────────────
DROP POLICY IF EXISTS "dish_allergens_public_read" ON public.dish_allergens;
CREATE POLICY "dish_allergens_public_read" ON public.dish_allergens
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "dish_allergens_owner_write" ON public.dish_allergens;
CREATE POLICY "dish_allergens_owner_write" ON public.dish_allergens
  FOR ALL USING (
    dish_id IN (SELECT d.id FROM public.dishes d JOIN public.menus m ON d.menu_id = m.id WHERE m.user_id = auth.uid())
  );

-- ── Menu Schedules RLS ───────────────────────────────────────
DROP POLICY IF EXISTS "menu_schedules_owner_all" ON public.menu_schedules;
CREATE POLICY "menu_schedules_owner_all" ON public.menu_schedules
  FOR ALL USING (
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "menu_schedules_public_read" ON public.menu_schedules;
CREATE POLICY "menu_schedules_public_read" ON public.menu_schedules
  FOR SELECT USING (true);

-- ── Promotions RLS ───────────────────────────────────────────
DROP POLICY IF EXISTS "promotions_owner_all" ON public.promotions;
CREATE POLICY "promotions_owner_all" ON public.promotions
  FOR ALL USING (
    restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "promotions_public_read" ON public.promotions;
CREATE POLICY "promotions_public_read" ON public.promotions
  FOR SELECT USING (is_active = true);

-- ── Reviews RLS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "reviews_public_insert" ON public.reviews;
CREATE POLICY "reviews_public_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_public_read_approved" ON public.reviews;
CREATE POLICY "reviews_public_read_approved" ON public.reviews
  FOR SELECT USING (
    status = 'approved' OR
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reviews_owner_manage" ON public.reviews;
CREATE POLICY "reviews_owner_manage" ON public.reviews
  FOR UPDATE USING (
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );

-- ── Analytics Events RLS ─────────────────────────────────────
DROP POLICY IF EXISTS "analytics_public_insert" ON public.analytics_events;
CREATE POLICY "analytics_public_insert" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_owner_read" ON public.analytics_events;
CREATE POLICY "analytics_owner_read" ON public.analytics_events
  FOR SELECT USING (
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );

-- ── Audit Log RLS ────────────────────────────────────────────
DROP POLICY IF EXISTS "audit_log_owner_read" ON public.app_audit_log;
CREATE POLICY "audit_log_owner_read" ON public.app_audit_log
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "audit_log_insert" ON public.app_audit_log;
CREATE POLICY "audit_log_insert" ON public.app_audit_log
  FOR INSERT WITH CHECK (true);

-- ── Customer Favorites RLS ───────────────────────────────────
DROP POLICY IF EXISTS "favorites_public_insert" ON public.customer_favorites;
CREATE POLICY "favorites_public_insert" ON public.customer_favorites
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "favorites_public_read" ON public.customer_favorites;
CREATE POLICY "favorites_public_read" ON public.customer_favorites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "favorites_public_delete" ON public.customer_favorites;
CREATE POLICY "favorites_public_delete" ON public.customer_favorites
  FOR DELETE USING (true);

-- ── Existing Tables RLS (menus) ──────────────────────────────
DROP POLICY IF EXISTS "menus_owner_all" ON public.menus;
CREATE POLICY "menus_owner_all" ON public.menus
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "menus_public_read" ON public.menus;
CREATE POLICY "menus_public_read" ON public.menus
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "menus_staff_read" ON public.menus;
CREATE POLICY "menus_staff_read" ON public.menus
  FOR SELECT USING (
    id IN (SELECT menu_id FROM public.staff_members WHERE user_id = auth.uid() AND is_active = true)
  );

-- ── Profiles RLS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (true);

-- ── Categories RLS ───────────────────────────────────────────
DROP POLICY IF EXISTS "categories_owner_all" ON public.categories;
CREATE POLICY "categories_owner_all" ON public.categories
  FOR ALL USING (
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories
  FOR SELECT USING (
    menu_id IN (SELECT id FROM public.menus WHERE is_published = true)
  );

-- ── Dishes RLS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "dishes_owner_all" ON public.dishes;
CREATE POLICY "dishes_owner_all" ON public.dishes
  FOR ALL USING (
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "dishes_public_read" ON public.dishes;
CREATE POLICY "dishes_public_read" ON public.dishes
  FOR SELECT USING (
    menu_id IN (SELECT id FROM public.menus WHERE is_published = true)
  );

-- ── Orders RLS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "orders_owner_all" ON public.orders;
CREATE POLICY "orders_owner_all" ON public.orders
  FOR ALL USING (
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
CREATE POLICY "orders_public_insert" ON public.orders
  FOR INSERT WITH CHECK (true);

-- ── Staff Members RLS ────────────────────────────────────────
DROP POLICY IF EXISTS "staff_owner_all" ON public.staff_members;
CREATE POLICY "staff_owner_all" ON public.staff_members
  FOR ALL USING (
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "staff_member_read" ON public.staff_members;
CREATE POLICY "staff_member_read" ON public.staff_members
  FOR SELECT USING (user_id = auth.uid());

-- ── AI Usage RLS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "ai_usage_own" ON public.ai_usage;
CREATE POLICY "ai_usage_own" ON public.ai_usage
  FOR ALL USING (user_id = auth.uid());

-- ── Subscriptions RLS ────────────────────────────────────────
DROP POLICY IF EXISTS "subscriptions_own" ON public.subscriptions;
CREATE POLICY "subscriptions_own" ON public.subscriptions
  FOR ALL USING (profile_id = auth.uid());

-- ── Menu Themes RLS ──────────────────────────────────────────
DROP POLICY IF EXISTS "themes_owner_all" ON public.menu_themes;
CREATE POLICY "themes_owner_all" ON public.menu_themes
  FOR ALL USING (
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "themes_public_read" ON public.menu_themes;
CREATE POLICY "themes_public_read" ON public.menu_themes
  FOR SELECT USING (
    menu_id IN (SELECT id FROM public.menus WHERE is_published = true)
  );

-- ── Updated_at triggers ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_table_zones_updated_at BEFORE UPDATE ON public.table_zones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null;
END $$;
