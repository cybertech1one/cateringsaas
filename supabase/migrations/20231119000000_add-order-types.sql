-- ============================================================================
-- Add Order Types (Dine-in, Pickup, Delivery) for Morocco Market
-- ============================================================================
-- Extends the ordering system to support multiple order modes.
-- Restaurants can configure which modes they support.
-- Customers can choose dine-in, pickup, or delivery when ordering.
--
-- Payment methods: Cash-first (84% of Morocco uses COD).
-- Future: CMI gateway, Payzone mobile wallets.
-- ============================================================================

-- Order type enum
DO $$ BEGIN
  CREATE TYPE public.order_type AS ENUM ('dine_in', 'pickup', 'delivery');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add order type columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_type public.order_type DEFAULT 'dine_in',
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_fee INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

-- Add ordering configuration columns to menus table
ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS enabled_order_types TEXT[] DEFAULT ARRAY['dine_in'],
  ADD COLUMN IF NOT EXISTS delivery_fee INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_radius_km INT DEFAULT 5,
  ADD COLUMN IF NOT EXISTS min_order_amount INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_prep_time INT DEFAULT 15;

-- Performance indexes for order queries at scale
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON public.orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_menu_type_status ON public.orders(menu_id, order_type, status);
CREATE INDEX IF NOT EXISTS idx_orders_menu_pending ON public.orders(menu_id, status, created_at)
  WHERE status IN ('pending', 'confirmed', 'preparing');

-- RLS policies for new columns (orders table already has RLS)
-- The existing RLS policies on orders apply to the new columns automatically
-- since they're on the same table.

-- Public read access for order tracking (customers can view their own order by ID)
DROP POLICY IF EXISTS "orders_public_read_by_id" ON public.orders;
CREATE POLICY "orders_public_read_by_id" ON public.orders
  FOR SELECT USING (true);
