-- ============================================================================
-- DIYAFA PLATFORM SEED DATA
-- Moroccan catering platform test data
-- ============================================================================
-- Test user: random@gmail.com (password: testtest)
-- Organization: Traiteur Atlas Casablanca
-- Includes: org members, catering menus, events, quotes, payments, staff,
--           equipment, messages, reviews, invoices, timelines
-- ============================================================================

-- ── Auth User ──────────────────────────────────────────────────────────────
-- Primary test user (org owner)
INSERT INTO "auth"."users" (
  "instance_id", "id", "aud", "role", "email", "encrypted_password",
  "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at",
  "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change",
  "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data",
  "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at",
  "phone_change", "phone_change_token", "phone_change_sent_at",
  "email_change_token_current", "email_change_confirm_status", "banned_until",
  "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at"
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  'authenticated', 'authenticated', 'random@gmail.com',
  '$2a$10$ub8629WYCUaVFiEot0KDXu/Bi68BQc/Y4C2QSPDEPGfpS/f6J0p0S',
  '2023-10-22 21:37:14.25057+00', NULL, '', NULL, '', NULL, '', '', NULL,
  '2023-11-06 23:04:07.101986+00',
  '{"provider": "email", "providers": ["email"]}', '{}', NULL,
  '2023-10-22 21:37:14.240954+00', '2023-11-06 23:04:07.106022+00',
  NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL
);

-- Admin user
INSERT INTO "auth"."users" (
  "instance_id", "id", "aud", "role", "email", "encrypted_password",
  "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at",
  "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change",
  "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data",
  "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at",
  "phone_change", "phone_change_token", "phone_change_sent_at",
  "email_change_token_current", "email_change_confirm_status", "banned_until",
  "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at"
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'authenticated', 'authenticated', 'admin@diyafa.ma',
  '$2a$10$ub8629WYCUaVFiEot0KDXu/Bi68BQc/Y4C2QSPDEPGfpS/f6J0p0S',
  '2024-01-15 10:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL,
  '2024-01-15 10:00:00+00',
  '{"provider": "email", "providers": ["email"]}', '{}', NULL,
  '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00',
  NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL
);

-- Staff user
INSERT INTO "auth"."users" (
  "instance_id", "id", "aud", "role", "email", "encrypted_password",
  "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at",
  "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change",
  "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data",
  "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at",
  "phone_change", "phone_change_token", "phone_change_sent_at",
  "email_change_token_current", "email_change_confirm_status", "banned_until",
  "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at"
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'authenticated', 'authenticated', 'staff@diyafa.ma',
  '$2a$10$ub8629WYCUaVFiEot0KDXu/Bi68BQc/Y4C2QSPDEPGfpS/f6J0p0S',
  '2024-02-01 10:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL,
  '2024-02-01 10:00:00+00',
  '{"provider": "email", "providers": ["email"]}', '{}', NULL,
  '2024-02-01 10:00:00+00', '2024-02-01 10:00:00+00',
  NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL
);

-- Auth identities
INSERT INTO "auth"."identities" ("id", "user_id", "provider_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at") VALUES
  ('7042152a-7151-49f1-9bfd-3d8f156e7aef', '7042152a-7151-49f1-9bfd-3d8f156e7aef', '7042152a-7151-49f1-9bfd-3d8f156e7aef', '{"sub": "7042152a-7151-49f1-9bfd-3d8f156e7aef", "email": "random@gmail.com"}', 'email', '2023-10-22 21:37:14.249029+00', '2023-10-22 21:37:14.24905+00', '2023-10-22 21:37:14.24905+00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '{"sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "email": "admin@diyafa.ma"}', 'email', '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '{"sub": "b2c3d4e5-f6a7-8901-bcde-f12345678901", "email": "staff@diyafa.ma"}', 'email', '2024-02-01 10:00:00+00', '2024-02-01 10:00:00+00', '2024-02-01 10:00:00+00');


-- ── Profiles ───────────────────────────────────────────────────────────────
INSERT INTO "public"."profiles" ("id", "updated_at", "username", "full_name", "email") VALUES
  ('7042152a-7151-49f1-9bfd-3d8f156e7aef', NOW(), 'karim_atlas', 'Karim Benali', 'random@gmail.com'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW(), 'fatima_admin', 'Fatima Zahra', 'admin@diyafa.ma'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW(), 'youssef_staff', 'Youssef Amrani', 'staff@diyafa.ma');


-- ── Languages ──────────────────────────────────────────────────────────────
INSERT INTO "public"."languages" ("id", "name", "iso_code", "flag_url") VALUES
  ('56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'English', 'GB', 'https://flagsapi.com/GB/flat/64.png'),
  ('70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a', 'Arabic', 'MA', 'https://flagsapi.com/MA/flat/64.png'),
  ('ced37313-fc91-4c4d-a480-5d8081311a8e', 'French', 'FR', 'https://flagsapi.com/FR/flat/64.png')
ON CONFLICT (id) DO NOTHING;


-- ── Organization: Traiteur Atlas Casablanca ────────────────────────────────
INSERT INTO "public"."organizations" (
  "id", "name", "slug", "type", "description", "bio",
  "city", "address", "latitude", "longitude",
  "phone", "email", "whatsapp_number", "website", "instagram", "facebook",
  "cuisines", "specialties", "event_types", "service_styles", "languages",
  "min_guests", "max_guests", "price_range", "rating", "review_count",
  "registre_commerce", "identifiant_fiscal",
  "is_verified", "is_featured", "is_active", "subscription_tier",
  "settings", "total_events_completed", "avg_response_time_minutes", "booking_rate",
  "meta_title", "meta_description",
  "verified_at", "created_at", "updated_at"
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Traiteur Atlas',
  'traiteur-atlas-casablanca',
  'caterer',
  'Traiteur Atlas est le premier service traiteur a Casablanca, specialise dans les mariages marocains traditionnels, les evenements corporatifs et les iftars du Ramadan. Nous servons des festins authentiques marocains depuis 1998.',
  'Fondee par Chef Karim Benali, Traiteur Atlas allie recettes traditionnelles marocaines et presentation contemporaine. Notre equipe de 25 professionnels sert plus de 200 evenements par an a Casablanca et dans tout le Maroc.',
  'Casablanca',
  '45 Rue Ibn Batouta, Quartier Gauthier, Casablanca 20000',
  33.5883, -7.6114,
  '+212522334455', 'contact@traiteur-atlas.ma', '+212661234567',
  'https://traiteur-atlas.ma', '@traiteur_atlas', 'TraiteurAtlasCasa',
  ARRAY['moroccan', 'mediterranean', 'fusion'],
  ARRAY['couscous_royal', 'mechoui', 'pastilla', 'tajines', 'diffa'],
  ARRAY['wedding', 'corporate', 'ramadan_iftar', 'eid', 'birthday', 'engagement', 'henna'],
  ARRAY['buffet', 'plated', 'live_station', 'cocktail'],
  ARRAY['ar', 'fr', 'en'],
  20, 800,
  'premium',
  4.72, 47,
  'RC-CASA-123456', 'IF-987654321',
  true, true, true, 'pro',
  '{"defaultPaymentTemplate": "standard", "defaultLeadTimeDays": 5, "autoReplyEnabled": true, "autoReplyMessage": "Merci pour votre demande! Nous vous repondrons dans les 2 heures.", "currency": "MAD", "tvaEnabled": true, "tvaRate": 20}'::JSONB,
  187, 45, 72.50,
  'Traiteur Atlas Casablanca - Service Traiteur Mariage & Evenements',
  'Le meilleur traiteur a Casablanca pour mariages, evenements corporatifs et iftars. Cuisine marocaine authentique, service professionnel, devis gratuit.',
  '2024-03-15 10:00:00+00',
  '2024-01-01 10:00:00+00',
  NOW()
);


-- ── Org Members ────────────────────────────────────────────────────────────
-- Owner
INSERT INTO "public"."org_members" (
  "id", "org_id", "user_id", "role", "permissions", "is_active",
  "invited_by", "invited_at", "accepted_at", "created_at", "updated_at"
) VALUES (
  'aa111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  'org_owner',
  '{"all": true}'::JSONB,
  true,
  NULL,
  '2024-01-01 10:00:00+00',
  '2024-01-01 10:00:00+00',
  '2024-01-01 10:00:00+00',
  NOW()
);

-- Admin
INSERT INTO "public"."org_members" (
  "id", "org_id", "user_id", "role", "permissions", "is_active",
  "invited_by", "invited_at", "accepted_at", "created_at", "updated_at"
) VALUES (
  'aa222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'admin',
  '{"events": true, "quotes": true, "payments": true, "staff": true, "equipment": true, "menus": true, "reviews": true}'::JSONB,
  true,
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  '2024-01-15 10:00:00+00',
  '2024-01-15 12:00:00+00',
  '2024-01-15 10:00:00+00',
  NOW()
);

-- Staff
INSERT INTO "public"."org_members" (
  "id", "org_id", "user_id", "role", "permissions", "is_active",
  "invited_by", "invited_at", "accepted_at", "created_at", "updated_at"
) VALUES (
  'aa333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'staff',
  '{"events": true, "timeline": true}'::JSONB,
  true,
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  '2024-02-01 10:00:00+00',
  '2024-02-01 14:00:00+00',
  '2024-02-01 10:00:00+00',
  NOW()
);


-- ── Client Profiles ────────────────────────────────────────────────────────
INSERT INTO "public"."client_profiles" (
  "id", "org_id", "user_id", "name", "phone", "email", "city", "notes",
  "total_events", "total_spent", "created_at"
) VALUES
(
  'cc111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Amina El Fassi',
  '+212661112233',
  'amina.elfassi@gmail.com',
  'Casablanca',
  'Repeat client. Prefers traditional Moroccan cuisine. VIP.',
  3, 15000000, -- 150,000 MAD total
  '2024-03-01 10:00:00+00'
),
(
  'cc222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Mohammed Tazi',
  '+212662334455',
  'm.tazi@entreprise.ma',
  'Casablanca',
  'Corporate client. OCP Group events coordinator. Requires TVA invoices.',
  5, 42500000, -- 425,000 MAD total
  '2024-02-15 10:00:00+00'
),
(
  'cc333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Khadija Bennani',
  '+212663556677',
  'k.bennani@gmail.com',
  'Rabat',
  'First-time client. Wedding planning for daughter.',
  0, 0,
  '2026-02-10 10:00:00+00'
);


-- ── FeastQR Legacy Menu (for base table compatibility) ─────────────────────
INSERT INTO "public"."menus" (
  "id", "name", "user_id", "slug", "background_image_url", "city", "address",
  "is_published", "updated_at", "created_at", "contact_number", "currency"
) VALUES (
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a',
  'Traiteur Atlas - Menu',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  'traiteur-atlas-casablanca-482910',
  NULL, 'Casablanca', '45 Rue Ibn Batouta, Quartier Gauthier',
  true, NOW(), '2024-01-01 10:00:00+00', '+212522334455', 'MAD'
);


-- ── Catering Menus ─────────────────────────────────────────────────────────
-- Wedding Menu
INSERT INTO "public"."catering_menus" (
  "id", "user_id", "menu_id", "org_id", "name", "slug", "description",
  "event_type", "min_guests", "max_guests", "base_price_per_person", "currency",
  "city", "service_area", "lead_time_days", "is_published", "is_featured",
  "contact_phone", "contact_email", "whatsapp_number", "menu_type",
  "service_options", "meta_title", "meta_description", "created_at"
) VALUES (
  'dd111111-1111-1111-1111-111111111111',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a',
  '11111111-1111-1111-1111-111111111111',
  'Menu Mariage Royal',
  'menu-mariage-royal-atlas',
  'Notre menu mariage signature. Cuisine marocaine raffinee pour votre plus beau jour. Pastilla, mechoui, couscous royal et plus encore.',
  'wedding',
  50, 800,
  25000, -- 250 MAD per person
  'MAD',
  'Casablanca',
  'Casablanca, Rabat, Marrakech, Mohammedia, El Jadida',
  7, true, true,
  '+212522334455', 'mariage@traiteur-atlas.ma', '+212661234567',
  'per_head',
  '{"delivery": true, "setup": true, "staffService": true, "equipmentRental": true, "cleanup": true}'::JSONB,
  'Menu Mariage Traiteur Atlas Casablanca',
  'Menu mariage royal: pastilla, mechoui, couscous, patisseries. Service traiteur complet pour votre mariage a Casablanca.',
  '2024-01-15 10:00:00+00'
);

-- Corporate Menu
INSERT INTO "public"."catering_menus" (
  "id", "user_id", "menu_id", "org_id", "name", "slug", "description",
  "event_type", "min_guests", "max_guests", "base_price_per_person", "currency",
  "city", "service_area", "lead_time_days", "is_published", "is_featured",
  "contact_phone", "contact_email", "whatsapp_number", "menu_type",
  "service_options", "created_at"
) VALUES (
  'dd222222-2222-2222-2222-222222222222',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a',
  '11111111-1111-1111-1111-111111111111',
  'Menu Corporate & Conferences',
  'menu-corporate-atlas',
  'Menus professionnels pour reunions, conferences et evenements d''entreprise. Options dejeuner, pause-cafe et cocktail dinatoire.',
  'corporate',
  20, 300,
  18000, -- 180 MAD per person
  'MAD',
  'Casablanca',
  'Grand Casablanca, Rabat-Sale-Kenitra',
  3, true, false,
  '+212522334455', 'corporate@traiteur-atlas.ma', '+212661234567',
  'per_head',
  '{"delivery": true, "setup": true, "staffService": true, "equipmentRental": false, "cleanup": true}'::JSONB,
  '2024-02-01 10:00:00+00'
);

-- Ramadan Iftar Menu
INSERT INTO "public"."catering_menus" (
  "id", "user_id", "menu_id", "org_id", "name", "slug", "description",
  "event_type", "min_guests", "max_guests", "base_price_per_person", "currency",
  "city", "service_area", "lead_time_days", "is_published", "is_featured",
  "contact_phone", "contact_email", "whatsapp_number", "menu_type",
  "service_options", "created_at"
) VALUES (
  'dd333333-3333-3333-3333-333333333333',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a',
  '11111111-1111-1111-1111-111111111111',
  'Menu Iftar Ramadan',
  'menu-iftar-ramadan-atlas',
  'Iftar traditionnel marocain: harira, chebakia, briouates, tajines et patisseries. Service traiteur pour vos iftars collectifs.',
  'ramadan_iftar',
  30, 500,
  15000, -- 150 MAD per person
  'MAD',
  'Casablanca',
  'Casablanca, Mohammedia',
  2, true, true,
  '+212522334455', 'iftar@traiteur-atlas.ma', '+212661234567',
  'per_head',
  '{"delivery": true, "setup": true, "staffService": false, "equipmentRental": false, "cleanup": false}'::JSONB,
  '2024-03-01 10:00:00+00'
);


-- ── Catering Categories ────────────────────────────────────────────────────
-- Wedding Menu categories
INSERT INTO "public"."catering_categories" ("id", "catering_menu_id", "name", "description", "sort_order", "is_optional", "created_at") VALUES
  ('cat11111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111111', 'Entrees & Salades', 'Assortiment d''entrees marocaines traditionnelles', 1, false, NOW()),
  ('cat22222-2222-2222-2222-222222222222', 'dd111111-1111-1111-1111-111111111111', 'Plats Principaux', 'Tajines, couscous et mechoui', 2, false, NOW()),
  ('cat33333-3333-3333-3333-333333333333', 'dd111111-1111-1111-1111-111111111111', 'Desserts & Patisseries', 'Patisseries marocaines et desserts', 3, false, NOW()),
  ('cat44444-4444-4444-4444-444444444444', 'dd111111-1111-1111-1111-111111111111', 'Boissons', 'The a la menthe, jus frais et boissons', 4, false, NOW()),
  ('cat55555-5555-5555-5555-555555555555', 'dd111111-1111-1111-1111-111111111111', 'Stations Live', 'Stations de cuisine en direct', 5, true, NOW());

-- Corporate Menu categories
INSERT INTO "public"."catering_categories" ("id", "catering_menu_id", "name", "description", "sort_order", "is_optional", "created_at") VALUES
  ('cat66666-6666-6666-6666-666666666666', 'dd222222-2222-2222-2222-222222222222', 'Pause-Cafe', 'Viennoiseries et boissons chaudes', 1, false, NOW()),
  ('cat77777-7777-7777-7777-777777777777', 'dd222222-2222-2222-2222-222222222222', 'Dejeuner', 'Plats principaux pour dejeuner d''affaires', 2, false, NOW()),
  ('cat88888-8888-8888-8888-888888888888', 'dd222222-2222-2222-2222-222222222222', 'Cocktail Dinatoire', 'Bouchees et mini-portions', 3, true, NOW());

-- Iftar Menu categories
INSERT INTO "public"."catering_categories" ("id", "catering_menu_id", "name", "description", "sort_order", "is_optional", "created_at") VALUES
  ('cat99999-9999-9999-9999-999999999999', 'dd333333-3333-3333-3333-333333333333', 'Soupe & Casse-Croute', 'Harira, dates, chebakia', 1, false, NOW()),
  ('cataaa00-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dd333333-3333-3333-3333-333333333333', 'Plats Iftar', 'Tajines et grillades', 2, false, NOW()),
  ('catbbb00-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dd333333-3333-3333-3333-333333333333', 'Patisseries Ramadan', 'Chebakia, sellou, briouates au miel', 3, false, NOW());


-- ── Catering Items ─────────────────────────────────────────────────────────
-- Wedding Menu - Entrees
INSERT INTO "public"."catering_items" (
  "id", "catering_category_id", "catering_menu_id", "name", "description",
  "price_per_person", "price_per_unit", "unit_label", "serves_count",
  "is_vegetarian", "is_vegan", "is_halal", "is_gluten_free", "allergens",
  "sort_order", "is_available", "created_at"
) VALUES
(
  'item1111-1111-1111-1111-111111111111',
  'cat11111-1111-1111-1111-111111111111',
  'dd111111-1111-1111-1111-111111111111',
  'Pastilla au Poulet',
  'Pastilla feuilletee au poulet, amandes et cannelle, saupoudree de sucre glace',
  NULL, 45000, 'par pastilla', 10,
  false, false, true, false, ARRAY['nuts', 'gluten'],
  1, true, NOW()
),
(
  'item2222-2222-2222-2222-222222222222',
  'cat11111-1111-1111-1111-111111111111',
  'dd111111-1111-1111-1111-111111111111',
  'Briouates aux Crevettes',
  'Feuillete croustillant farci aux crevettes, herbes fraiches et epices',
  2500, NULL, NULL, NULL,
  false, false, true, false, ARRAY['shellfish', 'gluten'],
  2, true, NOW()
),
(
  'item3333-3333-3333-3333-333333333333',
  'cat11111-1111-1111-1111-111111111111',
  'dd111111-1111-1111-1111-111111111111',
  'Salade Marocaine Composee',
  'Assortiment de 7 salades: zaalouk, taktouka, carotte epice, betterave, poivrons grilles, concombre menthe, tomate oignon',
  1800, NULL, NULL, NULL,
  true, true, true, true, ARRAY[]::TEXT[],
  3, true, NOW()
),
-- Wedding Menu - Plats Principaux
(
  'item4444-4444-4444-4444-444444444444',
  'cat22222-2222-2222-2222-222222222222',
  'dd111111-1111-1111-1111-111111111111',
  'Mechoui Entier',
  'Agneau entier roti lentement aux epices traditionnelles, servi avec cumin et sel',
  NULL, 350000, 'par agneau', 20,
  false, false, true, true, ARRAY[]::TEXT[],
  1, true, NOW()
),
(
  'item5555-5555-5555-5555-555555555555',
  'cat22222-2222-2222-2222-222222222222',
  'dd111111-1111-1111-1111-111111111111',
  'Couscous Royal 7 Legumes',
  'Couscous traditionnel aux 7 legumes, poulet fermier, agneau et merguez',
  4500, NULL, NULL, NULL,
  false, false, true, true, ARRAY[]::TEXT[],
  2, true, NOW()
),
(
  'item6666-6666-6666-6666-666666666666',
  'cat22222-2222-2222-2222-222222222222',
  'dd111111-1111-1111-1111-111111111111',
  'Tajine aux Pruneaux et Amandes',
  'Tajine d''agneau aux pruneaux, amandes caramelisees et graines de sesame',
  3500, NULL, NULL, NULL,
  false, false, true, true, ARRAY['nuts'],
  3, true, NOW()
),
-- Wedding Menu - Desserts
(
  'item7777-7777-7777-7777-777777777777',
  'cat33333-3333-3333-3333-333333333333',
  'dd111111-1111-1111-1111-111111111111',
  'Assortiment Patisseries Marocaines',
  'Cornes de gazelle, makrout, ghriba, fekkas, briouates au miel',
  3000, NULL, NULL, NULL,
  true, false, true, false, ARRAY['nuts', 'gluten'],
  1, true, NOW()
),
(
  'item8888-8888-8888-8888-888888888888',
  'cat33333-3333-3333-3333-333333333333',
  'dd111111-1111-1111-1111-111111111111',
  'Piece Montee Traditionnelle',
  'Piece montee aux amandes et miel, decoree de fleurs en sucre',
  NULL, 250000, 'par piece', 50,
  true, false, true, false, ARRAY['nuts', 'gluten'],
  2, true, NOW()
),
-- Wedding Menu - Boissons
(
  'item9999-9999-9999-9999-999999999999',
  'cat44444-4444-4444-4444-444444444444',
  'dd111111-1111-1111-1111-111111111111',
  'The a la Menthe Service Traditionnel',
  'The vert a la menthe fraiche, verse a la marocaine',
  800, NULL, NULL, NULL,
  true, true, true, true, ARRAY[]::TEXT[],
  1, true, NOW()
),
(
  'itemaaa0-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'cat44444-4444-4444-4444-444444444444',
  'dd111111-1111-1111-1111-111111111111',
  'Jus d''Orange Frais',
  'Jus d''oranges pressees du Souss',
  600, NULL, NULL, NULL,
  true, true, true, true, ARRAY[]::TEXT[],
  2, true, NOW()
),
-- Wedding Menu - Live Stations
(
  'itembbb0-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cat55555-5555-5555-5555-555555555555',
  'dd111111-1111-1111-1111-111111111111',
  'Station Tanjia Live',
  'Tanjia preparee en direct devant les invites, cuite dans le four traditionnel',
  NULL, 250000, 'par station', 30,
  false, false, true, true, ARRAY[]::TEXT[],
  1, true, NOW()
);


-- ── Catering Packages ──────────────────────────────────────────────────────
INSERT INTO "public"."catering_packages" (
  "id", "catering_menu_id", "name", "description", "price_per_person",
  "min_guests", "max_guests", "is_featured", "sort_order", "includes_text", "created_at"
) VALUES
(
  'pkg11111-1111-1111-1111-111111111111',
  'dd111111-1111-1111-1111-111111111111',
  'Forfait Mariage Or',
  'Notre forfait mariage signature avec service complet',
  25000, -- 250 MAD/person
  100, 500, true, 1,
  '3 entrees au choix + 2 plats principaux + desserts + boissons + service staff',
  NOW()
),
(
  'pkg22222-2222-2222-2222-222222222222',
  'dd111111-1111-1111-1111-111111111111',
  'Forfait Mariage Diamant',
  'Le summum du luxe pour votre mariage. Menu complet avec stations live.',
  40000, -- 400 MAD/person
  50, 300, true, 2,
  '5 entrees + mechoui + 3 plats + station live + patisseries + piece montee + boissons + service VIP',
  NOW()
),
(
  'pkg33333-3333-3333-3333-333333333333',
  'dd222222-2222-2222-2222-222222222222',
  'Dejeuner Business',
  'Menu dejeuner d''affaires complet',
  18000, -- 180 MAD/person
  20, 150, true, 1,
  'Pause-cafe matin + dejeuner 3 services + boissons',
  NOW()
);


-- ── Package Items (link items to packages) ─────────────────────────────────
INSERT INTO "public"."catering_package_items" ("id", "package_id", "item_id", "category_id", "is_included", "max_selections") VALUES
  ('pi111111-1111-1111-1111-111111111111', 'pkg11111-1111-1111-1111-111111111111', 'item1111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', true, 3),
  ('pi222222-2222-2222-2222-222222222222', 'pkg11111-1111-1111-1111-111111111111', 'item2222-2222-2222-2222-222222222222', 'cat11111-1111-1111-1111-111111111111', true, 3),
  ('pi333333-3333-3333-3333-333333333333', 'pkg11111-1111-1111-1111-111111111111', 'item3333-3333-3333-3333-333333333333', 'cat11111-1111-1111-1111-111111111111', true, 3),
  ('pi444444-4444-4444-4444-444444444444', 'pkg11111-1111-1111-1111-111111111111', 'item5555-5555-5555-5555-555555555555', 'cat22222-2222-2222-2222-222222222222', true, 2),
  ('pi555555-5555-5555-5555-555555555555', 'pkg11111-1111-1111-1111-111111111111', 'item6666-6666-6666-6666-666666666666', 'cat22222-2222-2222-2222-222222222222', true, 2),
  ('pi666666-6666-6666-6666-666666666666', 'pkg11111-1111-1111-1111-111111111111', 'item7777-7777-7777-7777-777777777777', 'cat33333-3333-3333-3333-333333333333', true, NULL),
  ('pi777777-7777-7777-7777-777777777777', 'pkg11111-1111-1111-1111-111111111111', 'item9999-9999-9999-9999-999999999999', 'cat44444-4444-4444-4444-444444444444', true, NULL),
  ('pi888888-8888-8888-8888-888888888888', 'pkg11111-1111-1111-1111-111111111111', 'itemaaa0-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cat44444-4444-4444-4444-444444444444', true, NULL);


-- ── Catering Themes ────────────────────────────────────────────────────────
INSERT INTO "public"."catering_themes" (
  "id", "catering_menu_id",
  "primary_color", "secondary_color", "background_color", "surface_color",
  "text_color", "accent_color", "heading_font", "body_font",
  "layout_style", "card_style", "border_radius", "header_style", "custom_css"
) VALUES (
  'theme111-1111-1111-1111-111111111111',
  'dd111111-1111-1111-1111-111111111111',
  '#8B4513', '#D4A574', '#FFF8F0', '#FFFFFF',
  '#2C1810', '#C17F3E', 'Playfair Display', 'Lora',
  'elegant', 'elevated', 'medium', 'banner', ''
);


-- ── Events ─────────────────────────────────────────────────────────────────

-- Event 1: Confirmed wedding (upcoming)
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "event_end_time", "guest_count",
  "venue_name", "venue_address", "venue_city", "venue_lat", "venue_lng",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "dietary_requirements", "special_requests",
  "total_amount", "deposit_amount", "balance_due", "currency",
  "source", "catering_menu_id", "package_id",
  "internal_notes", "created_at"
) VALUES (
  'ev111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'cc333333-3333-3333-3333-333333333333',
  'confirmed',
  'wedding',
  'Mariage Bennani-Alaoui',
  '2026-04-15',
  '19:00', '02:00',
  250,
  'Salle des Fetes Al Mounia',
  '123 Boulevard Zerktouni, Casablanca',
  'Casablanca',
  33.5950, -7.6187,
  'Khadija Bennani', '+212663556677', 'k.bennani@gmail.com',
  'buffet',
  'Tout halal. 5 invites vegetariens.',
  'Decoration en or et blanc. Entree de la mariee avec tanjia live station. Piece montee 3 etages.',
  6250000, -- 62,500 MAD
  1875000, -- 18,750 MAD (30%)
  4375000, -- 43,750 MAD
  'MAD',
  'whatsapp',
  'dd111111-1111-1111-1111-111111111111',
  'pkg11111-1111-1111-1111-111111111111',
  'Client VIP potentiel. Famille connue a Casa. Excellente opportunite pour portfolio mariage.',
  '2026-02-10 10:00:00+00'
);

-- Event 2: Corporate event (quote sent)
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "event_end_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "special_requests",
  "total_amount", "currency",
  "budget_min", "budget_max",
  "source", "catering_menu_id", "package_id",
  "created_at"
) VALUES (
  'ev222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'cc222222-2222-2222-2222-222222222222',
  'quote_sent',
  'corporate',
  'Conference Annuelle OCP Group',
  '2026-03-20',
  '09:00', '17:00',
  120,
  'Hotel Hyatt Regency',
  'Place des Nations Unies, Casablanca',
  'Casablanca',
  'Mohammed Tazi', '+212662334455', 'm.tazi@entreprise.ma',
  'plated',
  'Pause cafe matin et apres-midi. Dejeuner assis 3 services. Besoin de facture avec TVA.',
  2160000, -- 21,600 MAD
  'MAD',
  15000, 20000, -- 150-200 MAD/person budget
  'direct',
  'dd222222-2222-2222-2222-222222222222',
  'pkg33333-3333-3333-3333-333333333333',
  '2026-02-15 10:00:00+00'
);

-- Event 3: Ramadan Iftar (inquiry)
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "special_requests",
  "currency", "budget_min", "budget_max",
  "source", "catering_menu_id",
  "created_at"
) VALUES (
  'ev333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'cc111111-1111-1111-1111-111111111111',
  'inquiry',
  'ramadan_iftar',
  'Iftar Annuel Entreprise El Fassi',
  '2026-03-10',
  '18:30',
  80,
  'Riad El Fassi',
  '78 Rue des Consuls, Maarif, Casablanca',
  'Casablanca',
  'Amina El Fassi', '+212661112233', 'amina.elfassi@gmail.com',
  'buffet',
  'Harira obligatoire. Chebakia traditionnelle. Veuillez inclure sellou et briouates au miel.',
  'MAD',
  12000, 18000, -- 120-180 MAD/person budget
  'whatsapp',
  'dd333333-3333-3333-3333-333333333333',
  '2026-02-20 10:00:00+00'
);

-- Event 4: Completed wedding (for reviews)
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style",
  "total_amount", "deposit_amount", "balance_due", "currency",
  "source", "catering_menu_id", "package_id",
  "created_at"
) VALUES (
  'ev444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'cc111111-1111-1111-1111-111111111111',
  'settled',
  'wedding',
  'Mariage El Fassi-Chraibi',
  '2025-09-20',
  '20:00',
  350,
  'Palais des Congres',
  'Avenue des FAR, Casablanca',
  'Casablanca',
  'Amina El Fassi', '+212661112233', 'amina.elfassi@gmail.com',
  'buffet',
  8750000, -- 87,500 MAD
  8750000, -- fully paid
  0,
  'MAD',
  'direct',
  'dd111111-1111-1111-1111-111111111111',
  'pkg22222-2222-2222-2222-222222222222',
  '2025-06-15 10:00:00+00'
);


-- ── Quotes ─────────────────────────────────────────────────────────────────

-- Quote for the wedding (accepted)
INSERT INTO "public"."quotes" (
  "id", "org_id", "event_id", "version", "status",
  "items", "subtotal", "tax_rate", "tax_amount",
  "seasonal_adjustment", "volume_discount", "additional_charges",
  "total", "per_head_price",
  "valid_until", "cancellation_policy", "terms_and_conditions", "notes",
  "sent_at", "responded_at", "created_at"
) VALUES (
  'qt111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  1,
  'accepted',
  '[
    {
      "section": "Entrees & Salades",
      "items": [
        {"name": "Pastilla au Poulet", "qty": 25, "unitType": "per_unit", "unitPrice": 45000, "subtotal": 1125000},
        {"name": "Briouates aux Crevettes", "qty": 250, "unitType": "per_person", "unitPrice": 2500, "subtotal": 625000},
        {"name": "Salade Marocaine Composee", "qty": 250, "unitType": "per_person", "unitPrice": 1800, "subtotal": 450000}
      ]
    },
    {
      "section": "Plats Principaux",
      "items": [
        {"name": "Mechoui Entier (x2)", "qty": 2, "unitType": "per_unit", "unitPrice": 350000, "subtotal": 700000},
        {"name": "Couscous Royal 7 Legumes", "qty": 250, "unitType": "per_person", "unitPrice": 4500, "subtotal": 1125000}
      ]
    },
    {
      "section": "Desserts",
      "items": [
        {"name": "Assortiment Patisseries", "qty": 250, "unitType": "per_person", "unitPrice": 3000, "subtotal": 750000},
        {"name": "Piece Montee 3 etages", "qty": 1, "unitType": "per_unit", "unitPrice": 350000, "subtotal": 350000}
      ]
    },
    {
      "section": "Boissons",
      "items": [
        {"name": "The a la Menthe", "qty": 250, "unitType": "per_person", "unitPrice": 800, "subtotal": 200000},
        {"name": "Jus d Orange Frais", "qty": 250, "unitType": "per_person", "unitPrice": 600, "subtotal": 150000}
      ]
    },
    {
      "section": "Services",
      "items": [
        {"name": "Station Tanjia Live", "qty": 1, "unitType": "per_unit", "unitPrice": 250000, "subtotal": 250000},
        {"name": "Service Staff (12 serveurs)", "qty": 1, "unitType": "flat", "unitPrice": 525000, "subtotal": 525000}
      ]
    }
  ]'::JSONB,
  6250000,  -- subtotal: 62,500 MAD
  0,        -- no TVA (individual client)
  0,
  0, 0, 0,
  6250000,  -- total
  25000,    -- 250 MAD per head
  '2026-03-01',
  'Annulation gratuite jusqu''a 30 jours avant. 50% rembourse entre 30-14 jours. Aucun remboursement apres 14 jours.',
  'Le devis inclut la livraison, l''installation et le service. Vaisselle et nappes incluses. Nettoyage en fin de soiree inclus.',
  'Devis personnalise pour le mariage Bennani-Alaoui. 250 invites, service buffet royal.',
  '2026-02-12 10:00:00+00',
  '2026-02-14 16:00:00+00',
  '2026-02-11 10:00:00+00'
);

-- Quote for corporate event (sent, pending)
INSERT INTO "public"."quotes" (
  "id", "org_id", "event_id", "version", "status",
  "items", "subtotal", "tax_rate", "tax_amount",
  "total", "per_head_price",
  "valid_until", "notes",
  "sent_at", "created_at"
) VALUES (
  'qt222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ev222222-2222-2222-2222-222222222222',
  1,
  'sent',
  '[
    {
      "section": "Pause-Cafe Matin",
      "items": [
        {"name": "Viennoiseries assorties", "qty": 120, "unitType": "per_person", "unitPrice": 2000, "subtotal": 240000},
        {"name": "Cafe, the, jus", "qty": 120, "unitType": "per_person", "unitPrice": 1500, "subtotal": 180000}
      ]
    },
    {
      "section": "Dejeuner",
      "items": [
        {"name": "Entree: Salade Nicoise", "qty": 120, "unitType": "per_person", "unitPrice": 3000, "subtotal": 360000},
        {"name": "Plat: Poulet roti aux herbes", "qty": 120, "unitType": "per_person", "unitPrice": 5000, "subtotal": 600000},
        {"name": "Dessert: Creme brulee", "qty": 120, "unitType": "per_person", "unitPrice": 2500, "subtotal": 300000}
      ]
    },
    {
      "section": "Pause-Cafe Apres-midi",
      "items": [
        {"name": "Patisseries et fruits", "qty": 120, "unitType": "per_person", "unitPrice": 1500, "subtotal": 180000}
      ]
    }
  ]'::JSONB,
  1860000,  -- subtotal: 18,600 MAD (HT)
  20.00,    -- TVA 20%
  300000,   -- TVA: 3,000 MAD (on subtotal-discount)
  2160000,  -- total TTC: 21,600 MAD
  18000,    -- 180 MAD per head
  '2026-03-10',
  'Conference annuelle OCP Group. 120 participants. Facture avec TVA requise.',
  '2026-02-17 10:00:00+00',
  '2026-02-16 10:00:00+00'
);


-- ── Payment Milestones ─────────────────────────────────────────────────────

-- Wedding: 3 milestones (30/50/20 split)
INSERT INTO "public"."payment_milestones" (
  "id", "org_id", "event_id", "label", "milestone_type",
  "percentage", "amount", "due_date", "status",
  "payment_method", "payment_reference", "paid_at", "created_at"
) VALUES
(
  'pm111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Acompte (30%)',
  'deposit',
  30.00,
  1875000, -- 18,750 MAD
  '2026-03-01',
  'paid',
  'bank_transfer',
  'VIR-BMCE-2026022001',
  '2026-02-20 14:00:00+00',
  '2026-02-14 10:00:00+00'
),
(
  'pm222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Pre-evenement (50%)',
  'progress',
  50.00,
  3125000, -- 31,250 MAD
  '2026-04-08',
  'pending',
  NULL, NULL, NULL,
  '2026-02-14 10:00:00+00'
),
(
  'pm333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Solde final (20%)',
  'final',
  20.00,
  1250000, -- 12,500 MAD
  '2026-04-18',
  'pending',
  NULL, NULL, NULL,
  '2026-02-14 10:00:00+00'
);

-- Completed wedding: all milestones paid
INSERT INTO "public"."payment_milestones" (
  "id", "org_id", "event_id", "label", "milestone_type",
  "percentage", "amount", "due_date", "status",
  "payment_method", "payment_reference", "paid_at", "created_at"
) VALUES
(
  'pm444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'ev444444-4444-4444-4444-444444444444',
  'Acompte (30%)',
  'deposit',
  30.00,
  2625000, -- 26,250 MAD
  '2025-08-20',
  'paid',
  'bank_transfer',
  'VIR-BMCE-2025081501',
  '2025-08-15 10:00:00+00',
  '2025-07-01 10:00:00+00'
),
(
  'pm555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'ev444444-4444-4444-4444-444444444444',
  'Pre-evenement (50%)',
  'progress',
  50.00,
  4375000, -- 43,750 MAD
  '2025-09-13',
  'paid',
  'cod',
  'CASH-2025091301',
  '2025-09-13 11:00:00+00',
  '2025-07-01 10:00:00+00'
),
(
  'pm666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'ev444444-4444-4444-4444-444444444444',
  'Solde final (20%)',
  'final',
  20.00,
  1750000, -- 17,500 MAD
  '2025-09-23',
  'paid',
  'cod',
  'CASH-2025092301',
  '2025-09-22 10:00:00+00',
  '2025-07-01 10:00:00+00'
);


-- ── Staff Assignments ──────────────────────────────────────────────────────

-- Wedding staff
INSERT INTO "public"."staff_assignments" (
  "id", "org_id", "event_id", "staff_member_id",
  "staff_name", "staff_phone", "staff_role",
  "shift_start", "shift_end", "tasks",
  "status", "pay_rate", "pay_type", "total_pay", "notes", "created_at"
) VALUES
(
  'sa111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Youssef Amrani',
  '+212664001122',
  'chef',
  '14:00', '01:00',
  ARRAY['Superviser cuisine', 'Preparer couscous royal', 'Coordonner service'],
  'confirmed',
  200000, 'daily', 200000, -- 2,000 MAD
  'Chef principal pour le mariage Bennani',
  NOW()
),
(
  'sa222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL,
  'Hassan Ouazzani',
  '+212665112233',
  'server',
  '17:00', '02:00',
  ARRAY['Service buffet', 'Service the', 'Nettoyage'],
  'assigned',
  80000, 'daily', 80000, -- 800 MAD
  NULL,
  NOW()
),
(
  'sa333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL,
  'Rachid Moussaoui',
  '+212666223344',
  'setup_crew',
  '15:00', '03:00',
  ARRAY['Installation buffet', 'Decoration', 'Demontage'],
  'assigned',
  60000, 'daily', 60000, -- 600 MAD
  NULL,
  NOW()
),
(
  'sa444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL,
  'Aicha Benjelloun',
  '+212667334455',
  'coordinator',
  '16:00', '02:00',
  ARRAY['Coordination service', 'Contact client', 'Gestion timing'],
  'confirmed',
  150000, 'daily', 150000, -- 1,500 MAD
  'Coordinatrice principale. Contact point pour la famille Bennani.',
  NOW()
);


-- ── Equipment ──────────────────────────────────────────────────────────────
INSERT INTO "public"."equipment" (
  "id", "org_id", "name", "category", "total_quantity", "available_quantity",
  "condition", "cost_per_unit", "rental_price", "notes", "created_at"
) VALUES
(
  'eq111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'Rechaud Chafing Dish Grand',
  'serving',
  30, 20,
  'good',
  45000, -- 450 MAD
  5000,  -- 50 MAD/jour
  'Inox professionnel, gel combustible inclus',
  NOW()
),
(
  'eq222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Nappe Blanche 180x300cm',
  'linen',
  50, 35,
  'good',
  8000, -- 80 MAD
  1500,  -- 15 MAD/jour
  'Polyester anti-tache, lavage inclus',
  NOW()
),
(
  'eq333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Theiere Traditionnelle',
  'serving',
  40, 30,
  'good',
  12000, -- 120 MAD
  2000,   -- 20 MAD/jour
  'Theiere en inox avec verre decore',
  NOW()
),
(
  'eq444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'Table Buffet Pliante 240cm',
  'table',
  20, 15,
  'good',
  65000, -- 650 MAD
  8000,   -- 80 MAD/jour
  'Table rectangulaire pliante, housse incluse',
  NOW()
),
(
  'eq555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'Tajine Grande Taille (decoratif)',
  'serving',
  15, 10,
  'good',
  25000, -- 250 MAD
  4000,   -- 40 MAD/jour
  'Tajine XL pour presentation buffet',
  NOW()
);


-- ── Equipment Allocations ──────────────────────────────────────────────────
INSERT INTO "public"."equipment_allocations" (
  "id", "org_id", "equipment_id", "event_id", "quantity", "status", "created_at"
) VALUES
  ('ea111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'eq111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111', 10, 'reserved', NOW()),
  ('ea222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'eq222222-2222-2222-2222-222222222222', 'ev111111-1111-1111-1111-111111111111', 15, 'reserved', NOW()),
  ('ea333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'eq333333-3333-3333-3333-333333333333', 'ev111111-1111-1111-1111-111111111111', 10, 'reserved', NOW()),
  ('ea444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'eq444444-4444-4444-4444-444444444444', 'ev111111-1111-1111-1111-111111111111', 5, 'reserved', NOW()),
  ('ea555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'eq555555-5555-5555-5555-555555555555', 'ev111111-1111-1111-1111-111111111111', 5, 'reserved', NOW());


-- ── Event Messages ─────────────────────────────────────────────────────────

-- Wedding inquiry conversation
INSERT INTO "public"."event_messages" (
  "id", "org_id", "event_id", "sender_id", "sender_role", "sender_name",
  "message_type", "content", "is_read", "read_at", "created_at"
) VALUES
(
  'em111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL, 'client', 'Khadija Bennani',
  'text',
  'Bonjour, nous organisons le mariage de notre fille pour le 15 avril. Nous cherchons un traiteur pour 250 invites. Pouvez-vous nous envoyer un devis?',
  true, '2026-02-10 11:00:00+00',
  '2026-02-10 10:30:00+00'
),
(
  'em222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'org', 'Karim Benali',
  'text',
  'Bonjour Mme Bennani! Felicitations pour le mariage de votre fille. Nous serions ravis de vous accompagner. Je vais preparer un devis personnalise pour 250 invites avec notre menu mariage. Avez-vous des preferences particulieres?',
  true, '2026-02-10 12:00:00+00',
  '2026-02-10 11:15:00+00'
),
(
  'em333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL, 'client', 'Khadija Bennani',
  'text',
  'Merci! Nous aimerions un buffet traditionnel marocain avec mechoui, couscous royal, pastilla. Et une station tanjia live pour l''entree de la mariee. Budget autour de 250 MAD par personne.',
  true, '2026-02-10 14:00:00+00',
  '2026-02-10 13:45:00+00'
),
(
  'em444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'org', 'Karim Benali',
  'quote_link',
  'Voici votre devis personnalise pour le mariage. 250 MAD/personne avec service complet, station tanjia live incluse. Validite: 1 mars 2026.',
  true, '2026-02-12 11:00:00+00',
  '2026-02-12 10:30:00+00'
),
(
  'em555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL, 'client', 'Khadija Bennani',
  'text',
  'Le devis nous convient parfaitement! Nous acceptons. Comment proceder pour le depot?',
  true, '2026-02-14 17:00:00+00',
  '2026-02-14 16:00:00+00'
);


-- ── Event Reviews ──────────────────────────────────────────────────────────

-- Review for completed wedding
INSERT INTO "public"."event_reviews" (
  "id", "org_id", "event_id", "client_id",
  "reviewer_name", "reviewer_phone", "event_type", "guest_count", "event_date",
  "rating_overall", "rating_food", "rating_service", "rating_value",
  "rating_presentation", "rating_punctuality", "rating_communication",
  "comment", "response", "responded_at",
  "status", "is_verified", "is_featured", "created_at"
) VALUES
(
  'rv111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev444444-4444-4444-4444-444444444444',
  'cc111111-1111-1111-1111-111111111111',
  'Amina El Fassi',
  '+212661112233',
  'wedding',
  350,
  '2025-09-20',
  5, 5, 5, 4, 5, 5, 5,
  'Un service exceptionnel pour le mariage de mon fils! Le couscous royal etait magnifique, le mechoui parfaitement cuit, et l''equipe tres professionnelle. La presentation etait digne d''un palace. Merci Chef Karim et toute l''equipe Atlas!',
  'Merci beaucoup Mme El Fassi! C''etait un honneur de participer a cet evenement memorable. Votre confiance nous touche enormement. A bientot pour un prochain evenement!',
  '2025-10-01 10:00:00+00',
  'published',
  true,
  true,
  '2025-09-25 10:00:00+00'
),
(
  'rv222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  NULL, NULL,
  'Younes Berrada',
  '+212668990011',
  'corporate',
  80,
  '2025-11-15',
  4, 4, 5, 4, 4, 5, 5,
  'Tres bon traiteur pour notre seminaire annuel. Le dejeuner etait excellent et le service impeccable. Seul bemol: les portions de dessert etaient un peu petites. Nous recommandons vivement pour les evenements corporate.',
  'Merci M. Berrada pour votre retour. Nous prenons note pour les portions de dessert et nous ameliorerons cela. Au plaisir de vous servir a nouveau!',
  '2025-11-20 10:00:00+00',
  'published',
  true,
  false,
  '2025-11-18 10:00:00+00'
);


-- ── Invoices ───────────────────────────────────────────────────────────────

-- Invoice for completed wedding (fully paid)
INSERT INTO "public"."invoices" (
  "id", "org_id", "event_id", "invoice_number",
  "client_name", "client_phone", "client_email", "client_address",
  "org_name", "org_ice", "org_rc", "org_address",
  "subtotal", "tva_rate", "tva_amount", "total_amount",
  "amount_paid", "amount_due", "currency",
  "status", "issued_at", "due_date", "paid_at",
  "notes", "created_at"
) VALUES (
  'inv11111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev444444-4444-4444-4444-444444444444',
  'DYF-2025-00001',
  'Amina El Fassi', '+212661112233', 'amina.elfassi@gmail.com',
  '78 Rue des Consuls, Maarif, Casablanca',
  'Traiteur Atlas', 'IF-987654321', 'RC-CASA-123456',
  '45 Rue Ibn Batouta, Quartier Gauthier, Casablanca 20000',
  8750000, -- 87,500 MAD
  0, 0,    -- no TVA (individual)
  8750000, -- 87,500 MAD
  8750000, -- fully paid
  0,
  'MAD',
  'paid',
  '2025-09-21 10:00:00+00',
  '2025-10-21',
  '2025-09-22 10:00:00+00',
  'Facture pour mariage El Fassi-Chraibi, 20 septembre 2025, 350 invites.',
  '2025-09-21 10:00:00+00'
);


-- ── Event Timeline ─────────────────────────────────────────────────────────

-- Timeline for upcoming wedding
INSERT INTO "public"."event_timeline" (
  "id", "org_id", "event_id",
  "title", "description", "category",
  "start_time", "end_time", "duration_minutes",
  "assigned_to", "assigned_name",
  "status", "sort_order", "created_at"
) VALUES
(
  'tl111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Achats marche gros',
  'Acheter legumes, viandes, epices au marche de gros Derb Omar',
  'shopping',
  '2026-04-14 06:00:00+00',
  '2026-04-14 10:00:00+00',
  240,
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Youssef Amrani',
  'pending',
  1,
  NOW()
),
(
  'tl222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Preparation pastilla',
  'Preparer la farce et les feuilles de pastilla (25 pastillas)',
  'prep',
  '2026-04-14 11:00:00+00',
  '2026-04-14 16:00:00+00',
  300,
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Youssef Amrani',
  'pending',
  2,
  NOW()
),
(
  'tl333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Marinage mechoui',
  'Mariner les 2 agneaux avec epices traditionnelles',
  'prep',
  '2026-04-14 14:00:00+00',
  '2026-04-14 15:00:00+00',
  60,
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Youssef Amrani',
  'pending',
  3,
  NOW()
),
(
  'tl444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Cuisson couscous et tajines',
  'Cuisson du couscous royal et des tajines aux pruneaux (Jour J matin)',
  'cooking',
  '2026-04-15 06:00:00+00',
  '2026-04-15 14:00:00+00',
  480,
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Youssef Amrani',
  'pending',
  4,
  NOW()
),
(
  'tl555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Chargement camion',
  'Charger nourriture, equipement, nappes dans le camion refrigere',
  'packing',
  '2026-04-15 14:00:00+00',
  '2026-04-15 15:30:00+00',
  90,
  NULL, 'Rachid Moussaoui',
  'pending',
  5,
  NOW()
),
(
  'tl666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Transport vers salle',
  'Transport du materiel et nourriture vers Salle Al Mounia',
  'transport',
  '2026-04-15 15:30:00+00',
  '2026-04-15 16:30:00+00',
  60,
  NULL, 'Rachid Moussaoui',
  'pending',
  6,
  NOW()
),
(
  'tl777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Installation buffet',
  'Monter les tables, nappes, chafing dishes, decoration buffet',
  'setup',
  '2026-04-15 16:30:00+00',
  '2026-04-15 18:30:00+00',
  120,
  NULL, 'Rachid Moussaoui',
  'pending',
  7,
  NOW()
),
(
  'tl888888-8888-8888-8888-888888888888',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Service du diner',
  'Service buffet pour 250 invites. Station tanjia. Service the.',
  'service',
  '2026-04-15 19:00:00+00',
  '2026-04-16 01:00:00+00',
  360,
  NULL, 'Aicha Benjelloun',
  'pending',
  8,
  NOW()
),
(
  'tl999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Nettoyage et demontage',
  'Debarrasser, nettoyer, ranger equipement, charger camion retour',
  'teardown',
  '2026-04-16 01:00:00+00',
  '2026-04-16 03:00:00+00',
  120,
  NULL, 'Rachid Moussaoui',
  'pending',
  9,
  NOW()
);


-- ============================================================================
-- END OF DIYAFA SEED DATA
-- Organization: Traiteur Atlas (1 org, 3 members, 3 clients)
-- Menus: 3 catering menus (wedding, corporate, iftar) with 11+ items
-- Events: 4 events (confirmed wedding, quoted corporate, inquiry iftar, settled wedding)
-- Quotes: 2 quotes (accepted wedding, sent corporate)
-- Payments: 6 milestones (3 for upcoming, 3 paid for completed)
-- Staff: 4 assignments for the wedding
-- Equipment: 5 items, 5 allocations
-- Messages: 5 conversation messages
-- Reviews: 2 published reviews
-- Invoices: 1 paid invoice
-- Timeline: 9 timeline items for wedding prep
-- ============================================================================
