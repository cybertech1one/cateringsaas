import type {
  Menus,
  Dishes,
  Categories,
  Restaurants,
  Locations,
  Reviews,
  Promotions,
  Allergens,
  DishAllergens,
  AnalyticsEvents,
  MenuThemes,
  Orders,
  OrderItems,
  Profiles,
  StaffMembers,
  TableZones,
  OperatingHours,
  SpecialHours,
  CustomerFavorites,
  DishVariants,
  Languages,
  MenuLanguages,
  DishesTranslation,
  CategoriesTranslation,
  VariantTranslations,
  MenuSchedules,
  AiUsage,
  Subscriptions,
  DayOfWeek,
  AllergenType,
  PromotionType,
  ReviewStatus,
  ScheduleType,
  UserRole,
  TagType,
} from "@prisma/client";

// ── Re-export Prisma Types ────────────────────────────────────

export type {
  Menus,
  Dishes,
  Categories,
  Restaurants,
  Locations,
  Reviews,
  Promotions,
  Allergens,
  DishAllergens,
  AnalyticsEvents,
  MenuThemes,
  Orders,
  OrderItems,
  Profiles,
  StaffMembers,
  TableZones,
  OperatingHours,
  SpecialHours,
  CustomerFavorites,
  DishVariants,
  Languages,
  MenuLanguages,
  DishesTranslation,
  CategoriesTranslation,
  VariantTranslations,
  MenuSchedules,
  AiUsage,
  Subscriptions,
};

// ── Re-export Prisma Enums ────────────────────────────────────

export type {
  DayOfWeek,
  AllergenType,
  PromotionType,
  ReviewStatus,
  ScheduleType,
  UserRole,
  TagType,
};

// ── Composite Domain Types ────────────────────────────────────

/**
 * Menu with nested categories and dishes
 */
export type MenuWithCategories = Menus & {
  categories: (Categories & {
    dishes: Dishes[];
  })[];
};

/**
 * Dish with translations for multi-language support
 */
export type DishWithTranslations = Dishes & {
  dishesTranslation: {
    name: string;
    description: string | null;
    languageId: string;
  }[];
};

/**
 * Category with translations
 */
export type CategoryWithTranslations = Categories & {
  categoriesTranslation: {
    name: string;
    languageId: string;
  }[];
};

/**
 * Restaurant with all locations
 */
export type RestaurantWithLocations = Restaurants & {
  locations: Locations[];
};

/**
 * Location with operating hours and special hours
 */
export type LocationWithHours = Locations & {
  operatingHours: OperatingHours[];
  specialHours: SpecialHours[];
};

/**
 * Dish with allergen information
 */
export type DishWithAllergens = Dishes & {
  dishAllergens: (DishAllergens & {
    allergen: Allergens;
  })[];
};

/**
 * Review with associated menu information
 */
export type ReviewWithMenu = Reviews & {
  menu: Pick<Menus, "id" | "name" | "userId">;
};

/**
 * Full menu data including categories, dishes, and translations
 */
export type FullMenuData = Menus & {
  categories: (Categories & {
    dishes: (Dishes & {
      dishesTranslation: DishesTranslation[];
      dishVariants: (DishVariants & {
        variantTranslations: VariantTranslations[];
      })[];
      dishAllergens: (DishAllergens & {
        allergen: Allergens;
      })[];
    })[];
    categoriesTranslation: CategoriesTranslation[];
  })[];
  menuLanguages: (MenuLanguages & {
    languages: Languages;
  })[];
  menuThemes: MenuThemes | null;
};

/**
 * Order with all items and related data
 */
export type OrderWithItems = Orders & {
  orderItems: (OrderItems & {
    dishes: Dishes | null;
    dishVariants: DishVariants | null;
  })[];
  menus: Pick<Menus, "id" | "name" | "userId">;
};

/**
 * Promotion with applicable menu/dish/category
 */
export type PromotionWithRelations = Promotions & {
  menu: Pick<Menus, "id" | "name"> | null;
  dish: Pick<Dishes, "id"> | null;
  category: Pick<Categories, "id"> | null;
  restaurant: Pick<Restaurants, "id" | "name">;
};

/**
 * Profile with subscription and usage data
 */
export type ProfileWithSubscription = Profiles & {
  subscriptions: Subscriptions | null;
  aiUsage: AiUsage[];
};

/**
 * Staff member with user profile
 */
export type StaffMemberWithProfile = StaffMembers & {
  user: Pick<Profiles, "id" | "email" | "fullName">;
  inviter: Pick<Profiles, "id" | "email" | "fullName"> | null;
};

/**
 * Table zone with location information
 */
export type TableZoneWithLocation = TableZones & {
  location: Pick<Locations, "id" | "name" | "restaurantId">;
};
