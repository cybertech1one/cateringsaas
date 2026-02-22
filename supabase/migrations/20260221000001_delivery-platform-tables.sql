-- =============================================================================
-- Delivery Platform Tables
-- 6 tables: drivers, driver_documents, driver_availability,
--           restaurant_drivers, delivery_requests, driver_earnings
-- =============================================================================

-- ── 1. Drivers ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.drivers (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name     text NOT NULL,
  phone         text NOT NULL UNIQUE,
  email         text,
  city          text NOT NULL,
  vehicle_type  text NOT NULL DEFAULT 'bicycle',
  license_number text,
  id_number     text,
  profile_photo_url text,
  status        text NOT NULL DEFAULT 'pending',
  is_available  boolean NOT NULL DEFAULT false,
  rating        double precision NOT NULL DEFAULT 5.0,
  total_deliveries integer NOT NULL DEFAULT 0,
  total_earnings integer NOT NULL DEFAULT 0,
  current_lat   double precision,
  current_lng   double precision,
  last_location_update timestamptz,
  -- Extended fields for registration wizard
  emergency_contact_name text,
  emergency_contact_phone text,
  date_of_birth date,
  national_id_type text,
  national_id_expiry date,
  vehicle_plate text,
  vehicle_make  text,
  insurance_expiry date,
  background_check_status text DEFAULT 'pending',
  onboarding_step integer DEFAULT 0,
  onboarding_completed_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_phone ON public.drivers(phone);
CREATE INDEX IF NOT EXISTS idx_drivers_city ON public.drivers(city);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_is_available ON public.drivers(is_available);
CREATE INDEX IF NOT EXISTS idx_drivers_status_available ON public.drivers(status, is_available);

-- ── 2. Driver Documents ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.driver_documents (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id     uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url  text NOT NULL,
  status        text NOT NULL DEFAULT 'pending',
  reviewer_notes text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz,
  expires_at    date
);

CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON public.driver_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_documents_status ON public.driver_documents(status);

-- ── 3. Driver Availability ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.driver_availability (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id   uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_availability_driver_id ON public.driver_availability(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_availability_day ON public.driver_availability(day_of_week);

-- ── 4. Restaurant Drivers ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.restaurant_drivers (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_id     uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  driver_id   uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending',
  priority    integer DEFAULT 0,
  notes       text,
  applied_at  timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  UNIQUE(menu_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_drivers_menu_id ON public.restaurant_drivers(menu_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_drivers_driver_id ON public.restaurant_drivers(driver_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_drivers_status ON public.restaurant_drivers(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_drivers_menu_status ON public.restaurant_drivers(menu_id, status);

-- ── 5. Delivery Requests ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.delivery_requests (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_id           uuid NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  assigned_driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'pending',
  dropoff_address   text NOT NULL,
  dropoff_lat       double precision,
  dropoff_lng       double precision,
  pickup_lat        double precision,
  pickup_lng        double precision,
  estimated_distance double precision,
  estimated_duration integer,
  actual_duration   integer,
  delivery_fee      integer NOT NULL DEFAULT 0,
  driver_earning    integer NOT NULL DEFAULT 0,
  priority          integer NOT NULL DEFAULT 0,
  notes             text,
  rating            integer,
  rating_comment    text,
  picked_up_at      timestamptz,
  delivered_at      timestamptz,
  cancelled_at      timestamptz,
  failure_reason    text,
  payment_method    text DEFAULT 'cash',
  payment_status    text DEFAULT 'unpaid',
  tip_amount        integer DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_order_id ON public.delivery_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_menu_id ON public.delivery_requests(menu_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_driver_id ON public.delivery_requests(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON public.delivery_requests(status);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_menu_status ON public.delivery_requests(menu_id, status);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_created_at ON public.delivery_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_driver_status ON public.delivery_requests(assigned_driver_id, status);

-- ── 6. Driver Earnings ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.driver_earnings (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id           uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  delivery_request_id uuid REFERENCES public.delivery_requests(id) ON DELETE SET NULL,
  amount              integer NOT NULL DEFAULT 0,
  type                text NOT NULL DEFAULT 'delivery_fee',
  description         text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_id ON public.driver_earnings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_request_id ON public.driver_earnings(delivery_request_id);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_created_at ON public.driver_earnings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_earnings_driver_created ON public.driver_earnings(driver_id, created_at DESC);

-- ── RLS Policies ─────────────────────────────────────────────────────────────

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_earnings ENABLE ROW LEVEL SECURITY;

-- Drivers: public read for basic info, write for own profile
CREATE POLICY "drivers_select_all" ON public.drivers FOR SELECT USING (true);
CREATE POLICY "drivers_insert_anon" ON public.drivers FOR INSERT WITH CHECK (true);
CREATE POLICY "drivers_update_own" ON public.drivers FOR UPDATE USING (
  user_id = auth.uid() OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Driver Documents: driver can insert own, admin can read/update all
CREATE POLICY "driver_documents_select" ON public.driver_documents FOR SELECT USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);
CREATE POLICY "driver_documents_insert" ON public.driver_documents FOR INSERT WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "driver_documents_update" ON public.driver_documents FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);

-- Driver Availability: own access
CREATE POLICY "driver_availability_select" ON public.driver_availability FOR SELECT USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "driver_availability_insert" ON public.driver_availability FOR INSERT WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "driver_availability_update" ON public.driver_availability FOR UPDATE USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "driver_availability_delete" ON public.driver_availability FOR DELETE USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

-- Restaurant Drivers: menu owner or driver can read, driver can apply, owner can approve
CREATE POLICY "restaurant_drivers_select" ON public.restaurant_drivers FOR SELECT USING (
  menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "restaurant_drivers_insert" ON public.restaurant_drivers FOR INSERT WITH CHECK (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);
CREATE POLICY "restaurant_drivers_update" ON public.restaurant_drivers FOR UPDATE USING (
  menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
);

-- Delivery Requests: menu owner or assigned driver can read/update
CREATE POLICY "delivery_requests_select" ON public.delivery_requests FOR SELECT USING (
  menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  OR assigned_driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  OR order_id IN (SELECT id FROM public.orders) -- public read for order tracking
);
CREATE POLICY "delivery_requests_insert" ON public.delivery_requests FOR INSERT WITH CHECK (
  menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
);
CREATE POLICY "delivery_requests_update" ON public.delivery_requests FOR UPDATE USING (
  menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  OR assigned_driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
);

-- Driver Earnings: driver can read own, menu owner can read related
CREATE POLICY "driver_earnings_select" ON public.driver_earnings FOR SELECT USING (
  driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
  OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin'))
);
CREATE POLICY "driver_earnings_insert" ON public.driver_earnings FOR INSERT WITH CHECK (true);

-- Service role bypass for all tables (tRPC uses service key)
CREATE POLICY "drivers_service_all" ON public.drivers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "driver_documents_service_all" ON public.driver_documents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "driver_availability_service_all" ON public.driver_availability FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "restaurant_drivers_service_all" ON public.restaurant_drivers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "delivery_requests_service_all" ON public.delivery_requests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "driver_earnings_service_all" ON public.driver_earnings FOR ALL USING (auth.role() = 'service_role');
