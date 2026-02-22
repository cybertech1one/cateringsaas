-- Kitchen Stations: allow restaurants to split orders across multiple kitchen displays
-- (e.g., grill, bar, cold prep).

CREATE TABLE public.kitchen_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kitchen_stations_menu ON public.kitchen_stations(menu_id);

ALTER TABLE public.dishes ADD COLUMN kitchen_station_id UUID REFERENCES public.kitchen_stations(id) ON DELETE SET NULL;
CREATE INDEX idx_dishes_kitchen_station ON public.dishes(kitchen_station_id);

-- RLS
ALTER TABLE public.kitchen_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their kitchen stations" ON public.kitchen_stations
  FOR ALL USING (
    menu_id IN (SELECT id FROM public.menus WHERE user_id = auth.uid())
  );
