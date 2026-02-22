/**
 * Application-wide constants
 * Centralized location for all hardcoded values used across the Diyafa application
 */

// ── Cuisine Types ─────────────────────────────────────────────

export const CUISINE_TYPES = [
  "Italian",
  "Mexican",
  "Japanese",
  "Chinese",
  "Indian",
  "Thai",
  "French",
  "Mediterranean",
  "American",
  "Korean",
  "Vietnamese",
  "Turkish",
  "Lebanese",
  "Moroccan",
  "Greek",
  "Spanish",
  "Other",
] as const;

export type CuisineType = (typeof CUISINE_TYPES)[number];

// ── Days of Week ──────────────────────────────────────────────

export const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeekType = (typeof DAYS_OF_WEEK)[number];

// ── Review Statuses ───────────────────────────────────────────

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;

export type ReviewStatusType = (typeof REVIEW_STATUSES)[number];

// ── Promotion Types ───────────────────────────────────────────

export const PROMOTION_TYPES = [
  "daily_special",
  "happy_hour",
  "discount",
  "combo",
  "seasonal",
] as const;

export type PromotionTypeValue = (typeof PROMOTION_TYPES)[number];

// ── Allergen Types ────────────────────────────────────────────

export const ALLERGEN_TYPES = [
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soybeans",
  "dairy",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
] as const;

export type AllergenTypeValue = (typeof ALLERGEN_TYPES)[number];

// ── Order Statuses ────────────────────────────────────────────

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ── Schedule Types ────────────────────────────────────────────

export const SCHEDULE_TYPES = [
  "breakfast",
  "brunch",
  "lunch",
  "afternoon",
  "dinner",
  "late_night",
  "all_day",
] as const;

export type ScheduleTypeValue = (typeof SCHEDULE_TYPES)[number];

// ── User Roles ────────────────────────────────────────────────

export const USER_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "staff",
  "user",
] as const;

export type UserRoleType = (typeof USER_ROLES)[number];

// ── Tag Types ─────────────────────────────────────────────────

export const TAG_TYPES = [
  "keto",
  "vegan",
  "vegetarian",
  "low_carb",
  "sugar_free",
  "low_fat",
  "high_protein",
  "high_fiber",
  "organic",
  "gluten_free",
  "lactose_free",
] as const;

export type TagTypeValue = (typeof TAG_TYPES)[number];

// ── Currencies ────────────────────────────────────────────────

export const CURRENCIES = [
  { code: "MAD", name: "Moroccan Dirham", symbol: "MAD" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "JD" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
] as const;

export type Currency = (typeof CURRENCIES)[number];

// ── File Constraints ──────────────────────────────────────────

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

// ── Text Length Constraints ───────────────────────────────────

export const MAX_MENU_NAME_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_SLUG_LENGTH = 200;
export const MAX_CATEGORY_NAME_LENGTH = 100;
export const MAX_DISH_NAME_LENGTH = 200;
export const MAX_RESTAURANT_NAME_LENGTH = 200;
export const MAX_LOCATION_NAME_LENGTH = 200;
export const MAX_PROMOTION_TITLE_LENGTH = 200;

// ── Price Constraints ─────────────────────────────────────────

export const MIN_PRICE = 0; // in cents
export const MAX_PRICE = 1_000_000; // in cents (10,000 currency units)

// ── Rating Constraints ────────────────────────────────────────

export const MIN_RATING = 1;
export const MAX_RATING = 5;

// ── Pagination Defaults ───────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ── Default Theme Colors ──────────────────────────────────────

export const DEFAULT_THEME = {
  primaryColor: "#D4A574",
  secondaryColor: "#8B6914",
  backgroundColor: "#FFFBF5",
  surfaceColor: "#FFFFFF",
  textColor: "#1A1A1A",
  accentColor: "#C75B39",
  headingFont: "Playfair Display",
  bodyFont: "Source Sans 3",
  fontSize: "medium",
  layoutStyle: "classic",
  cardStyle: "flat",
  borderRadius: "medium",
  spacing: "comfortable",
  showImages: true,
  imageStyle: "rounded",
  showPrices: true,
  showNutrition: true,
  showCategoryNav: true,
  showCategoryDividers: true,
  headerStyle: "banner",
} as const;

// ── Font Options ──────────────────────────────────────────────

export const HEADING_FONTS = [
  "Playfair Display",
  "Merriweather",
  "Lora",
  "Cinzel",
  "Cormorant Garamond",
  "Bebas Neue",
  "Montserrat",
  "Oswald",
  "Roboto Slab",
] as const;

export const BODY_FONTS = [
  "Source Sans 3",
  "Open Sans",
  "Roboto",
  "Lato",
  "Nunito",
  "Inter",
  "Poppins",
  "Work Sans",
  "Raleway",
] as const;

export type HeadingFont = (typeof HEADING_FONTS)[number];
export type BodyFont = (typeof BODY_FONTS)[number];

// ── Layout Options ────────────────────────────────────────────

export const LAYOUT_STYLES = ["classic", "modern", "minimal", "luxury"] as const;
export const CARD_STYLES = ["flat", "elevated", "outlined", "filled"] as const;
export const BORDER_RADIUS_OPTIONS = ["none", "small", "medium", "large"] as const;
export const SPACING_OPTIONS = ["compact", "comfortable", "relaxed"] as const;
export const IMAGE_STYLES = ["rounded", "square", "circle"] as const;
export const HEADER_STYLES = ["banner", "minimal", "centered"] as const;

export type LayoutStyle = (typeof LAYOUT_STYLES)[number];
export type CardStyle = (typeof CARD_STYLES)[number];
export type BorderRadiusOption = (typeof BORDER_RADIUS_OPTIONS)[number];
export type SpacingOption = (typeof SPACING_OPTIONS)[number];
export type ImageStyle = (typeof IMAGE_STYLES)[number];
export type HeaderStyle = (typeof HEADER_STYLES)[number];

// ── Analytics Event Types ─────────────────────────────────────

export const ANALYTICS_EVENTS = {
  MENU_VIEW: "menu_view",
  DISH_VIEW: "dish_view",
  CATEGORY_VIEW: "category_view",
  LANGUAGE_CHANGE: "language_change",
  SEARCH: "search",
  FAVORITE_ADD: "favorite_add",
  FAVORITE_REMOVE: "favorite_remove",
  ORDER_START: "order_start",
  ORDER_COMPLETE: "order_complete",
  REVIEW_SUBMIT: "review_submit",
  PROMOTION_VIEW: "promotion_view",
} as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ── Storage Paths ─────────────────────────────────────────────

export const STORAGE_PATHS = {
  menuImages: (userId: string, menuId: string) => `${userId}/menu/${menuId}`,
  dishImages: (userId: string, dishId: string) => `${userId}/dish/${dishId}`,
  restaurantLogos: (userId: string, restaurantId: string) =>
    `${userId}/restaurant/${restaurantId}`,
  profileImages: (userId: string) => `${userId}/profile`,
  qrCodes: (userId: string, menuId: string) => `${userId}/qr/${menuId}`,
} as const;

// ── API Rate Limits ───────────────────────────────────────────

export const RATE_LIMITS = {
  // General API calls per user
  API_PER_USER: { limit: 100, windowMs: 60_000 }, // 100 req/min

  // Webhook endpoint (by IP)
  WEBHOOK: { limit: 30, windowMs: 60_000 }, // 30 req/min

  // AI generation per user
  AI_GENERATION: { limit: 20, windowMs: 60_000 }, // 20 req/min

  // Authentication attempts
  AUTH_ATTEMPT: { limit: 5, windowMs: 900_000 }, // 5 attempts per 15 min

  // Review submission
  REVIEW_SUBMIT: { limit: 3, windowMs: 3600_000 }, // 3 reviews per hour

  // Order creation
  ORDER_CREATE: { limit: 10, windowMs: 60_000 }, // 10 orders per min
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// ── Feature Flags ─────────────────────────────────────────────

export const FEATURES = {
  AI_ENABLED: true,
  MULTI_LOCATION: true,
  REVIEWS: true,
  PROMOTIONS: true,
  ORDERS: true,
  ANALYTICS: true,
  THEMES: true,
  ALLERGENS: true,
  NUTRITION: true,
  FAVORITES: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

// ── Environment Detection ─────────────────────────────────────

export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";
export const isTest = process.env.NODE_ENV === "test";
