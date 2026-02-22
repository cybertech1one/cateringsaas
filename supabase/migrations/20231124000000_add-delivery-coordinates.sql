-- Add restaurant coordinates for delivery zone calculations
ALTER TABLE public.menus
  ADD COLUMN IF NOT EXISTS restaurant_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS restaurant_lng DOUBLE PRECISION;

-- Index for menus with coordinates set (for directory/map queries)
CREATE INDEX IF NOT EXISTS idx_menus_coordinates
  ON public.menus (restaurant_lat, restaurant_lng)
  WHERE restaurant_lat IS NOT NULL AND restaurant_lng IS NOT NULL;
