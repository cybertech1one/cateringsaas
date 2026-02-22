-- ============================================================================
-- Comprehensive RLS Policies for Diyafa
-- ============================================================================
-- This migration adds RLS policies to all public tables that are missing them.
--
-- Context:
--   - 8 tables have RLS enabled but ZERO policies (completely locked out)
--   - Several tables have gaps in their policy coverage
--   - The tRPC backend uses Supabase service_role key which BYPASSES RLS
--   - RLS only affects direct Supabase client access (anon key, user JWT)
--
-- Ownership model:
--   - auth.uid() returns the current user's UUID from their JWT
--   - Menus belong to users via menus.user_id
--   - Dishes, categories, translations belong to menus via menu_id
--   - Restaurants belong to users via restaurants.user_id
--   - Locations belong to restaurants via restaurant_id
--
-- NOTE: DROP POLICY IF NOT EXISTS doesn't exist in Postgres.
-- We use DROP POLICY IF EXISTS + CREATE POLICY to be idempotent.
-- ============================================================================

-- ============================================================================
-- 1. LANGUAGES - Reference table, public read for everyone
-- ============================================================================
-- Languages is a reference table (English, French, Arabic, etc.)
-- Everyone needs to read it. Only service role should write (no user-facing write).

DROP POLICY IF EXISTS "languages_public_read" ON public.languages;
CREATE POLICY "languages_public_read" ON public.languages
  FOR SELECT USING (true);

-- ============================================================================
-- 2. MENU_LANGUAGES - Junction table linking menus to their languages
-- ============================================================================
-- Owner of the menu can manage their menu's language associations.
-- Public can read for published menus (needed to render language switcher).

DROP POLICY IF EXISTS "menu_languages_owner_all" ON public.menu_languages;
CREATE POLICY "menu_languages_owner_all" ON public.menu_languages
  FOR ALL USING (
    menu_id IN (SELECT id FROM menus WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "menu_languages_public_read" ON public.menu_languages;
CREATE POLICY "menu_languages_public_read" ON public.menu_languages
  FOR SELECT USING (
    menu_id IN (SELECT id FROM menus WHERE is_published = true)
  );

-- ============================================================================
-- 3. CATEGORIES_TRANSLATION - Translations for category names
-- ============================================================================
-- Owner of the menu (via category -> menu) can manage translations.
-- Public can read for published menus.

DROP POLICY IF EXISTS "cat_translation_owner_all" ON public.categories_translation;
CREATE POLICY "cat_translation_owner_all" ON public.categories_translation
  FOR ALL USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN menus m ON c.menu_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "cat_translation_public_read" ON public.categories_translation;
CREATE POLICY "cat_translation_public_read" ON public.categories_translation
  FOR SELECT USING (
    category_id IN (
      SELECT c.id FROM categories c
      JOIN menus m ON c.menu_id = m.id
      WHERE m.is_published = true
    )
  );

-- ============================================================================
-- 4. DISHES_TRANSLATION - Translations for dish names and descriptions
-- ============================================================================
-- Owner of the menu (via dish -> menu) can manage translations.
-- Public can read for published menus.

DROP POLICY IF EXISTS "dish_translation_owner_all" ON public.dishes_translation;
CREATE POLICY "dish_translation_owner_all" ON public.dishes_translation
  FOR ALL USING (
    dish_id IN (
      SELECT d.id FROM dishes d
      JOIN menus m ON d.menu_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dish_translation_public_read" ON public.dishes_translation;
CREATE POLICY "dish_translation_public_read" ON public.dishes_translation
  FOR SELECT USING (
    dish_id IN (
      SELECT d.id FROM dishes d
      JOIN menus m ON d.menu_id = m.id
      WHERE m.is_published = true
    )
  );

-- ============================================================================
-- 5. DISHES_TAG - Tags on dishes (vegan, keto, gluten-free, etc.)
-- ============================================================================
-- Owner of the menu (via dish -> menu) can manage tags.
-- Public can read for all dishes (tags are informational, always visible).

DROP POLICY IF EXISTS "dishes_tag_owner_all" ON public.dishes_tag;
CREATE POLICY "dishes_tag_owner_all" ON public.dishes_tag
  FOR ALL USING (
    dish_id IN (
      SELECT d.id FROM dishes d
      JOIN menus m ON d.menu_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dishes_tag_public_read" ON public.dishes_tag;
CREATE POLICY "dishes_tag_public_read" ON public.dishes_tag
  FOR SELECT USING (
    dish_id IN (
      SELECT d.id FROM dishes d
      JOIN menus m ON d.menu_id = m.id
      WHERE m.is_published = true
    )
  );

-- ============================================================================
-- 6. DISH_VARIANTS - Size/portion variants for dishes
-- ============================================================================
-- Owner of the menu (via dish -> menu) can manage variants.
-- Public can read for published menus.

DROP POLICY IF EXISTS "dish_variants_owner_all" ON public.dish_variants;
CREATE POLICY "dish_variants_owner_all" ON public.dish_variants
  FOR ALL USING (
    dish_id IN (
      SELECT d.id FROM dishes d
      JOIN menus m ON d.menu_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "dish_variants_public_read" ON public.dish_variants;
CREATE POLICY "dish_variants_public_read" ON public.dish_variants
  FOR SELECT USING (
    dish_id IN (
      SELECT d.id FROM dishes d
      JOIN menus m ON d.menu_id = m.id
      WHERE m.is_published = true
    )
  );

-- ============================================================================
-- 7. VARIANT_TRANSLATIONS - Translations for variant names
-- ============================================================================
-- Owner (via dish_variant -> dish -> menu) can manage.
-- Public can read for published menus.

DROP POLICY IF EXISTS "variant_trans_owner_all" ON public.variant_translations;
CREATE POLICY "variant_trans_owner_all" ON public.variant_translations
  FOR ALL USING (
    dish_variant_id IN (
      SELECT dv.id FROM dish_variants dv
      JOIN dishes d ON dv.dish_id = d.id
      JOIN menus m ON d.menu_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "variant_trans_public_read" ON public.variant_translations;
CREATE POLICY "variant_trans_public_read" ON public.variant_translations
  FOR SELECT USING (
    dish_variant_id IN (
      SELECT dv.id FROM dish_variants dv
      JOIN dishes d ON dv.dish_id = d.id
      JOIN menus m ON d.menu_id = m.id
      WHERE m.is_published = true
    )
  );

-- ============================================================================
-- 8. ORDER_ITEMS - Line items within an order
-- ============================================================================
-- Menu owner can read/manage order items (for kitchen/management).
-- Public can insert order items (when placing an order).
-- Public can read their own order items (by order relationship, but we allow
-- broadly for now since order_items don't contain sensitive data beyond dish info).

DROP POLICY IF EXISTS "order_items_owner_all" ON public.order_items;
CREATE POLICY "order_items_owner_all" ON public.order_items
  FOR ALL USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN menus m ON o.menu_id = m.id
      WHERE m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_public_insert" ON public.order_items;
CREATE POLICY "order_items_public_insert" ON public.order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_public_read" ON public.order_items;
CREATE POLICY "order_items_public_read" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN menus m ON o.menu_id = m.id
      WHERE m.is_published = true
    )
  );

-- ============================================================================
-- 9. LOCATIONS - Add missing public read (for published menu location info)
-- ============================================================================
-- Already has: locations_owner_all (USING restaurant ownership)
-- Missing: public read for locations tied to published menus

DROP POLICY IF EXISTS "locations_public_read" ON public.locations;
CREATE POLICY "locations_public_read" ON public.locations
  FOR SELECT USING (
    id IN (
      SELECT location_id FROM menus WHERE is_published = true AND location_id IS NOT NULL
    )
    OR
    restaurant_id IN (
      SELECT restaurant_id FROM menus WHERE is_published = true AND restaurant_id IS NOT NULL
    )
  );

-- ============================================================================
-- 10. REVIEWS - Add owner DELETE (currently only has INSERT/SELECT/UPDATE)
-- ============================================================================
-- Menu owners should be able to delete reviews (moderation)

DROP POLICY IF EXISTS "reviews_owner_delete" ON public.reviews;
CREATE POLICY "reviews_owner_delete" ON public.reviews
  FOR DELETE USING (
    menu_id IN (SELECT id FROM menus WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 11. ORDERS - Add public read for order status tracking
-- ============================================================================
-- Customers who placed an order on a published menu can view orders.
-- This is scoped to published menus only for safety.

DROP POLICY IF EXISTS "orders_public_read" ON public.orders;
CREATE POLICY "orders_public_read" ON public.orders
  FOR SELECT USING (
    menu_id IN (SELECT id FROM menus WHERE is_published = true)
  );

-- ============================================================================
-- 12. STAFF MEMBERS - Add staff write for accepting invitations
-- ============================================================================
-- Staff members should be able to update their own staff record
-- (e.g., accepting an invitation by setting accepted_at)

DROP POLICY IF EXISTS "staff_member_update_own" ON public.staff_members;
CREATE POLICY "staff_member_update_own" ON public.staff_members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 13. RESTAURANTS - Add public read for published menu restaurants
-- ============================================================================
-- When a menu is published and tied to a restaurant, the public menu page
-- may need to read restaurant info (name, logo, etc.)

DROP POLICY IF EXISTS "restaurants_public_read" ON public.restaurants;
CREATE POLICY "restaurants_public_read" ON public.restaurants
  FOR SELECT USING (
    id IN (
      SELECT restaurant_id FROM menus WHERE is_published = true AND restaurant_id IS NOT NULL
    )
  );

-- ============================================================================
-- VERIFICATION QUERY (for manual testing)
-- ============================================================================
-- After applying, run this to verify all public tables have at least one policy:
--
--   SELECT t.tablename,
--          COUNT(p.policyname) AS policy_count,
--          t.rowsecurity AS rls_enabled
--   FROM pg_tables t
--   LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
--   WHERE t.schemaname = 'public'
--   GROUP BY t.tablename, t.rowsecurity
--   ORDER BY policy_count ASC, t.tablename;
--
-- Every table should have at least 1 policy and rls_enabled = true.
-- ============================================================================
