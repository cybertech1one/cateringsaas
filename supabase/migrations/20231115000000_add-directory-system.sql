-- ============================================================
-- Migration: Directory System for Moroccan Cities
-- Adds regions, cities, cuisine types tables and links menus
-- ============================================================

-- ── New Tables ──────────────────────────────────────────────

-- Moroccan regions
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Moroccan cities
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ar TEXT,
  description_fr TEXT,
  image_url TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  population INT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cuisine types
CREATE TABLE public.cuisine_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  name_fr TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Extend Menus Table ──────────────────────────────────────

ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id);
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS cuisine_type_id UUID REFERENCES public.cuisine_types(id);
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS price_range INT DEFAULT 2;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.menus ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX idx_menus_city_id ON public.menus(city_id);
CREATE INDEX idx_menus_cuisine_type_id ON public.menus(cuisine_type_id);
CREATE INDEX idx_menus_is_featured ON public.menus(is_featured) WHERE is_featured = true;
CREATE INDEX idx_menus_rating ON public.menus(rating DESC);
CREATE INDEX idx_menus_view_count ON public.menus(view_count DESC);
CREATE INDEX idx_cities_region_id ON public.cities(region_id);
CREATE INDEX idx_cities_is_featured ON public.cities(is_featured) WHERE is_featured = true;
CREATE INDEX idx_cities_slug ON public.cities(slug);
CREATE INDEX idx_regions_slug ON public.regions(slug);
CREATE INDEX idx_cuisine_types_slug ON public.cuisine_types(slug);

-- ── Seed: Regions ───────────────────────────────────────────

INSERT INTO public.regions (name, name_ar, name_fr, slug) VALUES
  ('Tanger-Tetouan-Al Hoceima',      'طنجة-تطوان-الحسيمة',           'Tanger-Tétouan-Al Hoceïma',       'tanger-tetouan-al-hoceima'),
  ('Oriental',                         'الشرق',                        'L''Oriental',                      'oriental'),
  ('Fes-Meknes',                       'فاس-مكناس',                    'Fès-Meknès',                      'fes-meknes'),
  ('Rabat-Sale-Kenitra',               'الرباط-سلا-القنيطرة',           'Rabat-Salé-Kénitra',              'rabat-sale-kenitra'),
  ('Beni Mellal-Khenifra',             'بني ملال-خنيفرة',              'Béni Mellal-Khénifra',            'beni-mellal-khenifra'),
  ('Casablanca-Settat',                'الدار البيضاء-سطات',            'Casablanca-Settat',               'casablanca-settat'),
  ('Marrakech-Safi',                   'مراكش-آسفي',                   'Marrakech-Safi',                  'marrakech-safi'),
  ('Draa-Tafilalet',                   'درعة-تافيلالت',                'Drâa-Tafilalet',                  'draa-tafilalet'),
  ('Souss-Massa',                      'سوس-ماسة',                     'Souss-Massa',                     'souss-massa'),
  ('Guelmim-Oued Noun',                'كلميم-واد نون',                'Guelmim-Oued Noun',               'guelmim-oued-noun'),
  ('Laayoune-Sakia El Hamra',          'العيون-الساقية الحمراء',         'Laâyoune-Sakia El Hamra',         'laayoune-sakia-el-hamra'),
  ('Dakhla-Oued Ed-Dahab',             'الداخلة-وادي الذهب',            'Dakhla-Oued Ed-Dahab',            'dakhla-oued-ed-dahab');

-- ── Seed: Cities ────────────────────────────────────────────

-- Casablanca-Settat region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'Casablanca', 'الدار البيضاء', 'Casablanca', 'casablanca', 33.5731104, -7.5898434, 3710000, true),
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'Mohammedia', 'المحمدية', 'Mohammedia', 'mohammedia', 33.6861000, -7.3828000, 290000, false),
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'El Jadida', 'الجديدة', 'El Jadida', 'el-jadida', 33.2316000, -8.5007000, 195000, false),
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'Settat', 'سطات', 'Settat', 'settat', 33.0011000, -7.6166000, 140000, false),
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'Berrechid', 'برشيد', 'Berrechid', 'berrechid', 33.2654000, -7.5876000, 130000, false),
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'Benslimane', 'بنسليمان', 'Benslimane', 'benslimane', 33.6148000, -7.1203000, 65000, false),
  ((SELECT id FROM public.regions WHERE slug = 'casablanca-settat'), 'Mediouna', 'مديونة', 'Médiouna', 'mediouna', 33.4500000, -7.5167000, 35000, false);

-- Rabat-Sale-Kenitra region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Rabat', 'الرباط', 'Rabat', 'rabat', 34.0209000, -6.8416000, 580000, true),
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Sale', 'سلا', 'Salé', 'sale', 34.0531000, -6.7985000, 980000, true),
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Kenitra', 'القنيطرة', 'Kénitra', 'kenitra', 34.2610000, -6.5802000, 430000, false),
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Temara', 'تمارة', 'Témara', 'temara', 33.9287000, -6.9070000, 350000, false),
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Skhirat', 'الصخيرات', 'Skhirat', 'skhirat', 33.8531000, -7.0328000, 75000, false),
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Sidi Slimane', 'سيدي سليمان', 'Sidi Slimane', 'sidi-slimane', 34.2267000, -5.9269000, 110000, false),
  ((SELECT id FROM public.regions WHERE slug = 'rabat-sale-kenitra'), 'Sidi Kacem', 'سيدي قاسم', 'Sidi Kacem', 'sidi-kacem', 34.2219000, -5.7098000, 75000, false);

-- Fes-Meknes region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'fes-meknes'), 'Fes', 'فاس', 'Fès', 'fes', 34.0331000, -5.0003000, 1110000, true),
  ((SELECT id FROM public.regions WHERE slug = 'fes-meknes'), 'Meknes', 'مكناس', 'Meknès', 'meknes', 33.8935000, -5.5547000, 600000, true),
  ((SELECT id FROM public.regions WHERE slug = 'fes-meknes'), 'Taza', 'تازة', 'Taza', 'taza', 34.2100000, -4.0100000, 150000, false),
  ((SELECT id FROM public.regions WHERE slug = 'fes-meknes'), 'Ifrane', 'إفران', 'Ifrane', 'ifrane', 33.5228000, -5.1108000, 75000, false),
  ((SELECT id FROM public.regions WHERE slug = 'fes-meknes'), 'Sefrou', 'صفرو', 'Sefrou', 'sefrou', 33.8305000, -4.8353000, 80000, false),
  ((SELECT id FROM public.regions WHERE slug = 'fes-meknes'), 'Moulay Yacoub', 'مولاي يعقوب', 'Moulay Yacoub', 'moulay-yacoub', 34.0867000, -5.1781000, 30000, false);

-- Marrakech-Safi region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'marrakech-safi'), 'Marrakech', 'مراكش', 'Marrakech', 'marrakech', 31.6295000, -7.9811000, 930000, true),
  ((SELECT id FROM public.regions WHERE slug = 'marrakech-safi'), 'Safi', 'آسفي', 'Safi', 'safi', 32.2994000, -9.2372000, 310000, false),
  ((SELECT id FROM public.regions WHERE slug = 'marrakech-safi'), 'Essaouira', 'الصويرة', 'Essaouira', 'essaouira', 31.5085000, -9.7595000, 80000, false),
  ((SELECT id FROM public.regions WHERE slug = 'marrakech-safi'), 'El Kelaa des Sraghna', 'قلعة السراغنة', 'El Kelâa des Sraghna', 'el-kelaa-des-sraghna', 32.0500000, -7.4000000, 80000, false),
  ((SELECT id FROM public.regions WHERE slug = 'marrakech-safi'), 'Youssoufia', 'اليوسفية', 'Youssoufia', 'youssoufia', 32.2461000, -8.5298000, 70000, false),
  ((SELECT id FROM public.regions WHERE slug = 'marrakech-safi'), 'Chichaoua', 'شيشاوة', 'Chichaoua', 'chichaoua', 31.5383000, -8.7628000, 40000, false);

-- Tanger-Tetouan-Al Hoceima region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Tangier', 'طنجة', 'Tanger', 'tangier', 35.7595000, -5.8340000, 950000, true),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Tetouan', 'تطوان', 'Tétouan', 'tetouan', 35.5785000, -5.3684000, 380000, false),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Al Hoceima', 'الحسيمة', 'Al Hoceïma', 'al-hoceima', 35.2517000, -3.9372000, 120000, false),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Larache', 'العرائش', 'Larache', 'larache', 35.1932000, -6.1506000, 125000, false),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Ksar El Kebir', 'القصر الكبير', 'Ksar El Kébir', 'ksar-el-kebir', 35.0000000, -5.9000000, 125000, false),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Chefchaouen', 'شفشاون', 'Chefchaouen', 'chefchaouen', 35.1688000, -5.2636000, 45000, false),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Fnideq', 'الفنيدق', 'Fnideq', 'fnideq', 35.8490000, -5.3570000, 80000, false),
  ((SELECT id FROM public.regions WHERE slug = 'tanger-tetouan-al-hoceima'), 'Mdiq', 'المضيق', 'M''diq', 'mdiq', 35.6850000, -5.3220000, 60000, false);

-- Oriental region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'oriental'), 'Oujda', 'وجدة', 'Oujda', 'oujda', 34.6814000, -1.9086000, 500000, true),
  ((SELECT id FROM public.regions WHERE slug = 'oriental'), 'Nador', 'الناظور', 'Nador', 'nador', 35.1681000, -2.9330000, 180000, false),
  ((SELECT id FROM public.regions WHERE slug = 'oriental'), 'Berkane', 'بركان', 'Berkane', 'berkane', 34.9200000, -2.3200000, 110000, false),
  ((SELECT id FROM public.regions WHERE slug = 'oriental'), 'Taourirt', 'تاوريرت', 'Taourirt', 'taourirt', 34.4106000, -2.8900000, 85000, false),
  ((SELECT id FROM public.regions WHERE slug = 'oriental'), 'Jerada', 'جرادة', 'Jerada', 'jerada', 34.3100000, -2.1600000, 45000, false);

-- Souss-Massa region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'souss-massa'), 'Agadir', 'أكادير', 'Agadir', 'agadir', 30.4278000, -9.5981000, 420000, true),
  ((SELECT id FROM public.regions WHERE slug = 'souss-massa'), 'Inezgane', 'إنزكان', 'Inezgane', 'inezgane', 30.3553000, -9.5375000, 130000, false),
  ((SELECT id FROM public.regions WHERE slug = 'souss-massa'), 'Ait Melloul', 'أيت ملول', 'Aït Melloul', 'ait-melloul', 30.3342000, -9.4972000, 170000, false),
  ((SELECT id FROM public.regions WHERE slug = 'souss-massa'), 'Tiznit', 'تيزنيت', 'Tiznit', 'tiznit', 29.6974000, -9.8022000, 75000, false),
  ((SELECT id FROM public.regions WHERE slug = 'souss-massa'), 'Taroudant', 'تارودانت', 'Taroudant', 'taroudant', 30.4700000, -8.8800000, 80000, false);

-- Beni Mellal-Khenifra region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'beni-mellal-khenifra'), 'Beni Mellal', 'بني ملال', 'Béni Mellal', 'beni-mellal', 32.3373000, -6.3498000, 190000, false),
  ((SELECT id FROM public.regions WHERE slug = 'beni-mellal-khenifra'), 'Khouribga', 'خريبكة', 'Khouribga', 'khouribga', 32.8811000, -6.9063000, 200000, false),
  ((SELECT id FROM public.regions WHERE slug = 'beni-mellal-khenifra'), 'Fquih Ben Salah', 'الفقيه بن صالح', 'Fquih Ben Salah', 'fquih-ben-salah', 32.5000000, -6.6833000, 100000, false),
  ((SELECT id FROM public.regions WHERE slug = 'beni-mellal-khenifra'), 'Khenifra', 'خنيفرة', 'Khénifra', 'khenifra', 32.9340000, -5.6670000, 120000, false),
  ((SELECT id FROM public.regions WHERE slug = 'beni-mellal-khenifra'), 'Azilal', 'أزيلال', 'Azilal', 'azilal', 31.9600000, -6.5700000, 30000, false);

-- Draa-Tafilalet region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'draa-tafilalet'), 'Errachidia', 'الراشيدية', 'Errachidia', 'errachidia', 31.9314000, -4.4288000, 100000, false),
  ((SELECT id FROM public.regions WHERE slug = 'draa-tafilalet'), 'Ouarzazate', 'ورزازات', 'Ouarzazate', 'ouarzazate', 30.9202000, -6.8935000, 70000, false),
  ((SELECT id FROM public.regions WHERE slug = 'draa-tafilalet'), 'Midelt', 'ميدلت', 'Midelt', 'midelt', 32.6800000, -4.7400000, 55000, false),
  ((SELECT id FROM public.regions WHERE slug = 'draa-tafilalet'), 'Tinghir', 'تنغير', 'Tinghir', 'tinghir', 31.5150000, -5.5328000, 45000, false),
  ((SELECT id FROM public.regions WHERE slug = 'draa-tafilalet'), 'Zagora', 'زاكورة', 'Zagora', 'zagora', 30.3283000, -5.8383000, 40000, false);

-- Guelmim-Oued Noun region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'guelmim-oued-noun'), 'Guelmim', 'كلميم', 'Guelmim', 'guelmim', 28.9833000, -10.0500000, 120000, false),
  ((SELECT id FROM public.regions WHERE slug = 'guelmim-oued-noun'), 'Tan-Tan', 'طانطان', 'Tan-Tan', 'tan-tan', 28.4378000, -11.1031000, 75000, false),
  ((SELECT id FROM public.regions WHERE slug = 'guelmim-oued-noun'), 'Sidi Ifni', 'سيدي إفني', 'Sidi Ifni', 'sidi-ifni', 29.3797000, -10.1728000, 25000, false);

-- Laayoune-Sakia El Hamra region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'laayoune-sakia-el-hamra'), 'Laayoune', 'العيون', 'Laâyoune', 'laayoune', 27.1536000, -13.2034000, 220000, false),
  ((SELECT id FROM public.regions WHERE slug = 'laayoune-sakia-el-hamra'), 'Boujdour', 'بوجدور', 'Boujdour', 'boujdour', 26.1267000, -14.4847000, 45000, false),
  ((SELECT id FROM public.regions WHERE slug = 'laayoune-sakia-el-hamra'), 'Tarfaya', 'طرفاية', 'Tarfaya', 'tarfaya', 27.9381000, -12.9264000, 10000, false),
  ((SELECT id FROM public.regions WHERE slug = 'laayoune-sakia-el-hamra'), 'Es-Semara', 'السمارة', 'Es-Semara', 'es-semara', 26.7417000, -11.6714000, 60000, false);

-- Dakhla-Oued Ed-Dahab region
INSERT INTO public.cities (region_id, name, name_ar, name_fr, slug, latitude, longitude, population, is_featured) VALUES
  ((SELECT id FROM public.regions WHERE slug = 'dakhla-oued-ed-dahab'), 'Dakhla', 'الداخلة', 'Dakhla', 'dakhla', 23.6848000, -15.9580000, 110000, false);

-- ── Seed: Cuisine Types ─────────────────────────────────────

INSERT INTO public.cuisine_types (name, name_ar, name_fr, slug, icon, description, sort_order) VALUES
  ('Moroccan Traditional', 'مغربي تقليدي', 'Marocain Traditionnel', 'moroccan-traditional', '🍲', 'Authentic Moroccan tagines, couscous, pastilla, and traditional dishes', 1),
  ('Street Food', 'أكل الشارع', 'Street Food', 'street-food', '🥙', 'Popular Moroccan street food including msemen, harira, and sfenj', 2),
  ('Seafood', 'مأكولات بحرية', 'Fruits de Mer', 'seafood', '🐟', 'Fresh seafood and fish specialties from Morocco''s coast', 3),
  ('International', 'عالمي', 'International', 'international', '🌍', 'International and fusion cuisine', 4),
  ('Cafe & Patisserie', 'مقهى وحلويات', 'Café & Pâtisserie', 'cafe-patisserie', '☕', 'Cafes, Moroccan pastries, and French-inspired patisserie', 5),
  ('Fast Food', 'وجبات سريعة', 'Restauration Rapide', 'fast-food', '🍔', 'Quick service restaurants and fast food chains', 6),
  ('Fine Dining', 'مطاعم راقية', 'Gastronomie', 'fine-dining', '🍽️', 'Upscale dining experiences and gourmet restaurants', 7),
  ('Pizza & Italian', 'بيتزا وإيطالي', 'Pizza & Italien', 'pizza-italian', '🍕', 'Pizza parlors and Italian restaurants', 8),
  ('Asian', 'آسيوي', 'Asiatique', 'asian', '🥢', 'Chinese, Japanese, Thai, and other Asian cuisines', 9),
  ('Grills & BBQ', 'مشويات', 'Grillades & BBQ', 'grills-bbq', '🥩', 'Grilled meats, brochettes, and barbecue specialties', 10),
  ('Healthy & Organic', 'صحي وعضوي', 'Sain & Bio', 'healthy-organic', '🥗', 'Health-focused restaurants with organic and wholesome options', 11),
  ('Bakery', 'مخبزة', 'Boulangerie', 'bakery', '🍞', 'Fresh bread, Moroccan khobz, and artisan bakeries', 12),
  ('Ice Cream & Desserts', 'مثلجات وحلويات', 'Glaces & Desserts', 'ice-cream-desserts', '🍦', 'Ice cream parlors, frozen yogurt, and dessert shops', 13),
  ('Juice & Smoothies', 'عصائر وسموذي', 'Jus & Smoothies', 'juice-smoothies', '🥤', 'Fresh juice bars and smoothie shops', 14),
  ('Sandwiches & Wraps', 'سندويشات ولفائف', 'Sandwichs & Wraps', 'sandwiches-wraps', '🥪', 'Sandwich shops, paninis, and wrap restaurants', 15);
