-- Add indexes for frequently queried columns to improve query performance

-- Menus: userId is queried in every privateProcedure (getMenus, upsertMenu, etc.)
CREATE INDEX IF NOT EXISTS idx_menus_user_id ON public.menus (user_id);

-- Menus: compound index for common slug + userId lookups
CREATE INDEX IF NOT EXISTS idx_menus_slug_user_id ON public.menus (slug, user_id);

-- Menus: isPublished filter used in public menu viewing
CREATE INDEX IF NOT EXISTS idx_menus_is_published ON public.menus (is_published) WHERE is_published = true;

-- Categories: menuId is queried via getCategoriesBySlug, getDishesByCategory
CREATE INDEX IF NOT EXISTS idx_categories_menu_id ON public.categories (menu_id);

-- Dishes: menuId and categoryId are both frequently queried
CREATE INDEX IF NOT EXISTS idx_dishes_menu_id ON public.dishes (menu_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category_id ON public.dishes (category_id);

-- DishVariants: dishId is queried via joins
CREATE INDEX IF NOT EXISTS idx_dish_variants_dish_id ON public.dish_variants (dish_id);

-- DishesTranslation: dishId for join performance
CREATE INDEX IF NOT EXISTS idx_dishes_translation_dish_id ON public.dishes_translation (dish_id);

-- CategoriesTranslation: categoryId for join performance
CREATE INDEX IF NOT EXISTS idx_categories_translation_category_id ON public.categories_translation (category_id);

-- VariantTranslations: dishVariantId for join performance
CREATE INDEX IF NOT EXISTS idx_variant_translations_dish_variant_id ON public.variant_translations (dish_variant_id);
