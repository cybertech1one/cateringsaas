-- ============================================================================
-- Comprehensive Performance Indexes for FeastQR
-- ============================================================================
-- This migration adds composite indexes, partial indexes, and GIN/trigram
-- indexes for all commonly queried patterns identified from tRPC routers.
--
-- NOTE: CREATE INDEX CONCURRENTLY cannot be used inside a transaction block.
-- When applying outside of Supabase migrations (which auto-wrap in a
-- transaction), consider using CONCURRENTLY for zero-downtime on large tables.
--
-- All indexes use IF NOT EXISTS for idempotency.
-- ============================================================================


-- ─── EXTENSION: pg_trgm for text search ────────────────────────────────────
-- Required for GIN trigram indexes used by directory text search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ============================================================================
-- MENUS TABLE
-- ============================================================================

-- Composite: userId + isPublished (getMenus, ownership checks on published menus)
-- Covers: menus.findMany({ where: { userId, isPublished: true } })
CREATE INDEX IF NOT EXISTS idx_menus_user_id_is_published
  ON public.menus (user_id, is_published);

-- Composite: cityId + isPublished + cuisineTypeId
-- Covers: directory getRestaurantsByCity with optional cuisine filter
CREATE INDEX IF NOT EXISTS idx_menus_city_published_cuisine
  ON public.menus (city_id, is_published, cuisine_type_id)
  WHERE is_published = true;

-- Composite: isPublished + isFeatured
-- Covers: directory getFeaturedRestaurants
CREATE INDEX IF NOT EXISTS idx_menus_published_featured
  ON public.menus (is_published, is_featured)
  WHERE is_published = true AND is_featured = true;

-- Sort index: viewCount DESC for trending/popular queries
-- Covers: directory getTrendingRestaurants, getRestaurantsByCity sort=popular
CREATE INDEX IF NOT EXISTS idx_menus_view_count_desc
  ON public.menus (view_count DESC NULLS LAST)
  WHERE is_published = true;

-- Sort index: rating DESC for sort by rating
-- Covers: directory getRestaurantsByCity sort=rating
CREATE INDEX IF NOT EXISTS idx_menus_rating_desc
  ON public.menus (rating DESC NULLS LAST)
  WHERE is_published = true;

-- Sort index: createdAt DESC for sort by newest
-- Covers: directory getRestaurantsByCity sort=newest
CREATE INDEX IF NOT EXISTS idx_menus_created_at_desc
  ON public.menus (created_at DESC)
  WHERE is_published = true;

-- GIN trigram index: name for text search (ILIKE / contains insensitive)
-- Covers: directory searchRestaurants name contains
CREATE INDEX IF NOT EXISTS idx_menus_name_trgm
  ON public.menus USING gin (name gin_trgm_ops);

-- GIN trigram index: address for text search
-- Covers: directory searchRestaurants address contains
CREATE INDEX IF NOT EXISTS idx_menus_address_trgm
  ON public.menus USING gin (address gin_trgm_ops);

-- GIN trigram index: city for text search
-- Covers: directory searchRestaurants city contains
CREATE INDEX IF NOT EXISTS idx_menus_city_trgm
  ON public.menus USING gin (city gin_trgm_ops);


-- ============================================================================
-- ORDERS TABLE
-- ============================================================================

-- Composite: menuId + status + createdAt DESC
-- Covers: getOrdersByMenu with optional status filter, ordered by createdAt desc
CREATE INDEX IF NOT EXISTS idx_orders_menu_status_created
  ON public.orders (menu_id, status, created_at DESC);

-- Partial: menuId + createdAt for completed orders (revenue aggregation)
-- Covers: getOrderStats WHERE status = 'completed' AND createdAt >= X
CREATE INDEX IF NOT EXISTS idx_orders_menu_completed
  ON public.orders (menu_id, created_at DESC)
  WHERE status = 'completed';

-- Partial: menuId + createdAt for pending orders (dashboard counts)
-- Covers: getOrderStats WHERE status = 'pending' AND createdAt >= X
CREATE INDEX IF NOT EXISTS idx_orders_menu_pending
  ON public.orders (menu_id, created_at DESC)
  WHERE status = 'pending';

-- Partial: menuId + createdAt for cancelled orders
-- Covers: getOrderStats WHERE status = 'cancelled' AND createdAt >= X
CREATE INDEX IF NOT EXISTS idx_orders_menu_cancelled
  ON public.orders (menu_id, created_at DESC)
  WHERE status = 'cancelled';

-- FK index: tableZoneId (not yet indexed)
CREATE INDEX IF NOT EXISTS idx_orders_table_zone_id
  ON public.orders (table_zone_id)
  WHERE table_zone_id IS NOT NULL;


-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================

-- FK index: dishVariantId (not yet indexed)
CREATE INDEX IF NOT EXISTS idx_order_items_dish_variant_id
  ON public.order_items (dish_variant_id)
  WHERE dish_variant_id IS NOT NULL;

-- Composite: orderId + dishName for top-selling dish aggregation
-- Covers: getOrderStats groupBy dishName with order join
CREATE INDEX IF NOT EXISTS idx_order_items_order_dish_name
  ON public.order_items (order_id, dish_name);


-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================

-- Composite: menuId + status + createdAt DESC
-- Covers: getPublicReviews, getMenuReviews, getReviewStats (the most frequent pattern)
CREATE INDEX IF NOT EXISTS idx_reviews_menu_status_created
  ON public.reviews (menu_id, status, created_at DESC);

-- Partial: menuId + rating for approved reviews (stats, aggregation)
-- Covers: aggregate/groupBy on approved reviews for rating distribution
CREATE INDEX IF NOT EXISTS idx_reviews_menu_approved
  ON public.reviews (menu_id, rating)
  WHERE status = 'approved';

-- FK index: locationId (not yet indexed)
CREATE INDEX IF NOT EXISTS idx_reviews_location_id
  ON public.reviews (location_id)
  WHERE location_id IS NOT NULL;


-- ============================================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================================

-- Composite: menuId + eventType + createdAt DESC
-- Covers: ALL analytics raw queries filter by menu_id, event_type, and date range
-- This is the single most impactful index for the analytics system
CREATE INDEX IF NOT EXISTS idx_analytics_menu_type_created
  ON public.analytics_events (menu_id, event_type, created_at DESC);

-- Composite: menuId + createdAt for date-only range scans
-- Covers: analytics queries that filter by menu_id + date range without event_type filter
CREATE INDEX IF NOT EXISTS idx_analytics_menu_created
  ON public.analytics_events (menu_id, created_at DESC);

-- FK index: locationId (not yet indexed, used in QR scan location analytics)
CREATE INDEX IF NOT EXISTS idx_analytics_events_location_id
  ON public.analytics_events (location_id)
  WHERE location_id IS NOT NULL;


-- ============================================================================
-- DISHES TABLE
-- ============================================================================

-- Composite: menuId + categoryId + sortOrder for ordered dish listing
-- Covers: getFullMenu dish loading (menu -> category -> dishes ordered)
CREATE INDEX IF NOT EXISTS idx_dishes_menu_category_sort
  ON public.dishes (menu_id, category_id, sort_order);

-- Partial: featured dishes per menu
-- Covers: filtering for featured dishes within a menu
CREATE INDEX IF NOT EXISTS idx_dishes_featured
  ON public.dishes (menu_id)
  WHERE is_featured = true;

-- Partial: sold out dishes per menu
-- Covers: filtering sold out items
CREATE INDEX IF NOT EXISTS idx_dishes_sold_out
  ON public.dishes (menu_id)
  WHERE is_sold_out = true;


-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

-- Composite: menuId + sortOrder for ordered category listing
-- Covers: getFullMenu categories loading in sort order
CREATE INDEX IF NOT EXISTS idx_categories_menu_sort
  ON public.categories (menu_id, sort_order);


-- ============================================================================
-- DISHES TRANSLATION TABLE
-- ============================================================================

-- Composite: dishId + languageId for translation lookups
-- Covers: getFullMenu dishesTranslation by dish and language
CREATE INDEX IF NOT EXISTS idx_dishes_translation_dish_lang
  ON public.dishes_translation (dish_id, language_id);


-- ============================================================================
-- CATEGORIES TRANSLATION TABLE
-- ============================================================================

-- Composite: categoryId + languageId for translation lookups
-- Covers: getFullMenu categoriesTranslation by category and language
CREATE INDEX IF NOT EXISTS idx_categories_translation_cat_lang
  ON public.categories_translation (category_id, language_id);


-- ============================================================================
-- VARIANT TRANSLATIONS TABLE
-- ============================================================================

-- Composite: dishVariantId + languageId for translation lookups
-- Covers: getFullMenu variantTranslations by variant and language
CREATE INDEX IF NOT EXISTS idx_variant_translations_variant_lang
  ON public.variant_translations (dish_variant_id, language_id);


-- ============================================================================
-- MENU LANGUAGES TABLE
-- ============================================================================

-- FK index: languageId (not yet indexed, foreign key to languages table)
CREATE INDEX IF NOT EXISTS idx_menu_languages_language_id
  ON public.menu_languages (language_id);

-- Composite: menuId + isDefault for default language lookups
CREATE INDEX IF NOT EXISTS idx_menu_languages_menu_default
  ON public.menu_languages (menu_id, is_default)
  WHERE is_default = true;


-- ============================================================================
-- DISHES TAG TABLE
-- ============================================================================

-- FK index: dishId (not yet indexed, used in getFullMenu dish tags join)
CREATE INDEX IF NOT EXISTS idx_dishes_tag_dish_id
  ON public.dishes_tag (dish_id)
  WHERE dish_id IS NOT NULL;


-- ============================================================================
-- PROMOTIONS TABLE
-- ============================================================================

-- Composite: menuId + isActive + startDate for active promotions lookup
-- Covers: getActivePromotions, getActiveBySlug
CREATE INDEX IF NOT EXISTS idx_promotions_menu_active_dates
  ON public.promotions (menu_id, is_active, start_date, end_date)
  WHERE is_active = true;

-- FK indexes: menuId, dishId, categoryId (not yet indexed)
CREATE INDEX IF NOT EXISTS idx_promotions_menu_id
  ON public.promotions (menu_id)
  WHERE menu_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promotions_dish_id
  ON public.promotions (dish_id)
  WHERE dish_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promotions_category_id
  ON public.promotions (category_id)
  WHERE category_id IS NOT NULL;


-- ============================================================================
-- LOYALTY PROGRAM TABLE
-- ============================================================================

-- Composite: menuId + isActive for public program listing
-- Covers: getPublicPrograms WHERE menuId AND isActive = true
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_menu_active
  ON public.loyalty_programs (menu_id, is_active)
  WHERE is_active = true;


-- ============================================================================
-- LOYALTY CARD TABLE
-- ============================================================================

-- Partial: programId + isRedeemed for stats queries
-- Covers: getProgramStats count WHERE isRedeemed = false / true
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_program_redeemed
  ON public.loyalty_cards (program_id, is_redeemed);

-- Sort: updatedAt DESC for card listing pagination
-- Covers: getCards ORDER BY updatedAt DESC with cursor pagination
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_updated_desc
  ON public.loyalty_cards (program_id, updated_at DESC);


-- ============================================================================
-- LOYALTY STAMP TABLE
-- ============================================================================

-- Composite: cardId for stamp count queries
-- Already indexed by Prisma @@index([cardId]) but adding composite for better coverage
-- of the getProgramStats total stamps query that joins card -> stamp
CREATE INDEX IF NOT EXISTS idx_loyalty_stamps_card_created
  ON public.loyalty_stamps (card_id, created_at DESC);


-- ============================================================================
-- STAFF MEMBERS TABLE
-- ============================================================================

-- Composite: menuId + isActive for active staff listing
-- Covers: staff listing filtered by active status
CREATE INDEX IF NOT EXISTS idx_staff_members_menu_active
  ON public.staff_members (menu_id, is_active)
  WHERE is_active = true;

-- FK index: invitedBy (not yet indexed)
CREATE INDEX IF NOT EXISTS idx_staff_members_invited_by
  ON public.staff_members (invited_by)
  WHERE invited_by IS NOT NULL;


-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

-- Index: status for subscription checks
-- Covers: publishMenu subscription check WHERE profileId AND status
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions (status);


-- ============================================================================
-- AI USAGE TABLE
-- ============================================================================

-- Composite: userId + createdAt for usage history queries
-- Covers: AI usage tracking lookups per user over time
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created
  ON public.ai_usage (user_id, created_at DESC);


-- ============================================================================
-- ALLERGENS TABLE
-- ============================================================================

-- FK index: restaurantId (not yet indexed)
CREATE INDEX IF NOT EXISTS idx_allergens_restaurant_id
  ON public.allergens (restaurant_id)
  WHERE restaurant_id IS NOT NULL;

-- Partial: custom allergens per restaurant
CREATE INDEX IF NOT EXISTS idx_allergens_custom
  ON public.allergens (restaurant_id)
  WHERE is_custom = true;


-- ============================================================================
-- DIRECTORY: CITIES TABLE
-- ============================================================================

-- Partial: featured cities
-- Covers: getFeaturedCities WHERE isFeatured = true
CREATE INDEX IF NOT EXISTS idx_cities_featured
  ON public.cities (is_featured, population DESC)
  WHERE is_featured = true;

-- Sort: population DESC for ordered city listings
-- Covers: getCities, getRegionsWithCities ORDER BY population DESC
CREATE INDEX IF NOT EXISTS idx_cities_population_desc
  ON public.cities (population DESC NULLS LAST);

-- GIN trigram: city name for text search
-- Covers: directory search matching on city name
CREATE INDEX IF NOT EXISTS idx_cities_name_trgm
  ON public.cities USING gin (name gin_trgm_ops);


-- ============================================================================
-- DIRECTORY: CUISINE TYPES TABLE
-- ============================================================================

-- Sort: sortOrder for ordered cuisine type listing
-- Covers: getCuisineTypes ORDER BY sortOrder ASC
CREATE INDEX IF NOT EXISTS idx_cuisine_types_sort_order
  ON public.cuisine_types (sort_order);


-- ============================================================================
-- DIRECTORY: REGIONS TABLE
-- ============================================================================

-- Sort: name for alphabetical region listing
-- Covers: getRegions, getRegionsWithCities ORDER BY name ASC
CREATE INDEX IF NOT EXISTS idx_regions_name
  ON public.regions (name);


-- ============================================================================
-- CUSTOMER FAVORITES TABLE
-- ============================================================================

-- Composite: menuId + sessionId for session-based favorite lookups
-- Covers: favorite dish lookups per session on a menu
CREATE INDEX IF NOT EXISTS idx_favorites_menu_session
  ON public.customer_favorites (menu_id, session_id);


-- ============================================================================
-- APP AUDIT LOG TABLE
-- ============================================================================

-- Composite: userId + createdAt DESC for user activity timeline
-- Covers: audit log queries filtered by user with date ordering
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created
  ON public.app_audit_log (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Composite: entityType + action for filtered audit queries
-- Covers: audit log queries filtering by type and action
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_action
  ON public.app_audit_log (entity_type, action);


-- ============================================================================
-- MENU SCHEDULES TABLE
-- ============================================================================

-- Composite: menuId + isActive for active schedule lookups
-- Covers: schedule queries for active schedules of a menu
CREATE INDEX IF NOT EXISTS idx_menu_schedules_menu_active
  ON public.menu_schedules (menu_id, is_active)
  WHERE is_active = true;


-- ============================================================================
-- LOCATIONS TABLE
-- ============================================================================

-- Composite: restaurantId + isActive for active location listing
-- Covers: location queries filtered by restaurant and active status
CREATE INDEX IF NOT EXISTS idx_locations_restaurant_active
  ON public.locations (restaurant_id, is_active)
  WHERE is_active = true;
