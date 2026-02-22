-- Add inventory tracking columns to dishes table
ALTER TABLE public.dishes
  ADD COLUMN stock_quantity INT,
  ADD COLUMN low_stock_threshold INT DEFAULT 5,
  ADD COLUMN track_inventory BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.dishes.stock_quantity IS 'NULL means unlimited stock';
COMMENT ON COLUMN public.dishes.low_stock_threshold IS 'Threshold below which dish is considered low stock';
COMMENT ON COLUMN public.dishes.track_inventory IS 'Whether to track inventory for this dish';

-- Index for inventory queries (finding low/out-of-stock dishes)
CREATE INDEX idx_dishes_inventory
  ON public.dishes (menu_id, track_inventory, stock_quantity)
  WHERE track_inventory = true;
