import type {
  Organizations,
  OrgMembers,
  ClientProfiles,
  Events,
  Quotes,
  QuoteItems,
  CateringMenus,
  CateringCategories,
  CateringItems,
  CateringPackages,
  PaymentSchedules,
  PaymentMilestones,
  Invoices,
  InvoiceItems,
  Equipment,
  EquipmentAllocations,
  StaffAssignments,
  CateringStaff,
  Conversations,
  Messages,
  Reviews,
  PortfolioImages,
  OrgThemes,
  BlockedDates,
  PrepTasks,
  DeliveryPlans,
  Region,
  City,
  Profiles,
  Subscriptions,
  AnalyticsEvents,
  PushSubscriptions,
  EventStatus,
  EventType,
  QuoteStatus,
  OrgRole,
  OrgType,
  MenuType,
  UserRole,
  ReviewStatus,
} from "@prisma/client";

// ── Re-export Prisma Types ────────────────────────────────────

export type {
  Organizations,
  OrgMembers,
  ClientProfiles,
  Events,
  Quotes,
  QuoteItems,
  CateringMenus,
  CateringCategories,
  CateringItems,
  CateringPackages,
  PaymentSchedules,
  PaymentMilestones,
  Invoices,
  InvoiceItems,
  Equipment,
  EquipmentAllocations,
  StaffAssignments,
  CateringStaff,
  Conversations,
  Messages,
  Reviews,
  PortfolioImages,
  OrgThemes,
  BlockedDates,
  PrepTasks,
  DeliveryPlans,
  Region,
  City,
  Profiles,
  Subscriptions,
  AnalyticsEvents,
  PushSubscriptions,
};

// ── Re-export Prisma Enums ────────────────────────────────────

export type {
  EventStatus,
  EventType,
  QuoteStatus,
  OrgRole,
  OrgType,
  MenuType,
  UserRole,
  ReviewStatus,
};

// ── Composite Domain Types ────────────────────────────────────

/** Organization with member count */
export type OrgWithMembers = Organizations & {
  members: OrgMembers[];
};

/** Event with full relations */
export type EventWithRelations = Events & {
  quotes: Quotes[];
  staffAssignments: StaffAssignments[];
  client: ClientProfiles | null;
};

/** Quote with items */
export type QuoteWithItems = Quotes & {
  items: QuoteItems[];
  event: Pick<Events, "id" | "title" | "eventType" | "eventDate" | "guestCount" | "customerName">;
};

/** Catering menu with full tree */
export type MenuWithTree = CateringMenus & {
  categories: (CateringCategories & {
    cateringItems: CateringItems[];
  })[];
  packages: CateringPackages[];
};

/** Invoice with line items */
export type InvoiceWithItems = Invoices & {
  lineItems: InvoiceItems[];
  event: Pick<Events, "id" | "title" | "customerName" | "eventDate">;
};

/** Payment schedule with milestones */
export type ScheduleWithMilestones = PaymentSchedules & {
  milestones: PaymentMilestones[];
};

/** Review item for display (field names match Prisma Reviews model) */
export type ReviewItem = {
  id: string;
  reviewerName: string;
  ratingOverall: number;
  ratingFoodQuality: number | null;
  ratingPresentation: number | null;
  ratingServiceStaff: number | null;
  ratingPunctuality: number | null;
  ratingValueForMoney: number | null;
  ratingCommunication: number | null;
  comment: string | null;
  eventType: string | null;
  guestCount: number | null;
  response: string | null;
  respondedAt: Date | null;
  isVerified: boolean;
  isFeatured: boolean;
  status: string;
  createdAt: Date;
};

/** Review with associated organization */
export type ReviewWithOrg = Reviews & {
  org: Pick<Organizations, "id" | "name" | "slug">;
};

/** Review with associated event */
export type ReviewWithEvent = Reviews & {
  event: Pick<Events, "id" | "title" | "eventType" | "eventDate"> | null;
};

/** Profile with subscription */
export type ProfileWithSubscription = Profiles & {
  subscriptions: Subscriptions | null;
};
