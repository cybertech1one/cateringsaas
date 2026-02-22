/**
 * Test data factories for FeastQR models.
 *
 * Each factory generates realistic restaurant/menu data with sensible defaults.
 * All IDs are deterministic UUIDs seeded by an incrementing counter so tests
 * remain predictable when no override is supplied.
 *
 * Prices are stored as integers (cents): 1999 = $19.99 (matches Prisma schema).
 */

import type {
  Menus,
  Categories,
  Dishes,
  Profiles,
  Reviews,
  Restaurants,
  Locations,
  DishVariants,
  Orders,
  OrderItems,
  MenuThemes,
  Promotions,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let counter = 0;

/**
 * Generate a deterministic UUID-v4-shaped string.
 * Not cryptographically random, but perfectly fine for test data.
 */
function nextUuid(): string {
  counter += 1;
  const hex = counter.toString(16).padStart(12, "0");

  return `00000000-0000-4000-a000-${hex}`;
}

function recentDate(daysAgo = 0): Date {
  const d = new Date("2025-03-15T12:00:00Z");

  d.setDate(d.getDate() - daysAgo);

  return d;
}

// Pools of realistic restaurant data
const RESTAURANT_NAMES = [
  "Shawarma Klub Haus",
  "Riad Casablanca",
  "Le Petit Marrakech",
  "Atlas Grill House",
  "Dar Tanjia",
  "Cafe Medina",
  "La Table du Souk",
  "Bab Mansour Bistro",
] as const;

const DISH_NAMES = [
  "Lamb Tagine with Preserved Lemons",
  "Chicken Bastilla",
  "Harira Soup",
  "Couscous Royale",
  "Grilled Kefta Brochettes",
  "Zaalouk Eggplant Dip",
  "Merguez Sausage Plate",
  "Pastilla au Poisson",
  "Rfissa with Chicken",
  "Briouats with Minced Lamb",
] as const;

const CATEGORY_NAMES = [
  "Appetizers",
  "Main Courses",
  "Grilled Specialties",
  "Soups & Salads",
  "Desserts",
  "Beverages",
  "Chef Specials",
  "Breakfast",
] as const;

const CITIES = [
  "Casablanca",
  "Marrakech",
  "Rabat",
  "Fes",
  "Tangier",
  "Agadir",
] as const;

const STREETS = [
  "12 Rue Mohammed V",
  "45 Avenue Hassan II",
  "8 Boulevard Zerktouni",
  "23 Derb Sidi Bouloukat",
  "1 Place Jemaa el-Fna",
] as const;

// ---------------------------------------------------------------------------
// Factory: Profile (user)
// ---------------------------------------------------------------------------

export function createUser(overrides?: Partial<Profiles>): Profiles {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    updatedAt: recentDate(1),
    username: `chef_${id.slice(-6)}`,
    fullName: "Youssef Benali",
    email: `youssef.${id.slice(-6)}@example.com`,
    aiProvider: "openai",
    aiModel: "gpt-4o-mini",
    role: "user",
    crmApiKey: null,
    crmWorkspaceUrl: null,
    crmAutoSync: false,
    crmLastSyncedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Menu
// ---------------------------------------------------------------------------

export function createMenu(overrides?: Partial<Menus>): Menus {
  const id = overrides?.id ?? nextUuid();
  const name =
    overrides?.name ??
    RESTAURANT_NAMES[counter % RESTAURANT_NAMES.length]!;
  const slug =
    overrides?.slug ??
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
      `-${id.slice(-6)}`;

  return {
    id,
    name,
    userId: overrides?.userId ?? nextUuid(),
    slug,
    backgroundImageUrl: null,
    city: CITIES[counter % CITIES.length]!,
    address: STREETS[counter % STREETS.length]!,
    isPublished: true,
    updatedAt: recentDate(0),
    createdAt: recentDate(30),
    contactNumber: "+212612345678",
    facebookUrl: null,
    googleReviewUrl: null,
    instagramUrl: null,
    logoImageUrl: null,
    currency: "MAD",
    restaurantId: null,
    locationId: null,
    cityId: null,
    cuisineTypeId: null,
    priceRange: 2,
    rating: null,
    reviewCount: 0,
    viewCount: 0,
    isFeatured: false,
    phone: null,
    whatsappNumber: null,
    whatsappNotifyEnabled: false,
    website: null,
    openingHours: null,
    enabledOrderTypes: ["dine_in"],
    deliveryFee: 0,
    deliveryRadiusKm: 5,
    minOrderAmount: 0,
    estimatedPrepTime: 15,
    restaurantLat: null,
    restaurantLng: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Category
// ---------------------------------------------------------------------------

export function createCategory(overrides?: Partial<Categories>): Categories {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    menuId: overrides?.menuId ?? nextUuid(),
    createdAt: recentDate(20),
    sortOrder: counter % 10,
    icon: null,
    description: null,
    ...overrides,
  };
}

/**
 * Convenience: returns a category name from the realistic pool.
 * Useful when you also need to create a CategoriesTranslation row.
 */
export function getCategoryName(index = 0): string {
  return CATEGORY_NAMES[index % CATEGORY_NAMES.length]!;
}

// ---------------------------------------------------------------------------
// Factory: Dish
// ---------------------------------------------------------------------------

export function createDish(overrides?: Partial<Dishes>): Dishes {
  const id = overrides?.id ?? nextUuid();
  const nameIndex = counter % DISH_NAMES.length;

  return {
    id,
    price: overrides?.price ?? 3500 + (nameIndex * 500), // 35.00 MAD base
    pictureUrl: null,
    createdAt: recentDate(15),
    menuId: overrides?.menuId ?? nextUuid(),
    categoryId: overrides?.categoryId ?? null,
    carbohydrates: 45,
    fats: 12,
    protein: 28,
    weight: 350,
    calories: 420,
    isSoldOut: false,
    sortOrder: counter % 20,
    prepTimeMinutes: 25,
    isFeatured: false,
    stockQuantity: null,
    lowStockThreshold: 5,
    trackInventory: false,
    kitchenStationId: null,
    ...overrides,
  };
}

/**
 * Convenience: returns a dish name from the realistic pool.
 */
export function getDishName(index = 0): string {
  return DISH_NAMES[index % DISH_NAMES.length]!;
}

// ---------------------------------------------------------------------------
// Factory: DishVariant
// ---------------------------------------------------------------------------

export function createDishVariant(overrides?: Partial<DishVariants>): DishVariants {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    price: overrides?.price ?? 4500,
    dishId: overrides?.dishId ?? nextUuid(),
    createdAt: recentDate(10),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Review
// ---------------------------------------------------------------------------

export function createReview(overrides?: Partial<Reviews>): Reviews {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    menuId: overrides?.menuId ?? nextUuid(),
    locationId: null,
    customerName: "Fatima Zahra",
    customerEmail: "fatima@example.com",
    rating: 4,
    comment: "Excellent tagine, the lamb was perfectly tender.",
    status: "approved",
    response: null,
    respondedAt: null,
    createdAt: recentDate(3),
    updatedAt: recentDate(3),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Restaurant
// ---------------------------------------------------------------------------

export function createRestaurant(overrides?: Partial<Restaurants>): Restaurants {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    userId: overrides?.userId ?? nextUuid(),
    name: RESTAURANT_NAMES[counter % RESTAURANT_NAMES.length]!,
    description: "Authentic Moroccan cuisine in the heart of the medina.",
    logoUrl: null,
    website: "https://example.com",
    cuisineType: "Moroccan",
    isChain: false,
    createdAt: recentDate(60),
    updatedAt: recentDate(2),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Location
// ---------------------------------------------------------------------------

export function createLocation(overrides?: Partial<Locations>): Locations {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    restaurantId: overrides?.restaurantId ?? nextUuid(),
    name: "Main Branch",
    address: STREETS[counter % STREETS.length]!,
    city: CITIES[counter % CITIES.length]!,
    state: null,
    country: "Morocco",
    postalCode: "20000",
    latitude: null,
    longitude: null,
    phone: "+212522123456",
    email: "contact@example.com",
    timezone: "Africa/Casablanca",
    isActive: true,
    createdAt: recentDate(45),
    updatedAt: recentDate(1),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Order
// ---------------------------------------------------------------------------

export function createOrder(overrides?: Partial<Orders>): Orders {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    menuId: overrides?.menuId ?? nextUuid(),
    orderNumber: counter + 1000,
    status: "pending",
    totalAmount: 8500, // 85.00 MAD
    currency: "MAD",
    customerName: "Ahmed Tazi",
    customerPhone: "+212612345678",
    customerNotes: null,
    tableNumber: "12",
    orderType: "dine_in",
    deliveryAddress: null,
    deliveryFee: 0,
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    paidAt: null,
    paymentNote: null,
    locationId: null,
    tableZoneId: null,
    createdAt: recentDate(0),
    updatedAt: recentDate(0),
    confirmedAt: null,
    preparingAt: null,
    readyAt: null,
    completedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: OrderItem
// ---------------------------------------------------------------------------

export function createOrderItem(overrides?: Partial<OrderItems>): OrderItems {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    orderId: overrides?.orderId ?? nextUuid(),
    dishId: overrides?.dishId ?? null,
    dishVariantId: null,
    dishName: DISH_NAMES[counter % DISH_NAMES.length]!,
    quantity: 2,
    unitPrice: 3500,
    totalPrice: 7000,
    notes: null,
    createdAt: recentDate(0),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: MenuTheme
// ---------------------------------------------------------------------------

export function createMenuTheme(overrides?: Partial<MenuThemes>): MenuThemes {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    menuId: overrides?.menuId ?? nextUuid(),
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
    customCss: "",
    createdAt: recentDate(10),
    updatedAt: recentDate(1),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Promotion
// ---------------------------------------------------------------------------

export function createPromotion(overrides?: Partial<Promotions>): Promotions {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    restaurantId: overrides?.restaurantId ?? nextUuid(),
    title: "Lunch Special: Tagine + Mint Tea",
    description: "Enjoy a full tagine with complimentary Moroccan mint tea.",
    promotionType: "daily_special",
    discountPercent: 15,
    discountAmount: null,
    startDate: recentDate(7),
    endDate: null,
    isActive: true,
    applicableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    startTime: null,
    endTime: null,
    menuId: null,
    dishId: null,
    categoryId: null,
    imageUrl: null,
    createdAt: recentDate(7),
    updatedAt: recentDate(1),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset helper (call in beforeEach if you want deterministic ordering)
// ---------------------------------------------------------------------------

export function resetFactoryCounter(): void {
  counter = 0;
}
