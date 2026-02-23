-- ============================================================================
-- DIYAFA PLATFORM SEED DATA
-- Moroccan catering platform comprehensive test data
-- ============================================================================
-- Test users:
--   random@gmail.com / testtest  (Org owner: Dar Diyafa Traiteur)
--   admin@diyafa.ma  / testtest  (Admin: Dar Diyafa Traiteur)
--   staff@diyafa.ma  / testtest  (Staff: Dar Diyafa Traiteur)
--   owner@riad-baraka.ma / testtest (Org owner: Riad Al Baraka)
--   owner@atlas-gourmet.ma / testtest (Org owner: Atlas Gourmet Events)
--
-- Organizations:
--   1. Dar Diyafa Traiteur — Premium Casablanca caterer (wedding + corporate)
--   2. Riad Al Baraka Catering — Traditional Marrakech caterer
--   3. Atlas Gourmet Events — Modern Rabat caterer (corporate + conference)
--
-- Includes: 5 users, 3 orgs, 5 org members, 8 clients, 9 catering menus,
--           10 events, 5 quotes, 15 payment milestones, 15 equipment items,
--           equipment allocations, messages, reviews, invoices, timelines
-- ============================================================================


-- ══════════════════════════════════════════════════════════════════════════════
-- AUTH USERS
-- ══════════════════════════════════════════════════════════════════════════════

-- User 1: Primary test user (Dar Diyafa owner)
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

-- User 2: Admin user (Dar Diyafa admin)
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

-- User 3: Staff user (Dar Diyafa staff)
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

-- User 4: Riad Al Baraka owner
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
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'authenticated', 'authenticated', 'owner@riad-baraka.ma',
  '$2a$10$ub8629WYCUaVFiEot0KDXu/Bi68BQc/Y4C2QSPDEPGfpS/f6J0p0S',
  '2024-03-01 10:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL,
  '2024-03-01 10:00:00+00',
  '{"provider": "email", "providers": ["email"]}', '{}', NULL,
  '2024-03-01 10:00:00+00', '2024-03-01 10:00:00+00',
  NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL
);

-- User 5: Atlas Gourmet Events owner
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
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'authenticated', 'authenticated', 'owner@atlas-gourmet.ma',
  '$2a$10$ub8629WYCUaVFiEot0KDXu/Bi68BQc/Y4C2QSPDEPGfpS/f6J0p0S',
  '2024-04-01 10:00:00+00', NULL, '', NULL, '', NULL, '', '', NULL,
  '2024-04-01 10:00:00+00',
  '{"provider": "email", "providers": ["email"]}', '{}', NULL,
  '2024-04-01 10:00:00+00', '2024-04-01 10:00:00+00',
  NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL
);

-- Auth identities for all users
INSERT INTO "auth"."identities" ("id", "user_id", "provider_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at") VALUES
  ('7042152a-7151-49f1-9bfd-3d8f156e7aef', '7042152a-7151-49f1-9bfd-3d8f156e7aef', '7042152a-7151-49f1-9bfd-3d8f156e7aef', '{"sub": "7042152a-7151-49f1-9bfd-3d8f156e7aef", "email": "random@gmail.com"}', 'email', '2023-10-22 21:37:14.249029+00', '2023-10-22 21:37:14.24905+00', '2023-10-22 21:37:14.24905+00'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '{"sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "email": "admin@diyafa.ma"}', 'email', '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '{"sub": "b2c3d4e5-f6a7-8901-bcde-f12345678901", "email": "staff@diyafa.ma"}', 'email', '2024-02-01 10:00:00+00', '2024-02-01 10:00:00+00', '2024-02-01 10:00:00+00'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'c3d4e5f6-a7b8-9012-cdef-123456789012', '{"sub": "c3d4e5f6-a7b8-9012-cdef-123456789012", "email": "owner@riad-baraka.ma"}', 'email', '2024-03-01 10:00:00+00', '2024-03-01 10:00:00+00', '2024-03-01 10:00:00+00'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'd4e5f6a7-b8c9-0123-defa-234567890123', 'd4e5f6a7-b8c9-0123-defa-234567890123', '{"sub": "d4e5f6a7-b8c9-0123-defa-234567890123", "email": "owner@atlas-gourmet.ma"}', 'email', '2024-04-01 10:00:00+00', '2024-04-01 10:00:00+00', '2024-04-01 10:00:00+00');


-- ══════════════════════════════════════════════════════════════════════════════
-- PROFILES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."profiles" ("id", "updated_at", "username", "full_name", "email") VALUES
  ('7042152a-7151-49f1-9bfd-3d8f156e7aef', NOW(), 'karim_diyafa', 'Karim Benali', 'random@gmail.com'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW(), 'fatima_admin', 'Fatima Zahra', 'admin@diyafa.ma'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW(), 'youssef_chef', 'Youssef Amrani', 'staff@diyafa.ma'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', NOW(), 'hassan_baraka', 'Hassan El Mansouri', 'owner@riad-baraka.ma'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', NOW(), 'nadia_atlas', 'Nadia Chraibi', 'owner@atlas-gourmet.ma');


-- ══════════════════════════════════════════════════════════════════════════════
-- LANGUAGES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."languages" ("id", "name", "iso_code", "flag_url") VALUES
  ('56ef000f-2a05-41ab-bbfa-6f1a619306ed', 'English', 'GB', 'https://flagsapi.com/GB/flat/64.png'),
  ('70ea2f77-b6f7-49a7-9ad0-02a1a7913d8a', 'Arabic', 'MA', 'https://flagsapi.com/MA/flat/64.png'),
  ('ced37313-fc91-4c4d-a480-5d8081311a8e', 'French', 'FR', 'https://flagsapi.com/FR/flat/64.png')
ON CONFLICT (id) DO NOTHING;


-- ══════════════════════════════════════════════════════════════════════════════
-- ORGANIZATIONS
-- ══════════════════════════════════════════════════════════════════════════════

-- Org 1: Dar Diyafa Traiteur — Premium Casablanca caterer
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
  'Dar Diyafa Traiteur',
  'dar-diyafa-traiteur-casablanca',
  'caterer',
  'Dar Diyafa est le premier service traiteur a Casablanca, specialise dans les mariages marocains traditionnels, les galas corporatifs et les iftars du Ramadan. Cuisine authentique marocaine depuis 1998.',
  'Fondee par Chef Karim Benali, Dar Diyafa allie recettes traditionnelles marocaines et presentation contemporaine. Notre equipe de 30 professionnels sert plus de 200 evenements par an a Casablanca et dans tout le Maroc.',
  'Casablanca',
  '45 Rue Ibn Batouta, Quartier Gauthier, Casablanca 20000',
  33.5883, -7.6114,
  '+212522334455', 'contact@dardiyafa.ma', '+212661234567',
  'https://dardiyafa.ma', '@dar_diyafa', 'DarDiyafaCasa',
  ARRAY['moroccan', 'mediterranean', 'fusion'],
  ARRAY['couscous_royal', 'mechoui', 'pastilla', 'tajines', 'diffa'],
  ARRAY['wedding', 'corporate', 'ramadan_iftar', 'eid', 'birthday', 'engagement', 'henna'],
  ARRAY['buffet', 'plated', 'live_station', 'cocktail'],
  ARRAY['ar', 'fr', 'en'],
  20, 800,
  'premium',
  4.78, 53,
  'RC-CASA-123456', 'IF-987654321',
  true, true, true, 'pro',
  '{"defaultPaymentTemplate": "standard", "defaultLeadTimeDays": 5, "autoReplyEnabled": true, "autoReplyMessage": "Merci pour votre demande! Nous vous repondrons dans les 2 heures.", "currency": "MAD", "tvaEnabled": true, "tvaRate": 20}'::JSONB,
  203, 35, 76.50,
  'Dar Diyafa Traiteur Casablanca - Service Traiteur Mariage & Evenements',
  'Le meilleur traiteur a Casablanca pour mariages, galas et iftars. Cuisine marocaine authentique, service professionnel, devis gratuit.',
  '2024-03-15 10:00:00+00',
  '2024-01-01 10:00:00+00',
  NOW()
);

-- Org 2: Riad Al Baraka Catering — Traditional Marrakech caterer
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
  '22222222-2222-2222-2222-222222222222',
  'Riad Al Baraka Catering',
  'riad-al-baraka-marrakech',
  'caterer',
  'Riad Al Baraka incarne l''hospitalite marocaine authentique au coeur de la Medina de Marrakech. Specialise dans les diffas traditionnelles, les ceremonies de henne et les mariages dans les riads historiques.',
  'La famille El Mansouri accueille et nourrit les convives depuis trois generations. Notre cuisine perpectue les recettes ancestrales de Marrakech avec des ingredients frais du souk Semmarine et des epices de la place Rahba Kedima.',
  'Marrakech',
  '12 Derb Jdid, Bab Doukkala, Medina, Marrakech 40000',
  31.6340, -7.9956,
  '+212524389012', 'contact@riad-baraka.ma', '+212667890123',
  'https://riad-baraka.ma', '@riad_albaraka', 'RiadAlBarakaMarrakech',
  ARRAY['moroccan', 'traditional_berber'],
  ARRAY['tanjia_marrakchia', 'pastilla_pigeon', 'rfissa', 'seffa_medfouna', 'mechoui'],
  ARRAY['wedding', 'henna', 'diffa', 'engagement', 'eid', 'ramadan_iftar', 'birthday'],
  ARRAY['buffet', 'family_style', 'live_station'],
  ARRAY['ar', 'fr'],
  30, 400,
  'mid',
  4.65, 38,
  'RC-MARR-789012', 'IF-456789012',
  true, false, true, 'pro',
  '{"defaultPaymentTemplate": "standard", "defaultLeadTimeDays": 7, "autoReplyEnabled": false, "currency": "MAD", "tvaEnabled": false}'::JSONB,
  145, 60, 68.00,
  'Riad Al Baraka - Traiteur Traditionnel Marrakech',
  'Traiteur traditionnel a Marrakech: diffas, mariages dans les riads, hennas. Cuisine ancestrale marrakchie. Devis gratuit.',
  '2024-06-01 10:00:00+00',
  '2024-03-01 10:00:00+00',
  NOW()
);

-- Org 3: Atlas Gourmet Events — Modern Rabat caterer (corporate + conference)
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
  '33333333-3333-3333-3333-333333333333',
  'Atlas Gourmet Events',
  'atlas-gourmet-events-rabat',
  'caterer',
  'Atlas Gourmet Events est le traiteur de reference pour les evenements corporatifs et conferences a Rabat. Nous combinons gastronomie internationale et saveurs marocaines pour des prestations haut de gamme.',
  'Fondee par Nadia Chraibi, diplome en gestion hoteliere de l''ISIT Tanger, Atlas Gourmet sert les plus grandes entreprises et ambassades de la capitale. Notre cuisine fusion allie techniques francaises et ingredients marocains de terroir.',
  'Rabat',
  '8 Avenue Allal Ben Abdellah, Hassan, Rabat 10000',
  34.0209, -6.8416,
  '+212537456789', 'contact@atlas-gourmet.ma', '+212670123456',
  'https://atlas-gourmet.ma', '@atlas_gourmet_events', 'AtlasGourmetRabat',
  ARRAY['french', 'moroccan', 'international', 'fusion'],
  ARRAY['canapes', 'cocktail_dinatoire', 'brunch_executif', 'conference_lunch', 'gala_dinner'],
  ARRAY['corporate', 'conference', 'wedding', 'graduation', 'birthday'],
  ARRAY['plated', 'cocktail', 'buffet', 'boxed'],
  ARRAY['fr', 'en', 'ar'],
  15, 600,
  'premium',
  4.82, 29,
  'RC-RABAT-345678', 'IF-234567890',
  true, true, true, 'pro',
  '{"defaultPaymentTemplate": "corporate", "defaultLeadTimeDays": 3, "autoReplyEnabled": true, "autoReplyMessage": "Thank you for your inquiry. We will respond within 24 hours.", "currency": "MAD", "tvaEnabled": true, "tvaRate": 20}'::JSONB,
  92, 25, 81.30,
  'Atlas Gourmet Events Rabat - Corporate Catering & Fine Dining',
  'Premier corporate catering in Rabat: conferences, galas, embassy events. French-Moroccan fusion cuisine. Free quote.',
  '2024-08-01 10:00:00+00',
  '2024-04-01 10:00:00+00',
  NOW()
);


-- ══════════════════════════════════════════════════════════════════════════════
-- ORG MEMBERS
-- ══════════════════════════════════════════════════════════════════════════════

-- Dar Diyafa: Owner
INSERT INTO "public"."org_members" (
  "id", "org_id", "user_id", "role", "permissions", "is_active",
  "invited_by", "invited_at", "accepted_at", "created_at", "updated_at"
) VALUES (
  'aa111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  'org_owner',
  '{"all": true}'::JSONB,
  true, NULL,
  '2024-01-01 10:00:00+00', '2024-01-01 10:00:00+00',
  '2024-01-01 10:00:00+00', NOW()
);

-- Dar Diyafa: Admin
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
  '2024-01-15 10:00:00+00', '2024-01-15 12:00:00+00',
  '2024-01-15 10:00:00+00', NOW()
);

-- Dar Diyafa: Staff
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
  '2024-02-01 10:00:00+00', '2024-02-01 14:00:00+00',
  '2024-02-01 10:00:00+00', NOW()
);

-- Riad Al Baraka: Owner
INSERT INTO "public"."org_members" (
  "id", "org_id", "user_id", "role", "permissions", "is_active",
  "invited_by", "invited_at", "accepted_at", "created_at", "updated_at"
) VALUES (
  'aa444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'org_owner',
  '{"all": true}'::JSONB,
  true, NULL,
  '2024-03-01 10:00:00+00', '2024-03-01 10:00:00+00',
  '2024-03-01 10:00:00+00', NOW()
);

-- Atlas Gourmet Events: Owner
INSERT INTO "public"."org_members" (
  "id", "org_id", "user_id", "role", "permissions", "is_active",
  "invited_by", "invited_at", "accepted_at", "created_at", "updated_at"
) VALUES (
  'aa555555-5555-5555-5555-555555555555',
  '33333333-3333-3333-3333-333333333333',
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'org_owner',
  '{"all": true}'::JSONB,
  true, NULL,
  '2024-04-01 10:00:00+00', '2024-04-01 10:00:00+00',
  '2024-04-01 10:00:00+00', NOW()
);


-- ══════════════════════════════════════════════════════════════════════════════
-- CLIENT PROFILES (8 clients across 3 orgs)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."client_profiles" (
  "id", "org_id", "user_id", "name", "phone", "email", "city", "notes",
  "total_events", "total_spent", "created_at"
) VALUES
-- Dar Diyafa clients
(
  'cc111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Fatima El Amrani',
  '+212661112233',
  'fatima.elamrani@gmail.com',
  'Casablanca',
  'Clientele VIP. Mariage de sa fille en avril 2026. Famille connue dans le quartier Anfa. Prefere cuisine traditionnelle marocaine raffinee.',
  2, 12500000,
  '2024-06-01 10:00:00+00'
),
(
  'cc222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Mohamed Benkirane',
  '+212662334455',
  'm.benkirane@ocp.ma',
  'Rabat',
  'Coordinateur evenements OCP Group. Exige facturation avec TVA et RC. Client corporate regulier, 5 evenements depuis 2024.',
  5, 42500000,
  '2024-02-15 10:00:00+00'
),
(
  'cc333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'Khadija Tazi',
  '+212663556677',
  'khadija.tazi@gmail.com',
  'Casablanca',
  'Cliente fidele, 3eme evenement. Aime les presentations modernes avec touche traditionnelle. Paie toujours en avance.',
  3, 18000000,
  '2025-01-10 10:00:00+00'
),
(
  'cc444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'OCP Group (Dept. Communication)',
  '+212522789012',
  'events@ocp.ma',
  'Casablanca',
  'Compte corporate. Facturation 30 jours. Contact: Mohamed Benkirane. Budget approuve par la direction.',
  8, 75000000,
  '2024-01-20 10:00:00+00'
),
-- Riad Al Baraka clients
(
  'cc555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  NULL,
  'Aicha Belhaj',
  '+212668901234',
  'aicha.belhaj@yahoo.fr',
  'Marrakech',
  'Organisatrice de hennas et mariages traditionnels dans la Medina. Connait bien les riads. Prefere le style familial authentique.',
  4, 9600000,
  '2024-05-01 10:00:00+00'
),
(
  'cc666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  NULL,
  'Youssef Berrada',
  '+212669012345',
  'y.berrada@gmail.com',
  'Marrakech',
  'Proprietaire de riad boutique. Organise des diffas pour ses clients touristes. Veut de l''authentique avec presentation soignee.',
  2, 5400000,
  '2025-03-01 10:00:00+00'
),
-- Atlas Gourmet clients
(
  'cc777777-7777-7777-7777-777777777777',
  '33333333-3333-3333-3333-333333333333',
  NULL,
  'Ambassade de France au Maroc',
  '+212537678900',
  'evenements@ambafrance-ma.org',
  'Rabat',
  'Compte diplomatique. Evenements formels, respect strict du protocole. Menu bilingue FR/EN obligatoire. Facturation institutionnelle.',
  3, 54000000,
  '2024-06-01 10:00:00+00'
),
(
  'cc888888-8888-8888-8888-888888888888',
  '33333333-3333-3333-3333-333333333333',
  NULL,
  'Samir Idrissi',
  '+212670234567',
  'samir.idrissi@startup.ma',
  'Rabat',
  'CEO startup tech Rabat. Evenements team-building et lancement produit. Budget modere mais veut de la qualite. Paie par virement.',
  1, 3600000,
  '2026-01-15 10:00:00+00'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- LEGACY MENUS (base table compatibility)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."menus" (
  "id", "name", "user_id", "slug", "background_image_url", "city", "address",
  "is_published", "updated_at", "created_at", "contact_number", "currency"
) VALUES
(
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95a',
  'Dar Diyafa - Menu',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef',
  'dar-diyafa-casablanca-482910',
  NULL, 'Casablanca', '45 Rue Ibn Batouta, Quartier Gauthier',
  true, NOW(), '2024-01-01 10:00:00+00', '+212522334455', 'MAD'
),
(
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95b',
  'Riad Al Baraka - Menu',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'riad-baraka-marrakech-739201',
  NULL, 'Marrakech', '12 Derb Jdid, Bab Doukkala',
  true, NOW(), '2024-03-01 10:00:00+00', '+212524389012', 'MAD'
),
(
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95c',
  'Atlas Gourmet - Menu',
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'atlas-gourmet-rabat-156482',
  NULL, 'Rabat', '8 Avenue Allal Ben Abdellah',
  true, NOW(), '2024-04-01 10:00:00+00', '+212537456789', 'MAD'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- CATERING MENUS (9 menus across 3 orgs)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Dar Diyafa: 3 menus ──────────────────────────────────────────────────────

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
  'menu-mariage-royal-diyafa',
  'Notre menu mariage signature. Cuisine marocaine raffinee pour votre plus beau jour. Pastilla, mechoui, couscous royal et patisseries traditionnelles.',
  'wedding', 50, 800, 25000, 'MAD',
  'Casablanca', 'Casablanca, Rabat, Marrakech, Mohammedia, El Jadida',
  7, true, true,
  '+212522334455', 'mariage@dardiyafa.ma', '+212661234567', 'per_head',
  '{"delivery": true, "setup": true, "staffService": true, "equipmentRental": true, "cleanup": true}'::JSONB,
  'Menu Mariage Dar Diyafa Casablanca',
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
  'menu-corporate-diyafa',
  'Menus professionnels pour reunions, conferences et evenements d''entreprise. Options dejeuner, pause-cafe et cocktail dinatoire.',
  'corporate', 20, 300, 18000, 'MAD',
  'Casablanca', 'Grand Casablanca, Rabat-Sale-Kenitra',
  3, true, false,
  '+212522334455', 'corporate@dardiyafa.ma', '+212661234567', 'per_head',
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
  'menu-iftar-ramadan-diyafa',
  'Iftar traditionnel marocain: harira, chebakia, briouates, tajines et patisseries. Service traiteur pour vos iftars collectifs et familiaux.',
  'ramadan_iftar', 30, 500, 15000, 'MAD',
  'Casablanca', 'Casablanca, Mohammedia',
  2, true, true,
  '+212522334455', 'iftar@dardiyafa.ma', '+212661234567', 'per_head',
  '{"delivery": true, "setup": true, "staffService": false, "equipmentRental": false, "cleanup": false}'::JSONB,
  '2024-03-01 10:00:00+00'
);

-- ── Riad Al Baraka: 3 menus ─────────────────────────────────────────────────

-- Traditional Wedding / Diffa
INSERT INTO "public"."catering_menus" (
  "id", "user_id", "menu_id", "org_id", "name", "slug", "description",
  "event_type", "min_guests", "max_guests", "base_price_per_person", "currency",
  "city", "service_area", "lead_time_days", "is_published", "is_featured",
  "contact_phone", "contact_email", "whatsapp_number", "menu_type",
  "service_options", "created_at"
) VALUES (
  'dd444444-4444-4444-4444-444444444444',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95b',
  '22222222-2222-2222-2222-222222222222',
  'Diffa Traditionnelle Marrakchia',
  'diffa-traditionnelle-baraka',
  'La veritable diffa marrakchie: tanjia, pastilla au pigeon, mechoui, rfissa, seffa medfouna. Cuisine ancestrale servie dans les regles de l''art.',
  'wedding', 30, 400, 20000, 'MAD',
  'Marrakech', 'Marrakech, Ouarzazate, Essaouira',
  10, true, true,
  '+212524389012', 'diffa@riad-baraka.ma', '+212667890123', 'per_head',
  '{"delivery": true, "setup": true, "staffService": true, "equipmentRental": true, "cleanup": true}'::JSONB,
  '2024-04-01 10:00:00+00'
);

-- Henna Night Menu
INSERT INTO "public"."catering_menus" (
  "id", "user_id", "menu_id", "org_id", "name", "slug", "description",
  "event_type", "min_guests", "max_guests", "base_price_per_person", "currency",
  "city", "service_area", "lead_time_days", "is_published", "is_featured",
  "contact_phone", "contact_email", "whatsapp_number", "menu_type",
  "service_options", "created_at"
) VALUES (
  'dd555555-5555-5555-5555-555555555555',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95b',
  '22222222-2222-2222-2222-222222222222',
  'Soiree Henne Traditionnel',
  'soiree-henne-baraka',
  'Menu special soiree henne: the a la menthe, petits fours marocains, cornes de gazelle, lait aux amandes, fruits secs. Ambiance intime et chaleureuse.',
  'henna', 20, 150, 12000, 'MAD',
  'Marrakech', 'Marrakech',
  5, true, false,
  '+212524389012', 'henne@riad-baraka.ma', '+212667890123', 'per_head',
  '{"delivery": true, "setup": true, "staffService": true, "equipmentRental": false, "cleanup": false}'::JSONB,
  '2024-05-01 10:00:00+00'
);

-- Ramadan Iftar Marrakech
INSERT INTO "public"."catering_menus" (
  "id", "user_id", "menu_id", "org_id", "name", "slug", "description",
  "event_type", "min_guests", "max_guests", "base_price_per_person", "currency",
  "city", "service_area", "lead_time_days", "is_published", "is_featured",
  "contact_phone", "contact_email", "whatsapp_number", "menu_type",
  "service_options", "created_at"
) VALUES (
  'dd666666-6666-6666-6666-666666666666',
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95b',
  '22222222-2222-2222-2222-222222222222',
  'Iftar Marrakchi',
  'iftar-marrakchi-baraka',
  'Iftar dans la pure tradition marrakchie: harira beldia, chebbakia maison, sellou, briouates, tajine de veau aux pruneaux.',
  'ramadan_iftar', 20, 200, 13000, 'MAD',
  'Marrakech', 'Marrakech, Tamansourt',
  3, true, true,
  '+212524389012', 'iftar@riad-baraka.ma', '+212667890123', 'per_head',
  '{"delivery": true, "setup": false, "staffService": false, "equipmentRental": false, "cleanup": false}'::JSONB,
  '2024-06-01 10:00:00+00'
);

-- ── Atlas Gourmet: 3 menus ──────────────────────────────────────────────────

-- Corporate Conference Menu
INSERT INTO "public"."catering_menus" (
  "id", "user_id", "menu_id", "org_id", "name", "slug", "description",
  "event_type", "min_guests", "max_guests", "base_price_per_person", "currency",
  "city", "service_area", "lead_time_days", "is_published", "is_featured",
  "contact_phone", "contact_email", "whatsapp_number", "menu_type",
  "service_options", "created_at"
) VALUES (
  'dd777777-7777-7777-7777-777777777777',
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95c',
  '33333333-3333-3333-3333-333333333333',
  'Conference & Seminaire Premium',
  'conference-premium-atlas',
  'Formule conference complete: pause-cafe gourmande, dejeuner 3 services, pause apres-midi. Cuisine fusion franco-marocaine avec presentation soignee.',
  'conference', 15, 400, 22000, 'MAD',
  'Rabat', 'Rabat, Sale, Kenitra, Temara',
  3, true, true,
  '+212537456789', 'conference@atlas-gourmet.ma', '+212670123456', 'per_head',
  '{"delivery": true, "setup": true, "staffService": true, "equipmentRental": true, "cleanup": true}'::JSONB,
  '2024-05-01 10:00:00+00'
);

-- Cocktail Dinatoire Menu
INSERT INTO "public"."catering_menus" (
  "id", "user_id", "menu_id", "org_id", "name", "slug", "description",
  "event_type", "min_guests", "max_guests", "base_price_per_person", "currency",
  "city", "service_area", "lead_time_days", "is_published", "is_featured",
  "contact_phone", "contact_email", "whatsapp_number", "menu_type",
  "service_options", "created_at"
) VALUES (
  'dd888888-8888-8888-8888-888888888888',
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95c',
  '33333333-3333-3333-3333-333333333333',
  'Cocktail Dinatoire Prestige',
  'cocktail-prestige-atlas',
  'Canapes raffines, bouchees fusion, mini-tajines, verrine de gaspacho, plateau de fromages. Service volant avec presentation artistique.',
  'corporate', 30, 300, 28000, 'MAD',
  'Rabat', 'Rabat, Sale, Casablanca',
  5, true, false,
  '+212537456789', 'cocktail@atlas-gourmet.ma', '+212670123456', 'per_head',
  '{"delivery": true, "setup": true, "staffService": true, "equipmentRental": true, "cleanup": true}'::JSONB,
  '2024-06-01 10:00:00+00'
);

-- Gala Dinner Menu
INSERT INTO "public"."catering_menus" (
  "id", "user_id", "menu_id", "org_id", "name", "slug", "description",
  "event_type", "min_guests", "max_guests", "base_price_per_person", "currency",
  "city", "service_area", "lead_time_days", "is_published", "is_featured",
  "contact_phone", "contact_email", "whatsapp_number", "menu_type",
  "service_options", "created_at"
) VALUES (
  'dd999999-9999-9999-9999-999999999999',
  'd4e5f6a7-b8c9-0123-defa-234567890123',
  'dce57fbd-29dc-47a2-9a45-3a0dcc10c95c',
  '33333333-3333-3333-3333-333333333333',
  'Diner de Gala',
  'diner-gala-atlas',
  'Menu gastronomique 5 services pour soirees de prestige: amuse-bouche, entree, poisson, viande, dessert. Accords mets et boissons.',
  'corporate', 40, 250, 45000, 'MAD',
  'Rabat', 'Rabat, Casablanca',
  7, true, true,
  '+212537456789', 'gala@atlas-gourmet.ma', '+212670123456', 'per_head',
  '{"delivery": true, "setup": true, "staffService": true, "equipmentRental": true, "cleanup": true}'::JSONB,
  '2024-07-01 10:00:00+00'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- CATERING CATEGORIES
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Dar Diyafa Wedding Menu categories ──────────────────────────────────────
INSERT INTO "public"."catering_categories" ("id", "catering_menu_id", "name", "description", "sort_order", "is_optional", "created_at") VALUES
  ('cat11111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111111', 'Entrees & Salades', 'Assortiment d''entrees marocaines traditionnelles', 1, false, NOW()),
  ('cat22222-2222-2222-2222-222222222222', 'dd111111-1111-1111-1111-111111111111', 'Plats Principaux', 'Tajines, couscous et mechoui', 2, false, NOW()),
  ('cat33333-3333-3333-3333-333333333333', 'dd111111-1111-1111-1111-111111111111', 'Desserts & Patisseries', 'Patisseries marocaines et desserts', 3, false, NOW()),
  ('cat44444-4444-4444-4444-444444444444', 'dd111111-1111-1111-1111-111111111111', 'Boissons', 'The a la menthe, jus frais et boissons', 4, false, NOW()),
  ('cat55555-5555-5555-5555-555555555555', 'dd111111-1111-1111-1111-111111111111', 'Stations Live', 'Stations de cuisine en direct', 5, true, NOW());

-- ── Dar Diyafa Corporate Menu categories ────────────────────────────────────
INSERT INTO "public"."catering_categories" ("id", "catering_menu_id", "name", "description", "sort_order", "is_optional", "created_at") VALUES
  ('cat66666-6666-6666-6666-666666666666', 'dd222222-2222-2222-2222-222222222222', 'Pause-Cafe', 'Viennoiseries et boissons chaudes', 1, false, NOW()),
  ('cat77777-7777-7777-7777-777777777777', 'dd222222-2222-2222-2222-222222222222', 'Dejeuner', 'Plats principaux pour dejeuner d''affaires', 2, false, NOW()),
  ('cat88888-8888-8888-8888-888888888888', 'dd222222-2222-2222-2222-222222222222', 'Cocktail Dinatoire', 'Bouchees et mini-portions', 3, true, NOW());

-- ── Dar Diyafa Iftar Menu categories ────────────────────────────────────────
INSERT INTO "public"."catering_categories" ("id", "catering_menu_id", "name", "description", "sort_order", "is_optional", "created_at") VALUES
  ('cat99999-9999-9999-9999-999999999999', 'dd333333-3333-3333-3333-333333333333', 'Soupe & Casse-Croute', 'Harira, dates, chebakia pour la rupture du jeune', 1, false, NOW()),
  ('cataaa00-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dd333333-3333-3333-3333-333333333333', 'Plats Iftar', 'Tajines et grillades traditionnels', 2, false, NOW()),
  ('catbbb00-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dd333333-3333-3333-3333-333333333333', 'Patisseries Ramadan', 'Chebakia, sellou, briouates au miel', 3, false, NOW());

-- ── Riad Al Baraka Diffa categories ─────────────────────────────────────────
INSERT INTO "public"."catering_categories" ("id", "catering_menu_id", "name", "description", "sort_order", "is_optional", "created_at") VALUES
  ('catcc100-cccc-cccc-cccc-cccccccccccc', 'dd444444-4444-4444-4444-444444444444', 'Ouverture & Entrees', 'Lait aux amandes, dates medjool, briouates', 1, false, NOW()),
  ('catcc200-cccc-cccc-cccc-cccccccccccc', 'dd444444-4444-4444-4444-444444444444', 'Plats de Resistance', 'Tanjia, mechoui, couscous, pastilla', 2, false, NOW()),
  ('catcc300-cccc-cccc-cccc-cccccccccccc', 'dd444444-4444-4444-4444-444444444444', 'Douceurs & The', 'Patisseries, fruits, the a la menthe', 3, false, NOW());

-- ── Atlas Gourmet Conference categories ─────────────────────────────────────
INSERT INTO "public"."catering_categories" ("id", "catering_menu_id", "name", "description", "sort_order", "is_optional", "created_at") VALUES
  ('catdd100-dddd-dddd-dddd-dddddddddddd', 'dd777777-7777-7777-7777-777777777777', 'Accueil & Pause Matin', 'Cafe, viennoiseries, jus frais', 1, false, NOW()),
  ('catdd200-dddd-dddd-dddd-dddddddddddd', 'dd777777-7777-7777-7777-777777777777', 'Dejeuner 3 Services', 'Entree, plat, dessert gastronomiques', 2, false, NOW()),
  ('catdd300-dddd-dddd-dddd-dddddddddddd', 'dd777777-7777-7777-7777-777777777777', 'Pause Apres-Midi', 'Patisseries fines et boissons', 3, false, NOW());


-- ══════════════════════════════════════════════════════════════════════════════
-- CATERING ITEMS
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Dar Diyafa Wedding: Entrees ─────────────────────────────────────────────
INSERT INTO "public"."catering_items" (
  "id", "catering_category_id", "catering_menu_id", "name", "description",
  "price_per_person", "price_per_unit", "unit_label", "serves_count",
  "is_vegetarian", "is_vegan", "is_halal", "is_gluten_free", "allergens",
  "sort_order", "is_available", "created_at"
) VALUES
(
  'item1111-1111-1111-1111-111111111111',
  'cat11111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111111',
  'Pastilla au Poulet',
  'Pastilla feuilletee au poulet, amandes et cannelle, saupoudree de sucre glace',
  NULL, 45000, 'par pastilla', 10,
  false, false, true, false, ARRAY['nuts', 'gluten'],
  1, true, NOW()
),
(
  'item2222-2222-2222-2222-222222222222',
  'cat11111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111111',
  'Briouates aux Crevettes',
  'Feuillete croustillant farci aux crevettes, herbes fraiches et epices',
  2500, NULL, NULL, NULL,
  false, false, true, false, ARRAY['shellfish', 'gluten'],
  2, true, NOW()
),
(
  'item3333-3333-3333-3333-333333333333',
  'cat11111-1111-1111-1111-111111111111', 'dd111111-1111-1111-1111-111111111111',
  'Salade Marocaine Composee',
  'Assortiment de 7 salades: zaalouk, taktouka, carotte epicee, betterave, poivrons grilles, concombre menthe, tomate oignon',
  1800, NULL, NULL, NULL,
  true, true, true, true, ARRAY[]::TEXT[],
  3, true, NOW()
),
-- ── Dar Diyafa Wedding: Plats Principaux ────────────────────────────────────
(
  'item4444-4444-4444-4444-444444444444',
  'cat22222-2222-2222-2222-222222222222', 'dd111111-1111-1111-1111-111111111111',
  'Mechoui Entier',
  'Agneau entier roti lentement aux epices traditionnelles, servi avec cumin et sel',
  NULL, 350000, 'par agneau', 20,
  false, false, true, true, ARRAY[]::TEXT[],
  1, true, NOW()
),
(
  'item5555-5555-5555-5555-555555555555',
  'cat22222-2222-2222-2222-222222222222', 'dd111111-1111-1111-1111-111111111111',
  'Couscous Royal 7 Legumes',
  'Couscous traditionnel aux 7 legumes, poulet fermier, agneau et merguez',
  4500, NULL, NULL, NULL,
  false, false, true, true, ARRAY[]::TEXT[],
  2, true, NOW()
),
(
  'item6666-6666-6666-6666-666666666666',
  'cat22222-2222-2222-2222-222222222222', 'dd111111-1111-1111-1111-111111111111',
  'Tajine aux Pruneaux et Amandes',
  'Tajine d''agneau aux pruneaux, amandes caramelisees et graines de sesame',
  3500, NULL, NULL, NULL,
  false, false, true, true, ARRAY['nuts'],
  3, true, NOW()
),
-- ── Dar Diyafa Wedding: Desserts ────────────────────────────────────────────
(
  'item7777-7777-7777-7777-777777777777',
  'cat33333-3333-3333-3333-333333333333', 'dd111111-1111-1111-1111-111111111111',
  'Assortiment Patisseries Marocaines',
  'Cornes de gazelle, makrout, ghriba, fekkas, briouates au miel — 8 varietes',
  3000, NULL, NULL, NULL,
  true, false, true, false, ARRAY['nuts', 'gluten'],
  1, true, NOW()
),
(
  'item8888-8888-8888-8888-888888888888',
  'cat33333-3333-3333-3333-333333333333', 'dd111111-1111-1111-1111-111111111111',
  'Piece Montee Traditionnelle',
  'Piece montee aux amandes et miel, decoree de fleurs en sucre et feuille d''or',
  NULL, 250000, 'par piece', 50,
  true, false, true, false, ARRAY['nuts', 'gluten'],
  2, true, NOW()
),
-- ── Dar Diyafa Wedding: Boissons ────────────────────────────────────────────
(
  'item9999-9999-9999-9999-999999999999',
  'cat44444-4444-4444-4444-444444444444', 'dd111111-1111-1111-1111-111111111111',
  'The a la Menthe Service Traditionnel',
  'The vert a la menthe fraiche, verse a la marocaine depuis la hauteur',
  800, NULL, NULL, NULL,
  true, true, true, true, ARRAY[]::TEXT[],
  1, true, NOW()
),
(
  'itemaaa0-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'cat44444-4444-4444-4444-444444444444', 'dd111111-1111-1111-1111-111111111111',
  'Jus d''Orange Frais du Souss',
  'Jus d''oranges pressees de la region du Souss',
  600, NULL, NULL, NULL,
  true, true, true, true, ARRAY[]::TEXT[],
  2, true, NOW()
),
-- ── Dar Diyafa Wedding: Live Stations ───────────────────────────────────────
(
  'itembbb0-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cat55555-5555-5555-5555-555555555555', 'dd111111-1111-1111-1111-111111111111',
  'Station Tanjia Live',
  'Tanjia preparee en direct devant les invites, cuite dans le four traditionnel du hammam',
  NULL, 250000, 'par station', 30,
  false, false, true, true, ARRAY[]::TEXT[],
  1, true, NOW()
),
-- ── Riad Al Baraka Diffa: Plats ─────────────────────────────────────────────
(
  'itemcc10-cccc-cccc-cccc-cccccccccccc',
  'catcc100-cccc-cccc-cccc-cccccccccccc', 'dd444444-4444-4444-4444-444444444444',
  'Lait aux Amandes & Dates Medjool',
  'Lait chaud aux amandes parfume a la fleur d''oranger, dates medjool du Tafilalet',
  1200, NULL, NULL, NULL,
  true, false, true, true, ARRAY['nuts', 'dairy'],
  1, true, NOW()
),
(
  'itemcc20-cccc-cccc-cccc-cccccccccccc',
  'catcc200-cccc-cccc-cccc-cccccccccccc', 'dd444444-4444-4444-4444-444444444444',
  'Tanjia Marrakchia',
  'La veritable tanjia: jarret de veau confite 12 heures avec ras el hanout, safran, citron confit et olives violettes',
  3800, NULL, NULL, NULL,
  false, false, true, true, ARRAY[]::TEXT[],
  1, true, NOW()
),
(
  'itemcc30-cccc-cccc-cccc-cccccccccccc',
  'catcc200-cccc-cccc-cccc-cccccccccccc', 'dd444444-4444-4444-4444-444444444444',
  'Pastilla au Pigeon Beldi',
  'Pastilla traditionnelle au pigeon fermier, amandes torrees, cannelle et sucre glace',
  NULL, 55000, 'par pastilla', 8,
  false, false, true, false, ARRAY['nuts', 'gluten'],
  2, true, NOW()
),
(
  'itemcc40-cccc-cccc-cccc-cccccccccccc',
  'catcc200-cccc-cccc-cccc-cccccccccccc', 'dd444444-4444-4444-4444-444444444444',
  'Rfissa au Poulet Beldi',
  'Rfissa traditionnelle: msemen effeuillee, poulet beldi, lentilles, fenugrec et bouillon parfume',
  2800, NULL, NULL, NULL,
  false, false, true, false, ARRAY['gluten'],
  3, true, NOW()
),
(
  'itemcc50-cccc-cccc-cccc-cccccccccccc',
  'catcc300-cccc-cccc-cccc-cccccccccccc', 'dd444444-4444-4444-4444-444444444444',
  'Seffa Medfouna',
  'Seffa sucree aux vermicelles fins, cannelle et amandes, cache sous un poulet dore',
  3200, NULL, NULL, NULL,
  false, false, true, false, ARRAY['nuts', 'gluten'],
  1, true, NOW()
),
-- ── Atlas Gourmet Conference: Items ─────────────────────────────────────────
(
  'itemdd10-dddd-dddd-dddd-dddddddddddd',
  'catdd100-dddd-dddd-dddd-dddddddddddd', 'dd777777-7777-7777-7777-777777777777',
  'Viennoiseries Assorties',
  'Croissants au beurre, pains au chocolat, mini brioches, muffins aux myrtilles',
  2000, NULL, NULL, NULL,
  true, false, true, false, ARRAY['gluten', 'dairy'],
  1, true, NOW()
),
(
  'itemdd20-dddd-dddd-dddd-dddddddddddd',
  'catdd100-dddd-dddd-dddd-dddddddddddd', 'dd777777-7777-7777-7777-777777777777',
  'Cafe, The & Jus Frais',
  'Cafe nespresso, selection de thes, jus d''orange presse, eau minerale Sidi Ali',
  1500, NULL, NULL, NULL,
  true, true, true, true, ARRAY[]::TEXT[],
  2, true, NOW()
),
(
  'itemdd30-dddd-dddd-dddd-dddddddddddd',
  'catdd200-dddd-dddd-dddd-dddddddddddd', 'dd777777-7777-7777-7777-777777777777',
  'Salade Nicoisse Revisitee',
  'Thon mi-cuit, oeuf mollet, haricots verts, olives de Meknes, vinaigrette aux agrumes',
  3500, NULL, NULL, NULL,
  false, false, true, true, ARRAY['fish', 'eggs'],
  1, true, NOW()
),
(
  'itemdd40-dddd-dddd-dddd-dddddddddddd',
  'catdd200-dddd-dddd-dddd-dddddddddddd', 'dd777777-7777-7777-7777-777777777777',
  'Filet de Merou Chermoula',
  'Filet de merou roti, chermoula au citron confit, ecrasee de pommes de terre safranees',
  6500, NULL, NULL, NULL,
  false, false, true, true, ARRAY['fish'],
  2, true, NOW()
),
(
  'itemdd50-dddd-dddd-dddd-dddddddddddd',
  'catdd300-dddd-dddd-dddd-dddddddddddd', 'dd777777-7777-7777-7777-777777777777',
  'Creme Brulee Fleur d''Oranger',
  'Creme brulee parfumee a la fleur d''oranger, tuile aux amandes',
  3000, NULL, NULL, NULL,
  true, false, true, true, ARRAY['dairy', 'eggs', 'nuts'],
  1, true, NOW()
);


-- ══════════════════════════════════════════════════════════════════════════════
-- CATERING PACKAGES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."catering_packages" (
  "id", "catering_menu_id", "name", "description", "price_per_person",
  "min_guests", "max_guests", "is_featured", "sort_order", "includes_text", "created_at"
) VALUES
(
  'pkg11111-1111-1111-1111-111111111111',
  'dd111111-1111-1111-1111-111111111111',
  'Forfait Mariage Or',
  'Notre forfait mariage signature avec service complet',
  25000, 100, 500, true, 1,
  '3 entrees au choix + 2 plats principaux + desserts + boissons + service staff',
  NOW()
),
(
  'pkg22222-2222-2222-2222-222222222222',
  'dd111111-1111-1111-1111-111111111111',
  'Forfait Mariage Diamant',
  'Le summum du luxe pour votre mariage. Menu complet avec stations live et piece montee.',
  40000, 50, 300, true, 2,
  '5 entrees + mechoui + 3 plats + station live + patisseries + piece montee + boissons + service VIP',
  NOW()
),
(
  'pkg33333-3333-3333-3333-333333333333',
  'dd222222-2222-2222-2222-222222222222',
  'Dejeuner Business',
  'Menu dejeuner d''affaires complet avec pauses cafe',
  18000, 20, 150, true, 1,
  'Pause-cafe matin + dejeuner 3 services + boissons',
  NOW()
),
(
  'pkg44444-4444-4444-4444-444444444444',
  'dd444444-4444-4444-4444-444444444444',
  'Diffa Complecte Marrakchia',
  'L''experience diffa authentique de Marrakech avec tous les plats traditionnels',
  20000, 30, 200, true, 1,
  'Lait amandes + tanjia + pastilla + rfissa + seffa + patisseries + the',
  NOW()
),
(
  'pkg55555-5555-5555-5555-555555555555',
  'dd777777-7777-7777-7777-777777777777',
  'Journee Conference Premium',
  'Formule complete pour une journee de conference: 2 pauses + dejeuner gastronomique',
  22000, 15, 400, true, 1,
  'Accueil cafe + pause matin + dejeuner 3 services + pause apres-midi + boissons illimitees',
  NOW()
);


-- ══════════════════════════════════════════════════════════════════════════════
-- PACKAGE ITEMS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."catering_package_items" ("id", "package_id", "item_id", "category_id", "is_included", "max_selections") VALUES
  ('pi111111-1111-1111-1111-111111111111', 'pkg11111-1111-1111-1111-111111111111', 'item1111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', true, 3),
  ('pi222222-2222-2222-2222-222222222222', 'pkg11111-1111-1111-1111-111111111111', 'item2222-2222-2222-2222-222222222222', 'cat11111-1111-1111-1111-111111111111', true, 3),
  ('pi333333-3333-3333-3333-333333333333', 'pkg11111-1111-1111-1111-111111111111', 'item3333-3333-3333-3333-333333333333', 'cat11111-1111-1111-1111-111111111111', true, 3),
  ('pi444444-4444-4444-4444-444444444444', 'pkg11111-1111-1111-1111-111111111111', 'item5555-5555-5555-5555-555555555555', 'cat22222-2222-2222-2222-222222222222', true, 2),
  ('pi555555-5555-5555-5555-555555555555', 'pkg11111-1111-1111-1111-111111111111', 'item6666-6666-6666-6666-666666666666', 'cat22222-2222-2222-2222-222222222222', true, 2),
  ('pi666666-6666-6666-6666-666666666666', 'pkg11111-1111-1111-1111-111111111111', 'item7777-7777-7777-7777-777777777777', 'cat33333-3333-3333-3333-333333333333', true, NULL),
  ('pi777777-7777-7777-7777-777777777777', 'pkg11111-1111-1111-1111-111111111111', 'item9999-9999-9999-9999-999999999999', 'cat44444-4444-4444-4444-444444444444', true, NULL),
  ('pi888888-8888-8888-8888-888888888888', 'pkg11111-1111-1111-1111-111111111111', 'itemaaa0-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cat44444-4444-4444-4444-444444444444', true, NULL);


-- ══════════════════════════════════════════════════════════════════════════════
-- CATERING THEMES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."catering_themes" (
  "id", "catering_menu_id",
  "primary_color", "secondary_color", "background_color", "surface_color",
  "text_color", "accent_color", "heading_font", "body_font",
  "layout_style", "card_style", "border_radius", "header_style", "custom_css"
) VALUES
(
  'theme111-1111-1111-1111-111111111111',
  'dd111111-1111-1111-1111-111111111111',
  '#8B4513', '#D4A574', '#FFF8F0', '#FFFFFF',
  '#2C1810', '#C17F3E', 'Playfair Display', 'Lora',
  'elegant', 'elevated', 'medium', 'banner', ''
),
(
  'theme222-2222-2222-2222-222222222222',
  'dd444444-4444-4444-4444-444444444444',
  '#B5651D', '#E8C37E', '#FEF5E7', '#FFFFFF',
  '#3B1F0B', '#D4A017', 'Amiri', 'Noto Sans Arabic',
  'traditional', 'flat', 'small', 'full_width', ''
),
(
  'theme333-3333-3333-3333-333333333333',
  'dd777777-7777-7777-7777-777777777777',
  '#1A365D', '#2B6CB0', '#F7FAFC', '#FFFFFF',
  '#1A202C', '#3182CE', 'Inter', 'Inter',
  'modern', 'bordered', 'large', 'minimal', ''
);


-- ══════════════════════════════════════════════════════════════════════════════
-- EVENTS (10 events across 3 orgs, various statuses)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Dar Diyafa Events ────────────────────────────────────────────────────────

-- Event 1: El Amrani Wedding — confirmed, upcoming
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
  'cc111111-1111-1111-1111-111111111111',
  'confirmed', 'wedding',
  'Mariage El Amrani-Alaoui',
  '2026-04-18', '19:00', '02:00', 200,
  'Salle des Fetes Al Mounia',
  '123 Boulevard Zerktouni, Maarif, Casablanca',
  'Casablanca', 33.5950, -7.6187,
  'Fatima El Amrani', '+212661112233', 'fatima.elamrani@gmail.com',
  'buffet',
  'Tout halal. 8 invites vegetariens. 2 allergies aux noix.',
  'Decoration or et ivoire. Station tanjia live pour l''entree de la mariee. Piece montee 3 etages avec fleurs fraiches.',
  5000000, 1500000, 3500000, 'MAD',
  'whatsapp',
  'dd111111-1111-1111-1111-111111111111',
  'pkg11111-1111-1111-1111-111111111111',
  'Famille El Amrani connue a Anfa. Excellente opportunite portfolio. 2eme evenement avec nous.',
  '2026-01-20 10:00:00+00'
);

-- Event 2: OCP Corporate Gala — completed, settled
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "event_end_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "special_requests",
  "total_amount", "deposit_amount", "balance_due", "currency",
  "source", "catering_menu_id", "package_id",
  "internal_notes", "created_at"
) VALUES (
  'ev222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'cc444444-4444-4444-4444-444444444444',
  'settled', 'corporate',
  'Gala Annuel OCP Group 2025',
  '2025-11-15', '19:30', '23:00', 150,
  'Hotel Hyatt Regency Casablanca',
  'Place des Nations Unies, Casablanca',
  'Casablanca',
  'Mohamed Benkirane', '+212662334455', 'm.benkirane@ocp.ma',
  'plated',
  'Diner assis 4 services. Facturation avec TVA et ICE obligatoire. Menu bilingue FR/EN.',
  2700000, 2700000, 0, 'MAD',
  'direct',
  'dd222222-2222-2222-2222-222222222222',
  'pkg33333-3333-3333-3333-333333333333',
  'Client corporate VIP. 5eme evenement. Paiement net 30 jours par virement.',
  '2025-09-01 10:00:00+00'
);

-- Event 3: Benkirane Engagement — quote_sent
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "event_end_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "special_requests",
  "total_amount", "currency",
  "budget_min", "budget_max",
  "source", "catering_menu_id",
  "created_at"
) VALUES (
  'ev333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'cc333333-3333-3333-3333-333333333333',
  'quote_sent', 'engagement',
  'Fiancailles Tazi-Benjelloun',
  '2026-05-10', '20:00', '00:00', 80,
  'Riad Dar Tazi',
  '15 Rue Tarik Ibn Ziad, Anfa, Casablanca',
  'Casablanca',
  'Khadija Tazi', '+212663556677', 'khadija.tazi@gmail.com',
  'cocktail',
  'Cocktail dinatoire elegant. Canapes raffines. Pas de mechoui. The a la menthe en fontaine.',
  1800000, 'MAD',
  15000, 25000,
  'referral',
  'dd111111-1111-1111-1111-111111111111',
  '2026-02-15 10:00:00+00'
);

-- Event 4: Ramadan Iftar — deposit_received
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "special_requests",
  "total_amount", "deposit_amount", "balance_due", "currency",
  "source", "catering_menu_id",
  "created_at"
) VALUES (
  'ev444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'cc222222-2222-2222-2222-222222222222',
  'deposit_received', 'ramadan_iftar',
  'Iftar Entreprise Benkirane 2026',
  '2026-03-15', '18:30', 300,
  'Salle des Conferences OCP',
  'Route d''El Jadida, Casablanca',
  'Casablanca',
  'Mohamed Benkirane', '+212662334455', 'm.benkirane@ocp.ma',
  'buffet',
  'Harira obligatoire. Chebakia traditionnelle maison. Sellou et briouates au miel. Dates Medjool.',
  4500000, 1350000, 3150000, 'MAD',
  'direct',
  'dd333333-3333-3333-3333-333333333333',
  '2026-02-05 10:00:00+00'
);

-- Event 5: Inquiry — just came in
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "guest_count",
  "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style",
  "currency", "budget_min", "budget_max",
  "source",
  "created_at"
) VALUES (
  'ev555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'inquiry', 'birthday',
  'Anniversaire 50 ans',
  '2026-06-20', 60,
  'Casablanca',
  'Rachid Ouazzani', '+212665778899', 'r.ouazzani@gmail.com',
  'buffet',
  'MAD', 10000, 15000,
  'whatsapp',
  '2026-02-22 08:00:00+00'
);

-- ── Riad Al Baraka Events ────────────────────────────────────────────────────

-- Event 6: Traditional Wedding in Riad — confirmed
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "event_end_time", "guest_count",
  "venue_name", "venue_address", "venue_city", "venue_lat", "venue_lng",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "special_requests",
  "total_amount", "deposit_amount", "balance_due", "currency",
  "source", "catering_menu_id", "package_id",
  "internal_notes", "created_at"
) VALUES (
  'ev666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  'cc555555-5555-5555-5555-555555555555',
  'confirmed', 'wedding',
  'Mariage Belhaj-Ouardi au Riad Yacout',
  '2026-05-02', '20:00', '03:00', 120,
  'Riad Yacout',
  '79 Derb Sidi Ahmed Soussi, Arset Ihiri, Medina, Marrakech',
  'Marrakech', 31.6310, -7.9889,
  'Aicha Belhaj', '+212668901234', 'aicha.belhaj@yahoo.fr',
  'family_style',
  'Service a la marrakchia: plats au centre, convives assis sur des banquettes. Neggafas prevues. Musique andalouse.',
  2400000, 720000, 1680000, 'MAD',
  'phone',
  'dd444444-4444-4444-4444-444444444444',
  'pkg44444-4444-4444-4444-444444444444',
  '4eme evenement avec cette cliente. Connait bien le Riad Yacout. Tres exigeante sur la tanjia.',
  '2026-01-10 10:00:00+00'
);

-- Event 7: Henna Night — in_preparation
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "event_end_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "special_requests",
  "total_amount", "deposit_amount", "balance_due", "currency",
  "source", "catering_menu_id",
  "created_at"
) VALUES (
  'ev777777-7777-7777-7777-777777777777',
  '22222222-2222-2222-2222-222222222222',
  'cc555555-5555-5555-5555-555555555555',
  'in_preparation', 'henna',
  'Henne Belhaj - Veille du Mariage',
  '2026-05-01', '21:00', '01:00', 60,
  'Riad Yacout',
  '79 Derb Sidi Ahmed Soussi, Medina, Marrakech',
  'Marrakech',
  'Aicha Belhaj', '+212668901234', 'aicha.belhaj@yahoo.fr',
  'family_style',
  'Menu henne: the, petits fours, cornes de gazelle, lait amandes. Pas de plats chauds.',
  720000, 360000, 360000, 'MAD',
  'phone',
  'dd555555-5555-5555-5555-555555555555',
  '2026-01-10 10:00:00+00'
);

-- Event 8: Completed Diffa — settled
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style",
  "total_amount", "deposit_amount", "balance_due", "currency",
  "source", "catering_menu_id",
  "created_at"
) VALUES (
  'ev888888-8888-8888-8888-888888888888',
  '22222222-2222-2222-2222-222222222222',
  'cc666666-6666-6666-6666-666666666666',
  'settled', 'diffa',
  'Diffa Riad Berrada — Touristes VIP',
  '2025-12-20', '20:00', 40,
  'Riad Berrada Boutique',
  '5 Derb Lalla Azzouna, Medina, Marrakech',
  'Marrakech',
  'Youssef Berrada', '+212669012345', 'y.berrada@gmail.com',
  'family_style',
  1600000, 1600000, 0, 'MAD',
  'direct',
  'dd444444-4444-4444-4444-444444444444',
  '2025-11-01 10:00:00+00'
);

-- ── Atlas Gourmet Events ─────────────────────────────────────────────────────

-- Event 9: Embassy Reception — confirmed
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "event_end_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "special_requests",
  "total_amount", "deposit_amount", "balance_due", "currency",
  "source", "catering_menu_id", "package_id",
  "internal_notes", "created_at"
) VALUES (
  'ev999999-9999-9999-9999-999999999999',
  '33333333-3333-3333-3333-333333333333',
  'cc777777-7777-7777-7777-777777777777',
  'confirmed', 'corporate',
  'Reception Fete Nationale — Ambassade de France',
  '2026-07-14', '19:00', '23:00', 180,
  'Residence de l''Ambassadeur',
  'Avenue Mohamed Fassi, Souissi, Rabat',
  'Rabat',
  'Ambassade de France au Maroc', '+212537678900', 'evenements@ambafrance-ma.org',
  'cocktail',
  'Cocktail dinatoire. Menu bilingue FR/EN obligatoire. Protocole diplomatique strict. Service gants blancs. Canapes francais et marocains.',
  5040000, 2520000, 2520000, 'MAD',
  'direct',
  'dd888888-8888-8888-8888-888888888888',
  NULL,
  'Evenement prestige. 3eme annee consecutive. Contact Mme Dupont, attachee culturelle. Budget valide.',
  '2026-02-01 10:00:00+00'
);

-- Event 10: Startup Launch — inquiry
INSERT INTO "public"."events" (
  "id", "org_id", "client_id", "status", "event_type",
  "title", "event_date", "event_time", "event_end_time", "guest_count",
  "venue_name", "venue_address", "venue_city",
  "customer_name", "customer_phone", "customer_email",
  "service_style", "special_requests",
  "currency", "budget_min", "budget_max",
  "source",
  "created_at"
) VALUES (
  'evaa0000-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '33333333-3333-3333-3333-333333333333',
  'cc888888-8888-8888-8888-888888888888',
  'inquiry', 'corporate',
  'Lancement App — TechStart Rabat',
  '2026-04-25', '18:00', '21:00', 80,
  'Technopark Rabat',
  'Route de Meknes, Rabat',
  'Rabat',
  'Samir Idrissi', '+212670234567', 'samir.idrissi@startup.ma',
  'cocktail',
  'Ambiance startup decontractee. Finger food moderne. Pas trop formel. Ecrans pour presentation.',
  'MAD', 15000, 20000,
  'social_media',
  '2026-02-20 10:00:00+00'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- QUOTES (5 quotes across events)
-- ══════════════════════════════════════════════════════════════════════════════

-- Quote 1: El Amrani Wedding (accepted)
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
  1, 'accepted',
  '[
    {"section": "Entrees & Salades", "items": [
      {"name": "Pastilla au Poulet (x20)", "qty": 20, "unitType": "per_unit", "unitPrice": 45000, "subtotal": 900000},
      {"name": "Briouates aux Crevettes", "qty": 200, "unitType": "per_person", "unitPrice": 2500, "subtotal": 500000},
      {"name": "Salade Marocaine Composee", "qty": 200, "unitType": "per_person", "unitPrice": 1800, "subtotal": 360000}
    ]},
    {"section": "Plats Principaux", "items": [
      {"name": "Mechoui Entier (x2)", "qty": 2, "unitType": "per_unit", "unitPrice": 350000, "subtotal": 700000},
      {"name": "Couscous Royal 7 Legumes", "qty": 200, "unitType": "per_person", "unitPrice": 4500, "subtotal": 900000}
    ]},
    {"section": "Desserts", "items": [
      {"name": "Assortiment Patisseries", "qty": 200, "unitType": "per_person", "unitPrice": 3000, "subtotal": 600000},
      {"name": "Piece Montee 3 etages", "qty": 1, "unitType": "per_unit", "unitPrice": 350000, "subtotal": 350000}
    ]},
    {"section": "Boissons", "items": [
      {"name": "The a la Menthe", "qty": 200, "unitType": "per_person", "unitPrice": 800, "subtotal": 160000},
      {"name": "Jus d''Orange Frais", "qty": 200, "unitType": "per_person", "unitPrice": 600, "subtotal": 120000}
    ]},
    {"section": "Services", "items": [
      {"name": "Station Tanjia Live", "qty": 1, "unitType": "per_unit", "unitPrice": 250000, "subtotal": 250000},
      {"name": "Service Staff (10 serveurs)", "qty": 1, "unitType": "flat", "unitPrice": 160000, "subtotal": 160000}
    ]}
  ]'::JSONB,
  5000000, 0, 0, 0, 0, 0, 5000000, 25000,
  '2026-03-01',
  'Annulation gratuite jusqu''a 30 jours avant. 50% rembourse entre 30-14 jours. Aucun remboursement apres 14 jours.',
  'Le devis inclut la livraison, l''installation et le service. Vaisselle et nappes incluses. Nettoyage en fin de soiree inclus.',
  'Devis mariage El Amrani-Alaoui. 200 invites, forfait Or. Station tanjia live incluse.',
  '2026-01-25 10:00:00+00',
  '2026-01-28 16:00:00+00',
  '2026-01-22 10:00:00+00'
);

-- Quote 2: Tazi Engagement (sent, pending)
INSERT INTO "public"."quotes" (
  "id", "org_id", "event_id", "version", "status",
  "items", "subtotal", "tax_rate", "tax_amount",
  "total", "per_head_price",
  "valid_until", "notes",
  "sent_at", "created_at"
) VALUES (
  'qt222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ev333333-3333-3333-3333-333333333333',
  1, 'sent',
  '[
    {"section": "Cocktail Dinatoire", "items": [
      {"name": "Canapes varies (12 pieces/pers)", "qty": 80, "unitType": "per_person", "unitPrice": 8000, "subtotal": 640000},
      {"name": "Mini tajines individuels", "qty": 80, "unitType": "per_person", "unitPrice": 5000, "subtotal": 400000},
      {"name": "Verrines dessert", "qty": 80, "unitType": "per_person", "unitPrice": 3000, "subtotal": 240000}
    ]},
    {"section": "Boissons & The", "items": [
      {"name": "Fontaine the a la menthe", "qty": 1, "unitType": "flat", "unitPrice": 80000, "subtotal": 80000},
      {"name": "Jus frais assortis", "qty": 80, "unitType": "per_person", "unitPrice": 1200, "subtotal": 96000}
    ]},
    {"section": "Services", "items": [
      {"name": "Service volant (6 serveurs)", "qty": 1, "unitType": "flat", "unitPrice": 120000, "subtotal": 120000},
      {"name": "Mise en place & decoration", "qty": 1, "unitType": "flat", "unitPrice": 224000, "subtotal": 224000}
    ]}
  ]'::JSONB,
  1800000, 0, 0, 1800000, 22500,
  '2026-03-15',
  'Fiancailles Tazi-Benjelloun. 80 invites. Cocktail dinatoire elegant dans riad prive.',
  '2026-02-18 10:00:00+00',
  '2026-02-16 10:00:00+00'
);

-- Quote 3: Ramadan Iftar OCP (accepted)
INSERT INTO "public"."quotes" (
  "id", "org_id", "event_id", "version", "status",
  "items", "subtotal", "tax_rate", "tax_amount",
  "total", "per_head_price",
  "valid_until", "notes",
  "sent_at", "responded_at", "created_at"
) VALUES (
  'qt333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'ev444444-4444-4444-4444-444444444444',
  1, 'accepted',
  '[
    {"section": "Soupe & Rupture", "items": [
      {"name": "Harira traditionnelle", "qty": 300, "unitType": "per_person", "unitPrice": 2500, "subtotal": 750000},
      {"name": "Dates Medjool & Lait", "qty": 300, "unitType": "per_person", "unitPrice": 1500, "subtotal": 450000},
      {"name": "Chebakia & Sellou", "qty": 300, "unitType": "per_person", "unitPrice": 2000, "subtotal": 600000}
    ]},
    {"section": "Plats Chauds", "items": [
      {"name": "Tajine Agneau Pruneaux", "qty": 300, "unitType": "per_person", "unitPrice": 3500, "subtotal": 1050000},
      {"name": "Briouates assorties", "qty": 300, "unitType": "per_person", "unitPrice": 2000, "subtotal": 600000}
    ]},
    {"section": "Desserts & Boissons", "items": [
      {"name": "Patisseries Ramadan", "qty": 300, "unitType": "per_person", "unitPrice": 2000, "subtotal": 600000},
      {"name": "The a la menthe", "qty": 300, "unitType": "per_person", "unitPrice": 800, "subtotal": 240000},
      {"name": "Service & Logistique", "qty": 1, "unitType": "flat", "unitPrice": 210000, "subtotal": 210000}
    ]}
  ]'::JSONB,
  4500000, 0, 0, 4500000, 15000,
  '2026-03-01',
  'Iftar entreprise OCP. 300 invites. Salle de conferences OCP.',
  '2026-02-08 10:00:00+00',
  '2026-02-10 14:00:00+00',
  '2026-02-06 10:00:00+00'
);

-- Quote 4: Riad Al Baraka Wedding (accepted)
INSERT INTO "public"."quotes" (
  "id", "org_id", "event_id", "version", "status",
  "items", "subtotal", "tax_rate", "tax_amount",
  "total", "per_head_price",
  "valid_until", "notes",
  "sent_at", "responded_at", "created_at"
) VALUES (
  'qt444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'ev666666-6666-6666-6666-666666666666',
  1, 'accepted',
  '[
    {"section": "Diffa Marrakchia", "items": [
      {"name": "Lait Amandes & Dates", "qty": 120, "unitType": "per_person", "unitPrice": 1200, "subtotal": 144000},
      {"name": "Tanjia Marrakchia", "qty": 120, "unitType": "per_person", "unitPrice": 3800, "subtotal": 456000},
      {"name": "Pastilla au Pigeon (x15)", "qty": 15, "unitType": "per_unit", "unitPrice": 55000, "subtotal": 825000},
      {"name": "Rfissa au Poulet Beldi", "qty": 120, "unitType": "per_person", "unitPrice": 2800, "subtotal": 336000},
      {"name": "Seffa Medfouna", "qty": 120, "unitType": "per_person", "unitPrice": 3200, "subtotal": 384000}
    ]},
    {"section": "Douceurs & Service", "items": [
      {"name": "Patisseries & The", "qty": 120, "unitType": "per_person", "unitPrice": 2000, "subtotal": 240000},
      {"name": "Equipe de service (8 pers)", "qty": 1, "unitType": "flat", "unitPrice": 15000, "subtotal": 15000}
    ]}
  ]'::JSONB,
  2400000, 0, 0, 2400000, 20000,
  '2026-02-15',
  'Mariage traditionnel Riad Yacout. 120 invites. Service a la marrakchia.',
  '2026-01-15 10:00:00+00',
  '2026-01-18 16:00:00+00',
  '2026-01-12 10:00:00+00'
);

-- Quote 5: Atlas Gourmet Embassy (accepted)
INSERT INTO "public"."quotes" (
  "id", "org_id", "event_id", "version", "status",
  "items", "subtotal", "tax_rate", "tax_amount",
  "total", "per_head_price",
  "valid_until", "notes",
  "sent_at", "responded_at", "created_at"
) VALUES (
  'qt555555-5555-5555-5555-555555555555',
  '33333333-3333-3333-3333-333333333333',
  'ev999999-9999-9999-9999-999999999999',
  1, 'accepted',
  '[
    {"section": "Cocktail Franco-Marocain", "items": [
      {"name": "Canapes francais (8 pieces/pers)", "qty": 180, "unitType": "per_person", "unitPrice": 6000, "subtotal": 1080000},
      {"name": "Bouchees marocaines (6 pieces/pers)", "qty": 180, "unitType": "per_person", "unitPrice": 5000, "subtotal": 900000},
      {"name": "Plateau fromages & charcuterie", "qty": 6, "unitType": "per_unit", "unitPrice": 80000, "subtotal": 480000},
      {"name": "Mignardises & petits fours", "qty": 180, "unitType": "per_person", "unitPrice": 3500, "subtotal": 630000}
    ]},
    {"section": "Boissons & Service", "items": [
      {"name": "Boissons (jus, eau, cafe, the)", "qty": 180, "unitType": "per_person", "unitPrice": 2500, "subtotal": 450000},
      {"name": "Service gants blancs (15 serveurs)", "qty": 1, "unitType": "flat", "unitPrice": 750000, "subtotal": 750000},
      {"name": "Mise en place & fleurs", "qty": 1, "unitType": "flat", "unitPrice": 750000, "subtotal": 750000}
    ]}
  ]'::JSONB,
  5040000, 20.00, 840000, 5040000, 28000,
  '2026-04-01',
  'Reception 14 Juillet Ambassade de France. 180 invites. Protocole diplomatique. Menu bilingue FR/EN.',
  '2026-02-10 10:00:00+00',
  '2026-02-15 14:00:00+00',
  '2026-02-05 10:00:00+00'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- PAYMENT MILESTONES (15 milestones across events)
-- ══════════════════════════════════════════════════════════════════════════════

-- El Amrani Wedding: 30/50/20 split
INSERT INTO "public"."payment_milestones" (
  "id", "org_id", "event_id", "label", "milestone_type",
  "percentage", "amount", "due_date", "status",
  "payment_method", "payment_reference", "paid_at", "created_at"
) VALUES
(
  'pm111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Acompte (30%)', 'deposit',
  30.00, 1500000, '2026-02-15',
  'paid', 'bank_transfer', 'VIR-BMCE-2026020501',
  '2026-02-05 14:00:00+00', '2026-01-28 10:00:00+00'
),
(
  'pm222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Pre-evenement (50%)', 'progress',
  50.00, 2500000, '2026-04-11',
  'pending', NULL, NULL, NULL,
  '2026-01-28 10:00:00+00'
),
(
  'pm333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'Solde final (20%)', 'final',
  20.00, 1000000, '2026-04-25',
  'pending', NULL, NULL, NULL,
  '2026-01-28 10:00:00+00'
),

-- OCP Gala: all paid (settled event)
(
  'pm444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'ev222222-2222-2222-2222-222222222222',
  'Acompte (50%)', 'deposit',
  50.00, 1350000, '2025-10-15',
  'paid', 'bank_transfer', 'VIR-OCP-2025101001',
  '2025-10-10 10:00:00+00', '2025-09-15 10:00:00+00'
),
(
  'pm555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'ev222222-2222-2222-2222-222222222222',
  'Solde final (50%)', 'final',
  50.00, 1350000, '2025-12-15',
  'paid', 'bank_transfer', 'VIR-OCP-2025120101',
  '2025-12-01 10:00:00+00', '2025-09-15 10:00:00+00'
),

-- Ramadan Iftar: deposit paid
(
  'pm666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'ev444444-4444-4444-4444-444444444444',
  'Acompte (30%)', 'deposit',
  30.00, 1350000, '2026-02-28',
  'paid', 'cod', 'CASH-2026022201',
  '2026-02-22 11:00:00+00', '2026-02-10 10:00:00+00'
),
(
  'pm777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  'ev444444-4444-4444-4444-444444444444',
  'Solde (70%)', 'final',
  70.00, 3150000, '2026-03-14',
  'pending', NULL, NULL, NULL,
  '2026-02-10 10:00:00+00'
),

-- Riad Al Baraka Wedding: 30/50/20 split
(
  'pm888888-8888-8888-8888-888888888888',
  '22222222-2222-2222-2222-222222222222',
  'ev666666-6666-6666-6666-666666666666',
  'Acompte (30%)', 'deposit',
  30.00, 720000, '2026-02-01',
  'paid', 'cod', 'CASH-2026012001',
  '2026-01-20 10:00:00+00', '2026-01-18 10:00:00+00'
),
(
  'pm999999-9999-9999-9999-999999999999',
  '22222222-2222-2222-2222-222222222222',
  'ev666666-6666-6666-6666-666666666666',
  'Pre-evenement (50%)', 'progress',
  50.00, 1200000, '2026-04-25',
  'pending', NULL, NULL, NULL,
  '2026-01-18 10:00:00+00'
),
(
  'pmaa0000-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'ev666666-6666-6666-6666-666666666666',
  'Solde final (20%)', 'final',
  20.00, 480000, '2026-05-09',
  'pending', NULL, NULL, NULL,
  '2026-01-18 10:00:00+00'
),

-- Riad Al Baraka Diffa: all paid (settled)
(
  'pmbb0000-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '22222222-2222-2222-2222-222222222222',
  'ev888888-8888-8888-8888-888888888888',
  'Paiement integral', 'full',
  100.00, 1600000, '2025-12-18',
  'paid', 'cod', 'CASH-2025121801',
  '2025-12-18 10:00:00+00', '2025-11-15 10:00:00+00'
),

-- Atlas Gourmet Embassy: 50/50 split
(
  'pmcc0000-cccc-cccc-cccc-cccccccccccc',
  '33333333-3333-3333-3333-333333333333',
  'ev999999-9999-9999-9999-999999999999',
  'Acompte (50%)', 'deposit',
  50.00, 2520000, '2026-04-01',
  'paid', 'bank_transfer', 'VIR-AMBFR-2026032001',
  '2026-03-20 10:00:00+00', '2026-02-15 10:00:00+00'
),
(
  'pmdd0000-dddd-dddd-dddd-dddddddddddd',
  '33333333-3333-3333-3333-333333333333',
  'ev999999-9999-9999-9999-999999999999',
  'Solde final (50%)', 'final',
  50.00, 2520000, '2026-07-21',
  'pending', NULL, NULL, NULL,
  '2026-02-15 10:00:00+00'
),

-- Henna Night: 50/50
(
  'pmee0000-eeee-eeee-eeee-eeeeeeeeeeee',
  '22222222-2222-2222-2222-222222222222',
  'ev777777-7777-7777-7777-777777777777',
  'Acompte (50%)', 'deposit',
  50.00, 360000, '2026-02-01',
  'paid', 'mobile_money', 'INWI-2026012501',
  '2026-01-25 10:00:00+00', '2026-01-12 10:00:00+00'
),
(
  'pmff0000-ffff-ffff-ffff-ffffffffffff',
  '22222222-2222-2222-2222-222222222222',
  'ev777777-7777-7777-7777-777777777777',
  'Solde final (50%)', 'final',
  50.00, 360000, '2026-04-28',
  'pending', NULL, NULL, NULL,
  '2026-01-12 10:00:00+00'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- EQUIPMENT (15 items across 3 orgs)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."equipment" (
  "id", "org_id", "name", "category", "total_quantity", "available_quantity",
  "condition", "cost_per_unit", "rental_price", "notes", "created_at"
) VALUES
-- Dar Diyafa equipment
('eq111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
 'Rechaud Chafing Dish Grand', 'serving', 30, 20,
 'good', 45000, 5000, 'Inox professionnel, gel combustible inclus', NOW()),
('eq222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
 'Nappe Blanche 180x300cm', 'linen', 50, 35,
 'good', 8000, 1500, 'Polyester anti-tache, lavage inclus', NOW()),
('eq333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
 'Theiere Traditionnelle Inox', 'serving', 40, 30,
 'good', 12000, 2000, 'Theiere en inox avec verres decores', NOW()),
('eq444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
 'Table Buffet Pliante 240cm', 'table', 20, 15,
 'good', 65000, 8000, 'Table rectangulaire pliante, housse incluse', NOW()),
('eq555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
 'Tajine Grande Taille (decoratif)', 'serving', 15, 10,
 'good', 25000, 4000, 'Tajine XL pour presentation buffet', NOW()),
('eq666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
 'Chaise Chiavari Doree', 'table', 200, 150,
 'good', 35000, 3000, 'Chaise chiavari en bois dore, coussin ivoire inclus', NOW()),
('eq777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111',
 'Eclairage LED Guirlandes', 'decoration', 25, 20,
 'good', 15000, 3500, 'Guirlandes LED blanc chaud, 10m par unite', NOW()),
-- Riad Al Baraka equipment
('eq888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222',
 'Plat a Tajine Traditionnel', 'serving', 30, 25,
 'good', 18000, 3000, 'Tajine en terre cuite decoree de Safi', NOW()),
('eq999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222',
 'Coussin Berbe de Sol', 'decoration', 60, 45,
 'good', 8000, 1200, 'Coussins en tissu berbere pour banquettes au sol', NOW()),
('eqaa0000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222',
 'Plateau Cuivre Cisele', 'serving', 20, 15,
 'good', 35000, 5000, 'Plateau marocain en cuivre cisele 60cm, fait main a Fes', NOW()),
('eqbb0000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222',
 'Lanterne Marocaine Fer Forge', 'decoration', 40, 30,
 'good', 12000, 2500, 'Lanterne en fer forge avec verre colore, bougie incluse', NOW()),
('eqcc0000-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222',
 'Service a The Complet (12 verres)', 'serving', 15, 12,
 'good', 22000, 3500, 'Theiere, plateau, 12 verres graves, sucrier', NOW()),
-- Atlas Gourmet equipment
('eqdd0000-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333',
 'Table Ronde Banquet 180cm', 'table', 25, 20,
 'good', 85000, 10000, 'Table ronde pliante pour 10 convives, nappe blanche incluse', NOW()),
('eqee0000-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333',
 'Verrine Cocktail (lot de 50)', 'serving', 10, 8,
 'good', 15000, 2500, 'Verrines en verre 7cl pour canapes et desserts', NOW()),
('eqff0000-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333',
 'Presentoir Etage Inox', 'serving', 12, 10,
 'good', 28000, 4500, 'Presentoir 3 etages en inox pour canapes et patisseries', NOW());


-- ══════════════════════════════════════════════════════════════════════════════
-- EQUIPMENT ALLOCATIONS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."equipment_allocations" (
  "id", "org_id", "equipment_id", "event_id", "quantity", "status", "created_at"
) VALUES
  ('ea111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'eq111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111', 10, 'reserved', NOW()),
  ('ea222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'eq222222-2222-2222-2222-222222222222', 'ev111111-1111-1111-1111-111111111111', 15, 'reserved', NOW()),
  ('ea333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'eq333333-3333-3333-3333-333333333333', 'ev111111-1111-1111-1111-111111111111', 10, 'reserved', NOW()),
  ('ea444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'eq444444-4444-4444-4444-444444444444', 'ev111111-1111-1111-1111-111111111111', 5, 'reserved', NOW()),
  ('ea555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'eq666666-6666-6666-6666-666666666666', 'ev111111-1111-1111-1111-111111111111', 50, 'reserved', NOW()),
  ('ea666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'eq888888-8888-8888-8888-888888888888', 'ev666666-6666-6666-6666-666666666666', 15, 'reserved', NOW()),
  ('ea777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'eq999999-9999-9999-9999-999999999999', 'ev666666-6666-6666-6666-666666666666', 30, 'reserved', NOW()),
  ('ea888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'eqbb0000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ev666666-6666-6666-6666-666666666666', 20, 'reserved', NOW()),
  ('ea999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', 'eqdd0000-dddd-dddd-dddd-dddddddddddd', 'ev999999-9999-9999-9999-999999999999', 5, 'reserved', NOW()),
  ('eaaa0000-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'eqee0000-eeee-eeee-eeee-eeeeeeeeeeee', 'ev999999-9999-9999-9999-999999999999', 6, 'reserved', NOW()),
  ('eabb0000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'eqff0000-ffff-ffff-ffff-ffffffffffff', 'ev999999-9999-9999-9999-999999999999', 8, 'reserved', NOW());


-- ══════════════════════════════════════════════════════════════════════════════
-- STAFF ASSIGNMENTS
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."staff_assignments" (
  "id", "org_id", "event_id", "staff_member_id",
  "staff_name", "staff_phone", "staff_role",
  "shift_start", "shift_end", "tasks",
  "status", "pay_rate", "pay_type", "total_pay", "notes", "created_at"
) VALUES
-- El Amrani Wedding staff
(
  'sa111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Youssef Amrani', '+212664001122', 'chef',
  '14:00', '01:00',
  ARRAY['Superviser cuisine', 'Preparer couscous royal', 'Coordonner service'],
  'confirmed', 200000, 'daily', 200000,
  'Chef principal pour le mariage El Amrani', NOW()
),
(
  'sa222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL,
  'Hassan Ouazzani', '+212665112233', 'server',
  '17:00', '02:00',
  ARRAY['Service buffet', 'Service the', 'Nettoyage'],
  'assigned', 80000, 'daily', 80000, NULL, NOW()
),
(
  'sa333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL,
  'Rachid Moussaoui', '+212666223344', 'setup_crew',
  '15:00', '03:00',
  ARRAY['Installation buffet', 'Decoration', 'Demontage'],
  'assigned', 60000, 'daily', 60000, NULL, NOW()
),
(
  'sa444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL,
  'Aicha Benjelloun', '+212667334455', 'coordinator',
  '16:00', '02:00',
  ARRAY['Coordination service', 'Contact client', 'Gestion timing'],
  'confirmed', 150000, 'daily', 150000,
  'Coordinatrice principale. Contact pour la famille El Amrani.', NOW()
),
-- Riad Al Baraka Wedding staff
(
  'sa555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  'ev666666-6666-6666-6666-666666666666',
  NULL,
  'Abdelkader Boujemaa', '+212668445566', 'chef',
  '16:00', '02:00',
  ARRAY['Preparer tanjia', 'Cuisson pastilla', 'Superviser rfissa'],
  'confirmed', 180000, 'daily', 180000,
  'Chef specialiste tanjia. 15 ans d''experience.', NOW()
),
(
  'sa666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  'ev666666-6666-6666-6666-666666666666',
  NULL,
  'Malika Zouiten', '+212669556677', 'server',
  '19:00', '03:00',
  ARRAY['Service a la marrakchia', 'Service the', 'Accueil invites'],
  'assigned', 70000, 'daily', 70000, NULL, NOW()
);


-- ══════════════════════════════════════════════════════════════════════════════
-- EVENT MESSAGES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."event_messages" (
  "id", "org_id", "event_id", "sender_id", "sender_role", "sender_name",
  "message_type", "content", "is_read", "read_at", "created_at"
) VALUES
(
  'em111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL, 'client', 'Fatima El Amrani',
  'text',
  'Bonjour, nous organisons le mariage de notre fille Salma pour le 18 avril. Nous cherchons un traiteur pour 200 invites avec un budget d''environ 250 MAD par personne. On nous a recommande Dar Diyafa.',
  true, '2026-01-20 11:00:00+00',
  '2026-01-20 10:30:00+00'
),
(
  'em222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'org', 'Karim Benali',
  'text',
  'Bonjour Mme El Amrani! Felicitations pour le mariage de Salma. Nous serions honores de vous accompagner. Je prepare un devis personnalise. Avez-vous des plats specifiques en tete?',
  true, '2026-01-20 12:00:00+00',
  '2026-01-20 11:15:00+00'
),
(
  'em333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL, 'client', 'Fatima El Amrani',
  'text',
  'Merci Chef Karim! Nous aimerions un buffet traditionnel: mechoui, couscous royal, pastilla. Et surtout une station tanjia live — c''est tres important pour nous. La salle est Al Mounia a Maarif.',
  true, '2026-01-21 10:00:00+00',
  '2026-01-21 09:45:00+00'
),
(
  'em444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  '7042152a-7151-49f1-9bfd-3d8f156e7aef', 'org', 'Karim Benali',
  'quote_link',
  'Voici votre devis pour le mariage. 250 MAD/personne avec service complet et station tanjia live. Validite jusqu''au 1er mars 2026. N''hesitez pas si vous avez des questions!',
  true, '2026-01-25 11:00:00+00',
  '2026-01-25 10:30:00+00'
),
(
  'em555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'ev111111-1111-1111-1111-111111111111',
  NULL, 'client', 'Fatima El Amrani',
  'text',
  'C''est parfait! Le devis correspond exactement a ce qu''on voulait. Nous acceptons. Mon mari va faire le virement de l''acompte cette semaine inchallah.',
  true, '2026-01-28 17:00:00+00',
  '2026-01-28 16:00:00+00'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- EVENT REVIEWS
-- ══════════════════════════════════════════════════════════════════════════════

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
  'ev222222-2222-2222-2222-222222222222',
  'cc444444-4444-4444-4444-444444444444',
  'Mohamed Benkirane (OCP Group)', '+212662334455',
  'corporate', 150, '2025-11-15',
  5, 5, 5, 5, 5, 5, 5,
  'Dar Diyafa a encore une fois excelle pour notre gala annuel. Le diner assis de 150 couverts etait impeccable. Chaque plat etait parfaitement execute et le service digne d''un palace 5 etoiles. Bravo a toute l''equipe!',
  'Merci M. Benkirane et toute l''equipe OCP pour votre confiance renouvelee. C''est toujours un plaisir de collaborer avec vous!',
  '2025-11-20 10:00:00+00',
  'published', true, true, '2025-11-18 10:00:00+00'
),
(
  'rv222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  'ev888888-8888-8888-8888-888888888888',
  'cc666666-6666-6666-6666-666666666666',
  'Youssef Berrada', '+212669012345',
  'diffa', 40, '2025-12-20',
  5, 5, 4, 5, 5, 4, 5,
  'Une diffa magnifique dans notre riad! Nos clients touristes francais etaient emerveilles par la tanjia et la pastilla au pigeon. Seul point: l''equipe est arrivee 20 minutes en retard.',
  'Merci M. Berrada! Nous prenons note du retard et ameliorerons notre ponctualite. Ravis que vos clients aient apprecie l''experience marrakchie.',
  '2025-12-28 10:00:00+00',
  'published', true, true, '2025-12-25 10:00:00+00'
),
(
  'rv333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  NULL, NULL,
  'Samira Naciri', '+212667889900',
  'wedding', 180, '2025-06-14',
  4, 5, 4, 3, 5, 5, 4,
  'Tres bon traiteur pour notre mariage. Nourriture excellente, surtout le couscous royal et le mechoui. Prix un peu eleve mais la qualite justifie.',
  'Merci Mme Naciri pour votre retour constructif. Felicitations pour votre mariage!',
  '2025-06-25 10:00:00+00',
  'published', false, false, '2025-06-20 10:00:00+00'
),
(
  'rv444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  NULL, NULL,
  'Sophie Martin (Ambassade de France)', '+212537678900',
  'corporate', 120, '2025-07-14',
  5, 5, 5, 4, 5, 5, 5,
  'Atlas Gourmet a parfaitement gere notre reception du 14 juillet. Le cocktail franco-marocain etait exquis, le service en gants blancs irreprochable. Nous les recommandons pour tout evenement diplomatique.',
  'Merci Mme Martin et toute l''equipe de l''Ambassade. A l''annee prochaine!',
  '2025-07-25 10:00:00+00',
  'published', true, true, '2025-07-20 10:00:00+00'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- INVOICES
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."invoices" (
  "id", "org_id", "event_id", "invoice_number",
  "client_name", "client_phone", "client_email", "client_address",
  "org_name", "org_ice", "org_rc", "org_address",
  "subtotal", "tva_rate", "tva_amount", "total_amount",
  "amount_paid", "amount_due", "currency",
  "status", "issued_at", "due_date", "paid_at",
  "notes", "created_at"
) VALUES
(
  'inv11111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'ev222222-2222-2222-2222-222222222222',
  'DYF-2025-00001',
  'OCP Group (Dept. Communication)', '+212522789012', 'events@ocp.ma',
  'Route d''El Jadida, Casablanca',
  'Dar Diyafa Traiteur', 'IF-987654321', 'RC-CASA-123456',
  '45 Rue Ibn Batouta, Quartier Gauthier, Casablanca 20000',
  2250000, 20.00, 450000, 2700000,
  2700000, 0, 'MAD',
  'paid', '2025-11-16 10:00:00+00', '2025-12-16', '2025-12-01 10:00:00+00',
  'Facture Gala Annuel OCP Group, 15 novembre 2025, 150 convives.',
  '2025-11-16 10:00:00+00'
),
(
  'inv22222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  'ev888888-8888-8888-8888-888888888888',
  'DYF-2025-00002',
  'Youssef Berrada', '+212669012345', 'y.berrada@gmail.com',
  '5 Derb Lalla Azzouna, Medina, Marrakech',
  'Riad Al Baraka Catering', 'IF-456789012', 'RC-MARR-789012',
  '12 Derb Jdid, Bab Doukkala, Medina, Marrakech 40000',
  1600000, 0, 0, 1600000,
  1600000, 0, 'MAD',
  'paid', '2025-12-21 10:00:00+00', '2026-01-21', '2025-12-18 10:00:00+00',
  'Facture Diffa VIP, 20 decembre 2025, 40 convives.',
  '2025-12-21 10:00:00+00'
);


-- ══════════════════════════════════════════════════════════════════════════════
-- EVENT TIMELINE (El Amrani Wedding prep schedule)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO "public"."event_timeline" (
  "id", "org_id", "event_id",
  "title", "description", "category",
  "start_time", "end_time", "duration_minutes",
  "assigned_to", "assigned_name",
  "status", "sort_order", "created_at"
) VALUES
(
  'tl111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111',
  'Achats marche gros Derb Omar',
  'Acheter legumes, viandes, epices, fruits au marche de gros',
  'shopping',
  '2026-04-17 06:00:00+00', '2026-04-17 10:00:00+00', 240,
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Youssef Amrani',
  'pending', 1, NOW()
),
(
  'tl222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111',
  'Preparation pastilla (20 pieces)',
  'Preparer farce poulet-amandes-oeufs et assembler 20 pastillas',
  'prep',
  '2026-04-17 11:00:00+00', '2026-04-17 16:00:00+00', 300,
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Youssef Amrani',
  'pending', 2, NOW()
),
(
  'tl333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111',
  'Marinage mechoui (2 agneaux)',
  'Mariner 2 agneaux avec ras el hanout, cumin, sel, huile d''olive',
  'prep',
  '2026-04-17 14:00:00+00', '2026-04-17 15:00:00+00', 60,
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Youssef Amrani',
  'pending', 3, NOW()
),
(
  'tl444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111',
  'Cuisson couscous, tajines, mechoui',
  'Jour J: lancer cuisson couscous 7 legumes, tajines pruneaux, mechoui au four (4h)',
  'cooking',
  '2026-04-18 06:00:00+00', '2026-04-18 14:00:00+00', 480,
  'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Youssef Amrani',
  'pending', 4, NOW()
),
(
  'tl555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111',
  'Chargement camion refrigere',
  'Charger nourriture et equipement dans 2 camions',
  'packing',
  '2026-04-18 14:00:00+00', '2026-04-18 15:30:00+00', 90,
  NULL, 'Rachid Moussaoui',
  'pending', 5, NOW()
),
(
  'tl666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111',
  'Transport vers Salle Al Mounia',
  'Convoi 2 camions cuisine centrale vers Salle Al Mounia, Maarif (~25 min)',
  'transport',
  '2026-04-18 15:30:00+00', '2026-04-18 16:15:00+00', 45,
  NULL, 'Rachid Moussaoui',
  'pending', 6, NOW()
),
(
  'tl777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111',
  'Installation buffet & decoration',
  'Tables, nappes, chafing dishes, chaises chiavari, guirlandes LED, station tanjia',
  'setup',
  '2026-04-18 16:15:00+00', '2026-04-18 18:30:00+00', 135,
  NULL, 'Rachid Moussaoui',
  'pending', 7, NOW()
),
(
  'tl888888-8888-8888-8888-888888888888',
  '11111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111',
  'Service du diner — 200 invites',
  'Buffet complet. Station tanjia live a 20h30. Service the. Piece montee a 23h.',
  'service',
  '2026-04-18 19:00:00+00', '2026-04-19 01:00:00+00', 360,
  NULL, 'Aicha Benjelloun',
  'pending', 8, NOW()
),
(
  'tl999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111', 'ev111111-1111-1111-1111-111111111111',
  'Nettoyage & demontage',
  'Debarrasser buffet, ranger equipement, demonter decoration, charger camion retour',
  'teardown',
  '2026-04-19 01:00:00+00', '2026-04-19 03:00:00+00', 120,
  NULL, 'Rachid Moussaoui',
  'pending', 9, NOW()
);


-- ============================================================================
-- END OF DIYAFA COMPREHENSIVE SEED DATA
-- ============================================================================
-- Summary:
--   Users:          5 auth users (3 Dar Diyafa, 1 Riad Al Baraka, 1 Atlas Gourmet)
--   Profiles:       5 user profiles
--   Organizations:  3 orgs (Casablanca, Marrakech, Rabat)
--   Org Members:    5 memberships (owner/admin/staff)
--   Clients:        8 client profiles across 3 orgs
--   Legacy Menus:   3 base menus
--   Catering Menus: 9 menus (3 per org)
--   Categories:     18 menu categories
--   Items:          22 catering items
--   Packages:       5 catering packages
--   Package Items:  8 links
--   Themes:         3 menu themes
--   Events:         10 events (confirmed/settled/quoted/inquiry/in_preparation)
--   Quotes:         5 with detailed line items
--   Payments:       15 milestones
--   Equipment:      15 items across 3 orgs
--   Allocations:    11 equipment reservations
--   Staff:          6 assignments
--   Messages:       5 conversation messages
--   Reviews:        4 published reviews
--   Invoices:       2 paid invoices
--   Timeline:       9 timeline items
-- ============================================================================
