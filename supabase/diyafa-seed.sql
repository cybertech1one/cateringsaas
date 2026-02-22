-- ============================================================================
-- DIYAFA SEED DATA
-- Moroccan catering platform test data
-- ============================================================================

-- ── Test User (same as FeastQR) ──────────────────────────────────────────
-- User: random@gmail.com (already created by auth seed)

-- ── Organization: Riad Al Baraka Catering ────────────────────────────────
INSERT INTO public.organizations (
  id, name, slug, type, description, bio, tagline,
  city, address, phone, email, whatsapp_number,
  website, instagram,
  cuisines, specialties, event_types, service_styles,
  languages, min_guests, max_guests, price_range,
  years_in_business, team_size, price_min, price_max,
  logo_url, is_verified, is_active, is_published, is_featured,
  subscription_tier, rating, review_count, total_events_completed,
  currency, meta_title, meta_description
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Riad Al Baraka Catering',
  'riad-al-baraka',
  'caterer',
  'Premier Moroccan catering service specializing in traditional weddings, corporate events, and Ramadan iftars. From intimate gatherings of 20 to grand celebrations of 500+ guests.',
  'Founded in 2018, Riad Al Baraka brings the authentic taste of Moroccan hospitality to every event. Our team of 25 experienced chefs and coordinators has served over 300 events across Casablanca and the greater region.',
  'L''art de la ضيافة — Where Every Guest is Royalty',
  'Casablanca', 'Quartier Maarif, Rue Mohamed V, Casablanca',
  '+212600123456', 'contact@riad-albaraka.ma', '+212600123456',
  'https://riad-albaraka.ma', '@riadalbaraka.ma',
  ARRAY['moroccan', 'mediterranean', 'fusion', 'international'],
  ARRAY['couscous', 'tajine', 'pastilla', 'mechoui', 'briouat'],
  ARRAY['wedding', 'corporate', 'ramadan_iftar', 'eid', 'engagement', 'henna'],
  ARRAY['buffet', 'plated', 'cocktail', 'live_station', 'family_style'],
  ARRAY['ar', 'fr', 'en'],
  20, 500, 'mid',
  8, 25, 15000, 80000,
  NULL, true, true, true, true,
  'pro', 4.80, 47, 312,
  'MAD',
  'Riad Al Baraka — Traiteur Mariage & Événements Casablanca',
  'Service traiteur premium à Casablanca. Mariage, corporate, iftar. Cuisine marocaine authentique, service impeccable.'
) ON CONFLICT (id) DO NOTHING;

-- ── Organization: Dar Ziyane Events ──────────────────────────────────────
INSERT INTO public.organizations (
  id, name, slug, type, description,
  city, address, phone, email, whatsapp_number,
  cuisines, specialties, event_types, service_styles,
  min_guests, max_guests, price_range,
  is_active, is_published, is_featured,
  subscription_tier, rating, review_count,
  currency
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Dar Ziyane Events',
  'dar-ziyane-events',
  'caterer',
  'Luxury catering and event design for Marrakech''s most exclusive celebrations. Specializing in rooftop weddings and Riad receptions.',
  'Marrakech', 'Médina, Derb Moulay Abdellah, Marrakech',
  '+212661234567', 'hello@darziyane.ma', '+212661234567',
  ARRAY['moroccan', 'french', 'middle_eastern'],
  ARRAY['diffa', 'pastilla', 'tagine', 'french_pastry'],
  ARRAY['wedding', 'engagement', 'henna', 'corporate'],
  ARRAY['plated', 'cocktail', 'live_station'],
  50, 300, 'premium',
  true, true, true,
  'pro', 4.90, 23,
  'MAD'
) ON CONFLICT (id) DO NOTHING;

-- ── Organization: CasaChef Corporate ─────────────────────────────────────
INSERT INTO public.organizations (
  id, name, slug, type, description,
  city, address, phone, email,
  cuisines, specialties, event_types,
  min_guests, max_guests, price_range,
  is_active, is_published,
  subscription_tier, rating, review_count,
  currency
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'CasaChef Corporate Catering',
  'casachef-corporate',
  'caterer',
  'Professional corporate catering for boardrooms, conferences, and company events across Casablanca and Rabat.',
  'Casablanca', 'Quartier Anfa, Casablanca',
  '+212522334455', 'info@casachef.ma',
  ARRAY['international', 'french', 'healthy'],
  ARRAY['box_lunch', 'coffee_break', 'standing_cocktail'],
  ARRAY['corporate', 'conference', 'graduation'],
  10, 200, 'mid',
  true, true,
  'free', 4.50, 12,
  'MAD'
) ON CONFLICT (id) DO NOTHING;

-- ── Org Members ──────────────────────────────────────────────────────────
-- Link test user to org 1 as owner
INSERT INTO public.org_members (
  id, org_id, user_id, role, is_active
) VALUES (
  '00000000-0000-0000-0000-100000000001',
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM auth.users LIMIT 1),
  'org_owner',
  true
) ON CONFLICT (org_id, user_id) DO NOTHING;

-- ── Client Profiles ──────────────────────────────────────────────────────
INSERT INTO public.client_profiles (id, org_id, name, phone, email, city, preferred_language, total_events_booked)
VALUES
  ('00000000-0000-0000-0000-200000000001', '00000000-0000-0000-0000-000000000001', 'Fatima Zahra El Idrissi', '+212661111111', 'fatima.z@gmail.com', 'Casablanca', 'fr', 3),
  ('00000000-0000-0000-0000-200000000002', '00000000-0000-0000-0000-000000000001', 'Ahmed Benali', '+212662222222', 'ahmed.benali@corp.ma', 'Casablanca', 'fr', 1),
  ('00000000-0000-0000-0000-200000000003', '00000000-0000-0000-0000-000000000001', 'Sarah Johnson', '+212663333333', 'sarah.j@email.com', 'Rabat', 'en', 2),
  ('00000000-0000-0000-0000-200000000004', '00000000-0000-0000-0000-000000000001', 'محمد الأمين', '+212664444444', NULL, 'Casablanca', 'ar', 1)
ON CONFLICT (id) DO NOTHING;

-- ── Events ───────────────────────────────────────────────────────────────
INSERT INTO public.events (
  id, org_id, client_id, status, event_type, title,
  event_date, guest_count, venue_name, venue_city,
  customer_name, customer_phone, customer_email,
  service_style, total_amount, deposit_amount, balance_due,
  source, currency
) VALUES
  -- Completed wedding
  ('00000000-0000-0000-0000-300000000001',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-200000000001',
   'completed', 'wedding',
   'Mariage El Idrissi - Benkirane',
   '2026-01-15', 250,
   'Salle des Fêtes Al Baraka', 'Casablanca',
   'Fatima Zahra El Idrissi', '+212661111111', 'fatima.z@gmail.com',
   'buffet', 37500000, 11250000, 0,
   'whatsapp', 'MAD'),

  -- Upcoming corporate event
  ('00000000-0000-0000-0000-300000000002',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-200000000002',
   'confirmed', 'corporate',
   'Annual Company Dinner - TechCorp',
   '2026-03-10', 80,
   'Hyatt Regency Casablanca', 'Casablanca',
   'Ahmed Benali', '+212662222222', 'ahmed.benali@corp.ma',
   'plated', 12000000, 6000000, 6000000,
   'direct', 'MAD'),

  -- Ramadan iftar inquiry
  ('00000000-0000-0000-0000-300000000003',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-200000000003',
   'inquiry', 'ramadan_iftar',
   'Community Iftar 2026',
   '2026-03-20', 150,
   NULL, 'Rabat',
   'Sarah Johnson', '+212663333333', 'sarah.j@email.com',
   'buffet', 0, 0, 0,
   'marketplace', 'MAD'),

  -- Engagement party in preparation
  ('00000000-0000-0000-0000-300000000004',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-200000000004',
   'in_preparation', 'engagement',
   'خطوبة محمد وسارة',
   '2026-03-05', 100,
   'Riad Dar Salam', 'Casablanca',
   'محمد الأمين', '+212664444444', NULL,
   'family_style', 15000000, 4500000, 10500000,
   'whatsapp', 'MAD')
ON CONFLICT (id) DO NOTHING;

-- ── Quotes ───────────────────────────────────────────────────────────────
INSERT INTO public.quotes (
  id, org_id, event_id, version, status,
  items, subtotal, tax_rate, tax_amount, total, per_head_price,
  valid_until, notes
) VALUES
  ('00000000-0000-0000-0000-400000000001',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-300000000001',
   1, 'accepted',
   '[{"section":"Food","items":[{"name":"Couscous Royal","qty":250,"unitType":"per_person","unitPrice":10000,"subtotal":2500000},{"name":"Pastilla","qty":250,"unitType":"per_person","unitPrice":5000,"subtotal":1250000},{"name":"Mechoui","qty":3,"unitType":"per_unit","unitPrice":500000,"subtotal":1500000}]},{"section":"Service","items":[{"name":"Staff (10 servers)","qty":10,"unitType":"flat","unitPrice":50000,"subtotal":500000}]}]'::JSONB,
   31250000, 20, 6250000, 37500000, 150000,
   '2026-01-01',
   'Menu traditionnel marocain complet avec service premium'),

  ('00000000-0000-0000-0000-400000000002',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-300000000002',
   1, 'accepted',
   '[{"section":"Food","items":[{"name":"3-Course Plated Dinner","qty":80,"unitType":"per_person","unitPrice":12000,"subtotal":960000}]},{"section":"Setup","items":[{"name":"Table decoration","qty":10,"unitType":"per_unit","unitPrice":20000,"subtotal":200000}]}]'::JSONB,
   10000000, 20, 2000000, 12000000, 150000,
   '2026-02-25',
   'Corporate dinner package with premium table settings')
ON CONFLICT (id) DO NOTHING;

-- ── Equipment ────────────────────────────────────────────────────────────
INSERT INTO public.equipment (id, org_id, name, category, total_quantity, available_quantity, condition, cost_per_unit)
VALUES
  ('00000000-0000-0000-0000-500000000001', '00000000-0000-0000-0000-000000000001', 'Chafing Dish (Large)', 'serving', 20, 15, 'good', 35000),
  ('00000000-0000-0000-0000-500000000002', '00000000-0000-0000-0000-000000000001', 'Round Table (10 seats)', 'table', 15, 12, 'good', 80000),
  ('00000000-0000-0000-0000-500000000003', '00000000-0000-0000-0000-000000000001', 'White Linen Tablecloth', 'linen', 50, 40, 'good', 5000),
  ('00000000-0000-0000-0000-500000000004', '00000000-0000-0000-0000-000000000001', 'Silver Serving Tray', 'serving', 30, 28, 'good', 15000),
  ('00000000-0000-0000-0000-500000000005', '00000000-0000-0000-0000-000000000001', 'Gold Chair Covers', 'decoration', 200, 180, 'good', 3000)
ON CONFLICT (id) DO NOTHING;

-- ── Reviews ──────────────────────────────────────────────────────────────
INSERT INTO public.reviews (
  id, org_id, event_id, reviewer_name, reviewer_phone,
  event_type, guest_count, event_date,
  rating_overall, rating_food_quality, rating_presentation,
  rating_service_staff, rating_punctuality, rating_value_for_money, rating_communication,
  comment, status, is_verified, is_published, is_featured
) VALUES
  ('00000000-0000-0000-0000-600000000001',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-300000000001',
   'Fatima Zahra El Idrissi', '+212661111111',
   'wedding', 250, '2026-01-15',
   5, 5, 5, 5, 5, 4, 5,
   'Absolutely incredible! The food was divine, the presentation was breathtaking, and the team was so professional. Our 250 guests were amazed by the Moroccan feast. The pastilla and mechoui were the highlights. Merci infiniment!',
   'approved', true, true, true),

  ('00000000-0000-0000-0000-600000000002',
   '00000000-0000-0000-0000-000000000001',
   NULL,
   'Youssef Amrani', '+212665555555',
   'corporate', 60, '2025-12-15',
   4, 4, 5, 4, 4, 4, 3,
   'Service traiteur très professionnel pour notre événement corporate. La qualité des plats était excellente. Petit bémol sur la communication avant l''événement.',
   'approved', false, true, false)
ON CONFLICT (id) DO NOTHING;

-- ── Catering Menus ───────────────────────────────────────────────────────
INSERT INTO public.catering_menus (
  id, user_id, org_id, name, description, menu_type
) VALUES
  ('00000000-0000-0000-0000-700000000001',
   (SELECT id FROM auth.users LIMIT 1),
   '00000000-0000-0000-0000-000000000001',
   'Menu Royal Marocain',
   'Notre menu signature avec les meilleurs plats traditionnels marocains',
   'per_head'),
  ('00000000-0000-0000-0000-700000000002',
   (SELECT id FROM auth.users LIMIT 1),
   '00000000-0000-0000-0000-000000000001',
   'Menu Corporate International',
   'Menu professionnel adapté aux événements d''entreprise',
   'per_head'),
  ('00000000-0000-0000-0000-700000000003',
   (SELECT id FROM auth.users LIMIT 1),
   '00000000-0000-0000-0000-000000000001',
   'Iftar Ramadan Traditionnel',
   'Menu complet pour iftar avec harira, dates, et plats traditionnels',
   'package')
ON CONFLICT (id) DO NOTHING;

-- ── Blocked Dates (holidays) ─────────────────────────────────────────────
INSERT INTO public.blocked_dates (org_id, date, reason, is_recurring)
VALUES
  ('00000000-0000-0000-0000-000000000001', '2026-01-01', 'New Year''s Day', true),
  ('00000000-0000-0000-0000-000000000001', '2026-01-11', 'Proclamation of Independence', false),
  ('00000000-0000-0000-0000-000000000001', '2026-05-01', 'Labour Day', true),
  ('00000000-0000-0000-0000-000000000001', '2026-07-30', 'Throne Day', true),
  ('00000000-0000-0000-0000-000000000001', '2026-11-06', 'Green March Day', true),
  ('00000000-0000-0000-0000-000000000001', '2026-11-18', 'Independence Day', true)
ON CONFLICT DO NOTHING;

-- ── Regions & Cities ─────────────────────────────────────────────────────
INSERT INTO public.regions (id, name, name_ar, name_fr, slug, sort_order)
VALUES
  ('00000000-0000-0000-0000-800000000001', 'Grand Casablanca-Settat', 'الدار البيضاء-سطات', 'Grand Casablanca-Settat', 'casablanca-settat', 1),
  ('00000000-0000-0000-0000-800000000002', 'Rabat-Salé-Kénitra', 'الرباط-سلا-القنيطرة', 'Rabat-Salé-Kénitra', 'rabat-sale-kenitra', 2),
  ('00000000-0000-0000-0000-800000000003', 'Marrakech-Safi', 'مراكش-آسفي', 'Marrakech-Safi', 'marrakech-safi', 3),
  ('00000000-0000-0000-0000-800000000004', 'Fès-Meknès', 'فاس-مكناس', 'Fès-Meknès', 'fes-meknes', 4),
  ('00000000-0000-0000-0000-800000000005', 'Tanger-Tétouan-Al Hoceïma', 'طنجة-تطوان-الحسيمة', 'Tanger-Tétouan-Al Hoceïma', 'tanger-tetouan', 5),
  ('00000000-0000-0000-0000-800000000006', 'Souss-Massa', 'سوس-ماسة', 'Souss-Massa', 'souss-massa', 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cities (id, region_id, name, name_ar, name_fr, slug, population, is_featured)
VALUES
  ('00000000-0000-0000-0000-900000000001', '00000000-0000-0000-0000-800000000001', 'Casablanca', 'الدار البيضاء', 'Casablanca', 'casablanca', 3752000, true),
  ('00000000-0000-0000-0000-900000000002', '00000000-0000-0000-0000-800000000001', 'Mohammedia', 'المحمدية', 'Mohammedia', 'mohammedia', 208000, false),
  ('00000000-0000-0000-0000-900000000003', '00000000-0000-0000-0000-800000000002', 'Rabat', 'الرباط', 'Rabat', 'rabat', 577827, true),
  ('00000000-0000-0000-0000-900000000004', '00000000-0000-0000-0000-800000000002', 'Salé', 'سلا', 'Salé', 'sale', 982000, false),
  ('00000000-0000-0000-0000-900000000005', '00000000-0000-0000-0000-800000000002', 'Kénitra', 'القنيطرة', 'Kénitra', 'kenitra', 431000, false),
  ('00000000-0000-0000-0000-900000000006', '00000000-0000-0000-0000-800000000003', 'Marrakech', 'مراكش', 'Marrakech', 'marrakech', 928850, true),
  ('00000000-0000-0000-0000-900000000007', '00000000-0000-0000-0000-800000000004', 'Fès', 'فاس', 'Fès', 'fes', 1150000, true),
  ('00000000-0000-0000-0000-900000000008', '00000000-0000-0000-0000-800000000004', 'Meknès', 'مكناس', 'Meknès', 'meknes', 632079, false),
  ('00000000-0000-0000-0000-900000000009', '00000000-0000-0000-0000-800000000005', 'Tanger', 'طنجة', 'Tanger', 'tanger', 947952, true),
  ('00000000-0000-0000-0000-900000000010', '00000000-0000-0000-0000-800000000006', 'Agadir', 'أكادير', 'Agadir', 'agadir', 600000, true)
ON CONFLICT (id) DO NOTHING;

-- ── Org Theme ────────────────────────────────────────────────────────────
INSERT INTO public.org_themes (
  org_id, primary_color, secondary_color, background_color,
  surface_color, text_color, accent_color,
  heading_font, body_font, layout_style
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '#B8860B', '#8B6914', '#FFFDF7',
  '#FFFFFF', '#1A1A1A', '#C2703E',
  'Cormorant', 'EB Garamond', 'elegant'
) ON CONFLICT (org_id) DO NOTHING;

-- ============================================================================
-- END OF DIYAFA SEED DATA
-- 3 orgs, 4 clients, 4 events, 2 quotes, 5 equipment items,
-- 2 reviews, 3 menus, 6 blocked dates, 6 regions, 10 cities, 1 theme
-- ============================================================================
