-- ============================================================
-- Migration: Restaurant Directory System
-- Adds: regions, cities, cuisine_types tables
-- Modifies: menus table with directory columns
-- ============================================================

-- ── Ensure sort_order columns exist (may be missing from earlier migration) ──
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.cuisine_types ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.cuisine_types ADD COLUMN IF NOT EXISTS icon TEXT;

-- ── Regions (Moroccan administrative regions) ───────────────
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_regions_slug ON public.regions(slug);

-- ── Cities ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  slug TEXT NOT NULL UNIQUE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cities_region_id ON public.cities(region_id);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON public.cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_is_featured ON public.cities(is_featured);
CREATE INDEX IF NOT EXISTS idx_cities_population ON public.cities(population DESC);

-- ── Cuisine Types ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cuisine_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cuisine_types_slug ON public.cuisine_types(slug);

-- ── Add directory columns to menus ──────────────────────────
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS cuisine_type_id UUID REFERENCES public.cuisine_types(id) ON DELETE SET NULL;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS price_range INT DEFAULT 2 CHECK (price_range >= 1 AND price_range <= 4);
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_menus_city_id ON public.menus(city_id);
CREATE INDEX IF NOT EXISTS idx_menus_cuisine_type_id ON public.menus(cuisine_type_id);
CREATE INDEX IF NOT EXISTS idx_menus_is_featured ON public.menus(is_featured);
CREATE INDEX IF NOT EXISTS idx_menus_rating ON public.menus(rating DESC);
CREATE INDEX IF NOT EXISTS idx_menus_view_count ON public.menus(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_menus_is_published ON public.menus(is_published);

-- ── RLS for directory tables ────────────────────────────────
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuisine_types ENABLE ROW LEVEL SECURITY;

-- Regions: public read
DROP POLICY IF EXISTS "regions_public_read" ON public.regions;
CREATE POLICY "regions_public_read" ON public.regions
  FOR SELECT USING (true);

-- Cities: public read
DROP POLICY IF EXISTS "cities_public_read" ON public.cities;
CREATE POLICY "cities_public_read" ON public.cities
  FOR SELECT USING (true);

-- Cuisine Types: public read
DROP POLICY IF EXISTS "cuisine_types_public_read" ON public.cuisine_types;
CREATE POLICY "cuisine_types_public_read" ON public.cuisine_types
  FOR SELECT USING (true);

-- ── Seed: Moroccan Regions ──────────────────────────────────
INSERT INTO public.regions (name, name_ar, name_fr, slug, sort_order) VALUES
  ('Tanger-Tetouan-Al Hoceima', E'\u0637\u0646\u062C\u0629-\u062A\u0637\u0648\u0627\u0646-\u0627\u0644\u062D\u0633\u064A\u0645\u0629', 'Tanger-Tetouan-Al Hoceima', 'tanger-tetouan-al-hoceima', 1),
  ('Oriental', E'\u0627\u0644\u0634\u0631\u0642', 'Oriental', 'oriental', 2),
  ('Fes-Meknes', E'\u0641\u0627\u0633-\u0645\u0643\u0646\u0627\u0633', E'F\u00E8s-Mekn\u00E8s', 'fes-meknes', 3),
  ('Rabat-Sale-Kenitra', E'\u0627\u0644\u0631\u0628\u0627\u0637-\u0633\u0644\u0627-\u0627\u0644\u0642\u0646\u064A\u0637\u0631\u0629', E'Rabat-Sal\u00E9-K\u00E9nitra', 'rabat-sale-kenitra', 4),
  ('Beni Mellal-Khenifra', E'\u0628\u0646\u064A \u0645\u0644\u0627\u0644-\u062E\u0646\u064A\u0641\u0631\u0629', E'B\u00E9ni Mellal-Kh\u00E9nifra', 'beni-mellal-khenifra', 5),
  ('Casablanca-Settat', E'\u0627\u0644\u062F\u0627\u0631 \u0627\u0644\u0628\u064A\u0636\u0627\u0621-\u0633\u0637\u0627\u062A', 'Casablanca-Settat', 'casablanca-settat', 6),
  ('Marrakech-Safi', E'\u0645\u0631\u0627\u0643\u0634-\u0622\u0633\u0641\u064A', 'Marrakech-Safi', 'marrakech-safi', 7),
  ('Draa-Tafilalet', E'\u062F\u0631\u0639\u0629-\u062A\u0627\u0641\u064A\u0644\u0627\u0644\u062A', 'Draa-Tafilalet', 'draa-tafilalet', 8),
  ('Souss-Massa', E'\u0633\u0648\u0633-\u0645\u0627\u0633\u0629', 'Souss-Massa', 'souss-massa', 9),
  ('Guelmim-Oued Noun', E'\u0643\u0644\u0645\u064A\u0645-\u0648\u0627\u062F \u0646\u0648\u0646', 'Guelmim-Oued Noun', 'guelmim-oued-noun', 10),
  ('Laayoune-Sakia El Hamra', E'\u0627\u0644\u0639\u064A\u0648\u0646-\u0627\u0644\u0633\u0627\u0642\u064A\u0629 \u0627\u0644\u062D\u0645\u0631\u0627\u0621', 'Laayoune-Sakia El Hamra', 'laayoune-sakia-el-hamra', 11),
  ('Dakhla-Oued Ed Dahab', E'\u0627\u0644\u062F\u0627\u062E\u0644\u0629-\u0648\u0627\u062F \u0627\u0644\u0630\u0647\u0628', 'Dakhla-Oued Ed Dahab', 'dakhla-oued-ed-dahab', 12)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: Major Moroccan Cities ─────────────────────────────
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'Casablanca', E'\u0627\u0644\u062F\u0627\u0631 \u0627\u0644\u0628\u064A\u0636\u0627\u0621', 'Casablanca', 'casablanca', 33.5731, -7.5898, 3359818, true),
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Rabat', E'\u0627\u0644\u0631\u0628\u0627\u0637', 'Rabat', 'rabat', 34.0209, -6.8416, 577827, true),
  ((SELECT id FROM public.regions WHERE slug = 'marrakech-safi'), 'Marrakech', E'\u0645\u0631\u0627\u0643\u0634', 'Marrakech', 'marrakech', 31.6295, -7.9811, 928850, true),
  ((SELECT id FROM public.regions WHERE slug = 'fes-meknes'), 'Fes', E'\u0641\u0627\u0633', E'F\u00E8s', 'fes', 34.0181, -5.0078, 1112072, true),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Tangier', E'\u0637\u0646\u062C\u0629', 'Tanger', 'tangier', 35.7595, -5.8340, 947952, true),
  ((SELECT id FROM public.regions WHERE slug = 'souss-massa'), 'Agadir', E'\u0623\u06AF\u0627\u062F\u064A\u0631', 'Agadir', 'agadir', 30.4278, -9.5981, 421844, true),
  ((SELECT id FROM public.regions WHERE slug = 'fes-meknes'), 'Meknes', E'\u0645\u0643\u0646\u0627\u0633', E'Mekn\u00E8s', 'meknes', 33.8935, -5.5473, 632079, false),
  ((SELECT id FROM public.regions WHERE slug = 'oriental'), 'Oujda', E'\u0648\u062C\u062F\u0629', 'Oujda', 'oujda', 34.6867, -1.9114, 494252, false),
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Kenitra', E'\u0627\u0644\u0642\u0646\u064A\u0637\u0631\u0629', E'K\u00E9nitra', 'kenitra', 34.2610, -6.5802, 431282, false),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Tetouan', E'\u062A\u0637\u0648\u0627\u0646', E'T\u00E9touan', 'tetouan', 35.5889, -5.3626, 380787, false),
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Sale', E'\u0633\u0644\u0627', E'Sal\u00E9', 'sale', 34.0531, -6.7986, 890403, false),
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'Mohammedia', E'\u0627\u0644\u0645\u062D\u0645\u062F\u064A\u0629', E'Mohammedia', 'mohammedia', 33.6866, -7.3830, 208612, false),
  ((SELECT id FROM public.regions WHERE slug = 'marrakech-safi'), 'Safi', E'\u0622\u0633\u0641\u064A', 'Safi', 'safi', 32.2994, -9.2372, 308508, false),
  ((SELECT id FROM public.regions WHERE slug = 'marrakech-safi'), 'Essaouira', E'\u0627\u0644\u0635\u0648\u064A\u0631\u0629', 'Essaouira', 'essaouira', 31.5085, -9.7595, 77966, true),
  ((SELECT id FROM public.regions WHERE slug = 'draa-tafilalet'), 'Ouarzazate', E'\u0648\u0631\u0632\u0627\u0632\u0627\u062A', 'Ouarzazate', 'ouarzazate', 30.9189, -6.8934, 71067, false),
  ((SELECT id FROM public.regions WHERE slug = 'souss-massa'), 'Tiznit', E'\u062A\u0632\u0646\u064A\u062A', 'Tiznit', 'tiznit', 29.6974, -9.7316, 74699, false),
  ((SELECT id FROM public.regions WHERE slug = 'beni-mellal-khenifra'), 'Beni Mellal', E'\u0628\u0646\u064A \u0645\u0644\u0627\u0644', E'B\u00E9ni Mellal', 'beni-mellal', 32.3373, -6.3498, 192676, false),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Chefchaouen', E'\u0634\u0641\u0634\u0627\u0648\u0646', 'Chefchaouen', 'chefchaouen', 35.1688, -5.2636, 42786, true),
  ((SELECT id FROM public.regions WHERE slug = 'oriental'), 'Nador', E'\u0627\u0644\u0646\u0627\u0638\u0648\u0631', 'Nador', 'nador', 35.1740, -2.9287, 161726, false),
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'El Jadida', E'\u0627\u0644\u062C\u062F\u064A\u062F\u0629', 'El Jadida', 'el-jadida', 33.2316, -8.5007, 194934, false)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: Cuisine Types ─────────────────────────────────────
INSERT INTO public.cuisine_types (name, name_ar, name_fr, slug, icon, sort_order) VALUES
  ('Moroccan', E'\u0645\u063A\u0631\u0628\u064A', 'Marocaine', 'moroccan', 'utensils', 1),
  ('Mediterranean', E'\u0645\u062A\u0648\u0633\u0637\u064A', E'M\u00E9diterran\u00E9enne', 'mediterranean', 'sun', 2),
  ('Fast Food', E'\u0648\u062C\u0628\u0627\u062A \u0633\u0631\u064A\u0639\u0629', 'Fast Food', 'fast-food', 'hamburger', 3),
  ('Seafood', E'\u0645\u0623\u0643\u0648\u0644\u0627\u062A \u0628\u062D\u0631\u064A\u0629', 'Fruits de Mer', 'seafood', 'fish', 4),
  ('Pizza & Pasta', E'\u0628\u064A\u062A\u0632\u0627 \u0648\u0645\u0639\u0643\u0631\u0648\u0646\u0629', E'Pizza & P\u00E2tes', 'pizza-pasta', 'pizza-slice', 5),
  ('Grill & BBQ', E'\u0645\u0634\u0648\u064A\u0627\u062A', 'Grillade & BBQ', 'grill-bbq', 'fire', 6),
  ('Cafe & Bakery', E'\u0645\u0642\u0647\u0649 \u0648\u0645\u062E\u0628\u0632\u0629', E'Caf\u00E9 & Boulangerie', 'cafe-bakery', 'coffee', 7),
  ('Asian', E'\u0622\u0633\u064A\u0648\u064A', 'Asiatique', 'asian', 'bowl-rice', 8),
  ('Middle Eastern', E'\u0634\u0631\u0642 \u0623\u0648\u0633\u0637\u064A', 'Moyen-Oriental', 'middle-eastern', 'moon', 9),
  ('French', E'\u0641\u0631\u0646\u0633\u064A', E'Fran\u00E7aise', 'french', 'wine-glass', 10),
  ('Juice & Smoothies', E'\u0639\u0635\u0627\u0626\u0631 \u0648\u0633\u0645\u0648\u062B\u064A', 'Jus & Smoothies', 'juice-smoothies', 'blender', 11),
  ('Desserts & Pastry', E'\u062D\u0644\u0648\u064A\u0627\u062A', E'Desserts & P\u00E2tisserie', 'desserts-pastry', 'cake-candles', 12),
  ('Street Food', E'\u0623\u0643\u0644 \u0627\u0644\u0634\u0627\u0631\u0639', 'Street Food', 'street-food', 'store', 13),
  ('International', E'\u0639\u0627\u0644\u0645\u064A', 'Internationale', 'international', 'globe', 14)
ON CONFLICT (slug) DO NOTHING;
