/**
 * Test data factories for Diyafa models.
 *
 * Each factory generates realistic catering/event data with sensible defaults.
 * All IDs are deterministic UUIDs seeded by an incrementing counter so tests
 * remain predictable when no override is supplied.
 *
 * Prices are stored as integers (centimes): 1999 = 19.99 MAD (matches Prisma schema).
 */

import { Prisma } from "@prisma/client";
import type {
  CateringMenus,
  CateringCategories,
  CateringItems,
  Profiles,
  Reviews,
  Organizations,
  OrgThemes,
  Events,
  Quotes,
  QuoteItems,
  CateringPackages,
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

// Pools of realistic catering data
const ORG_NAMES = [
  "Diyafa Royale",
  "Riad Casablanca Traiteur",
  "Le Festin du Souk",
  "Atlas Grill Catering",
  "Dar Tanjia Events",
  "Cafe Medina Traiteur",
  "La Table du Palais",
  "Bab Mansour Catering",
] as const;

const ITEM_NAMES = [
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
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Organization (replaces Restaurant)
// ---------------------------------------------------------------------------

export function createRestaurant(overrides?: Partial<Organizations>): Organizations {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    name: ORG_NAMES[counter % ORG_NAMES.length]!,
    slug: `org-${id.slice(-6)}`,
    type: "caterer",
    description: "Authentic Moroccan catering for weddings and events.",
    bio: null,
    tagline: null,
    city: CITIES[counter % CITIES.length]!,
    address: STREETS[counter % STREETS.length]!,
    latitude: null,
    longitude: null,
    serviceAreas: [],
    phone: "+212522123456",
    email: "contact@example.com",
    whatsappNumber: null,
    website: "https://example.com",
    instagram: null,
    facebook: null,
    cuisines: ["Moroccan"],
    specialties: [],
    eventTypes: [],
    serviceStyles: [],
    languages: ["ar", "fr"],
    minGuests: 10,
    maxGuests: 500,
    priceRange: "mid",
    yearsInBusiness: null,
    teamSize: null,
    priceMin: null,
    priceMax: null,
    logoUrl: null,
    coverImageUrl: null,
    isVerified: false,
    verifiedAt: null,
    registreCommerce: null,
    identifiantFiscal: null,
    rating: null,
    reviewCount: 0,
    totalEventsCompleted: 0,
    avgResponseTimeMin: null,
    bookingRate: null,
    isActive: true,
    isPublished: false,
    isFeatured: false,
    subscriptionTier: "free",
    settings: null,
    defaultPaymentTemplate: "standard",
    defaultLeadTimeDays: 7,
    autoReplyEnabled: false,
    autoReplyMessage: null,
    currency: "MAD",
    metaTitle: null,
    metaDescription: null,
    createdAt: recentDate(60),
    updatedAt: recentDate(2),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: CateringMenu (replaces Menu)
// ---------------------------------------------------------------------------

export function createMenu(overrides?: Partial<CateringMenus>): CateringMenus {
  const id = overrides?.id ?? nextUuid();
  const name =
    overrides?.name ??
    `${ORG_NAMES[counter % ORG_NAMES.length]!} Menu`;
  const slug =
    overrides?.slug ??
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
      `-${id.slice(-6)}`;

  return {
    id,
    orgId: overrides?.orgId ?? nextUuid(),
    name,
    slug,
    description: null,
    menuType: "per_head",
    eventType: "general",
    minGuests: 10,
    maxGuests: null,
    basePricePerPerson: 15000,
    currency: "MAD",
    leadTimeDays: 3,
    dietaryTags: [],
    cuisineType: "Moroccan",
    photos: [],
    serviceOptions: { setup: true, cleanup: false, delivery: true, staffService: false, equipmentRental: false },
    isPublished: true,
    isActive: true,
    isFeatured: false,
    metaTitle: null,
    metaDescription: null,
    createdAt: recentDate(30),
    updatedAt: recentDate(0),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: CateringCategory (replaces Category)
// ---------------------------------------------------------------------------

export function createCategory(overrides?: Partial<CateringCategories>): CateringCategories {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    cateringMenuId: overrides?.cateringMenuId ?? nextUuid(),
    name: CATEGORY_NAMES[counter % CATEGORY_NAMES.length]!,
    nameAr: null,
    nameFr: null,
    description: null,
    sortOrder: counter % 10,
    isOptional: false,
    maxSelections: null,
    createdAt: recentDate(20),
    ...overrides,
  };
}

/**
 * Convenience: returns a category name from the realistic pool.
 */
export function getCategoryName(index = 0): string {
  return CATEGORY_NAMES[index % CATEGORY_NAMES.length]!;
}

// ---------------------------------------------------------------------------
// Factory: CateringItem (replaces Dish)
// ---------------------------------------------------------------------------

export function createDish(overrides?: Partial<CateringItems>): CateringItems {
  const id = overrides?.id ?? nextUuid();
  const nameIndex = counter % ITEM_NAMES.length;

  return {
    id,
    cateringCategoryId: overrides?.cateringCategoryId ?? nextUuid(),
    cateringMenuId: overrides?.cateringMenuId ?? nextUuid(),
    name: ITEM_NAMES[nameIndex]!,
    nameAr: null,
    nameFr: null,
    description: null,
    descriptionAr: null,
    descriptionFr: null,
    pricePerPerson: overrides?.pricePerPerson ?? 3500 + (nameIndex * 500),
    pricePerUnit: null,
    unitLabel: null,
    minQuantity: 1,
    servesCount: null,
    isIncluded: true,
    isOptional: false,
    isVegetarian: false,
    isVegan: false,
    isHalal: true,
    isGlutenFree: false,
    allergens: [],
    dietaryInfo: null,
    imageUrl: null,
    sortOrder: counter % 20,
    isAvailable: true,
    createdAt: recentDate(15),
    ...overrides,
  };
}

/**
 * Convenience: returns a dish/item name from the realistic pool.
 */
export function getDishName(index = 0): string {
  return ITEM_NAMES[index % ITEM_NAMES.length]!;
}

// ---------------------------------------------------------------------------
// Factory: CateringPackage (replaces DishVariant)
// ---------------------------------------------------------------------------

export function createDishVariant(overrides?: Partial<CateringPackages>): CateringPackages {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    cateringMenuId: overrides?.cateringMenuId ?? nextUuid(),
    name: "Gold Wedding Package",
    nameAr: null,
    nameFr: null,
    description: null,
    pricePerPerson: overrides?.pricePerPerson ?? 4500,
    minGuests: 10,
    maxGuests: null,
    isFeatured: false,
    sortOrder: 0,
    imageUrl: null,
    includesText: null,
    createdAt: recentDate(10),
    updatedAt: recentDate(1),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Review (multi-dimensional, org-scoped)
// ---------------------------------------------------------------------------

export function createReview(overrides?: Partial<Reviews>): Reviews {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    orgId: overrides?.orgId ?? nextUuid(),
    eventId: null,
    clientId: null,
    reviewerName: "Fatima Zahra",
    reviewerPhone: "+212612345678",
    eventType: null,
    guestCount: null,
    eventDate: null,
    ratingOverall: 4,
    ratingFoodQuality: null,
    ratingPresentation: null,
    ratingServiceStaff: null,
    ratingPunctuality: null,
    ratingValueForMoney: null,
    ratingCommunication: null,
    comment: "Excellent tagine, the lamb was perfectly tender.",
    photos: [],
    response: null,
    respondedAt: null,
    status: "pending",
    isVerified: false,
    isPublished: false,
    isFeatured: false,
    createdAt: recentDate(3),
    updatedAt: recentDate(3),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Event (replaces Order — full lifecycle)
// ---------------------------------------------------------------------------

export function createOrder(overrides?: Partial<Events>): Events {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    orgId: overrides?.orgId ?? nextUuid(),
    clientId: null,
    title: "Wedding Reception",
    description: null,
    eventType: "wedding",
    eventDate: recentDate(-7),
    eventEndDate: null,
    startTime: null,
    endTime: null,
    isMultiDay: false,
    venueName: "Riad Palmeraie",
    venueAddress: STREETS[counter % STREETS.length]!,
    venueCity: CITIES[counter % CITIES.length]!,
    venueLat: null,
    venueLng: null,
    guestCount: 150,
    confirmedGuestCount: null,
    dietaryRequirements: [],
    customerName: "Ahmed Tazi",
    customerPhone: "+212612345678",
    customerEmail: null,
    serviceStyle: null,
    budgetMin: null,
    budgetMax: null,
    specialRequests: null,
    source: "direct",
    status: "inquiry",
    totalAmount: 0,
    depositAmount: 0,
    balanceDue: 0,
    notes: null,
    internalNotes: null,
    lastMessageAt: null,
    lastActivityAt: recentDate(0),
    createdAt: recentDate(0),
    updatedAt: recentDate(0),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: QuoteItem (replaces OrderItem)
// ---------------------------------------------------------------------------

export function createOrderItem(overrides?: Partial<QuoteItems>): QuoteItems {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    quoteId: overrides?.quoteId ?? nextUuid(),
    sectionName: "Main Course",
    sectionOrder: 0,
    itemName: ITEM_NAMES[counter % ITEM_NAMES.length]!,
    itemDescription: null,
    quantity: 2,
    unitType: "per_person",
    unitPrice: 3500,
    subtotal: 7000,
    itemOrder: 0,
    cateringItemId: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: OrgTheme (replaces MenuTheme)
// ---------------------------------------------------------------------------

export function createMenuTheme(overrides?: Partial<OrgThemes>): OrgThemes {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    orgId: overrides?.orgId ?? nextUuid(),
    primaryColor: "#B8860B",
    secondaryColor: "#8B6914",
    backgroundColor: "#FFFDF7",
    surfaceColor: "#FFFFFF",
    textColor: "#1A1A1A",
    accentColor: "#C2703E",
    headingFont: "Cormorant",
    bodyFont: "EB Garamond",
    layoutStyle: "elegant",
    cardStyle: "elevated",
    borderRadius: "medium",
    headerStyle: "banner",
    customCss: "",
    createdAt: recentDate(10),
    updatedAt: recentDate(1),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Quote (replaces Promotion — versioned proposals)
// ---------------------------------------------------------------------------

export function createPromotion(overrides?: Partial<Quotes>): Quotes {
  const id = overrides?.id ?? nextUuid();

  return {
    id,
    eventId: overrides?.eventId ?? nextUuid(),
    orgId: overrides?.orgId ?? nextUuid(),
    versionNumber: 1,
    status: "draft",
    subtotal: 75000,
    seasonalAdjustment: 0,
    volumeDiscount: 0,
    additionalCharges: 0,
    tvaRate: new Prisma.Decimal(0),
    tvaAmount: 0,
    totalAmount: 75000,
    pricePerPerson: 5000,
    validUntil: null,
    cancellationPolicy: null,
    termsAndConditions: null,
    notes: null,
    pdfUrl: null,
    createdAt: recentDate(7),
    sentAt: null,
    viewedAt: null,
    respondedAt: null,
    expiredAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Factory: Location (stub — no direct equivalent in new schema)
// Kept for backward-compatibility with tests that import createLocation.
// Returns a plain object matching the shape tests expect.
// ---------------------------------------------------------------------------

export function createLocation(overrides?: Record<string, unknown>): Record<string, unknown> {
  const id = (overrides?.id as string) ?? nextUuid();

  return {
    id,
    orgId: nextUuid(),
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
// Reset helper (call in beforeEach if you want deterministic ordering)
// ---------------------------------------------------------------------------

export function resetFactoryCounter(): void {
  counter = 0;
}
