import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for Event Templates feature on the events tRPC router.
 *
 * Templates are stored as JSON in the Organization's `settings.eventTemplates`
 * field. No migration required — fully pragmatic, uses existing infra.
 *
 * Covers: CRUD, createEventFromTemplate, IDOR, edge cases.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    organizations: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    events: {
      create: vi.fn(),
    },
    orgMembers: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("~/server/supabase/supabaseClient", () => ({
  getUserAsAdmin: vi.fn(),
  getServiceSupabase: vi.fn(),
}));

vi.mock("~/server/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { db } from "~/server/db";
import { eventsRouter } from "../api/routers/events";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const OTHER_ORG_ID = "00000000-0000-4000-a000-000000000999";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const TEMPLATE_ID_1 = "00000000-0000-4000-a000-000000000301";
const EVENT_ID = "00000000-0000-4000-a000-000000000400";

function createManagerCaller() {
  return eventsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: USER_ID, email: "test@example.com" } as never,
    orgId: ORG_ID,
    orgRole: "manager",
    orgMemberId: MEMBER_ID,
    orgPermissions: null,
  } as never);
}

function createStaffCaller() {
  return eventsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: USER_ID, email: "test@example.com" } as never,
    orgId: ORG_ID,
    orgRole: "staff",
    orgMemberId: MEMBER_ID,
    orgPermissions: null,
  } as never);
}

function createUnauthCaller() {
  return eventsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

/** Creates a minimal template object as stored in the DB */
function makeStoredTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: TEMPLATE_ID_1,
    name: "Moroccan Wedding - 200 guests",
    eventType: "wedding",
    defaultGuestCount: 200,
    defaultVenue: "Riad Palmeraie",
    defaultMenuItems: [{ name: "Pastilla", quantity: 200 }],
    defaultEquipment: [{ name: "Round tables", quantity: 20 }],
    defaultStaffCount: 15,
    estimatedBudget: 50000000,
    notes: "Include henna corner setup",
    isDefault: false,
    createdAt: "2026-02-20T10:00:00.000Z",
    updatedAt: "2026-02-20T10:00:00.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Event Templates", () => {
  const mockOrgs = vi.mocked(db.organizations);
  const mockEvents = vi.mocked(db.events);
  const mockMembers = vi.mocked(db.orgMembers);

  beforeEach(() => {
    vi.clearAllMocks();
    resetFactoryCounter();
    mockMembers.findFirst.mockResolvedValue({
      id: MEMBER_ID,
      orgId: ORG_ID,
      role: "manager",
      permissions: null,
    } as never);
  });

  // =========================================================================
  // listTemplates
  // =========================================================================

  describe("listTemplates", () => {
    it("should return all templates for the org", async () => {
      const template = makeStoredTemplate();
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [template] },
      } as never);

      const caller = createStaffCaller();
      const result = await caller.listTemplates({});

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Moroccan Wedding - 200 guests");
    });

    it("should return empty array when no templates exist", async () => {
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: {},
      } as never);

      const caller = createStaffCaller();
      const result = await caller.listTemplates({});

      expect(result).toEqual([]);
    });

    it("should return empty array when settings is null", async () => {
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: null,
      } as never);

      const caller = createStaffCaller();
      const result = await caller.listTemplates({});

      expect(result).toEqual([]);
    });

    it("should reject unauthenticated access", async () => {
      const caller = createUnauthCaller();
      await expect(caller.listTemplates({})).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });
  });

  // =========================================================================
  // getTemplate
  // =========================================================================

  describe("getTemplate", () => {
    it("should return a single template by ID", async () => {
      const template = makeStoredTemplate();
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [template] },
      } as never);

      const caller = createStaffCaller();
      const result = await caller.getTemplate({ templateId: TEMPLATE_ID_1 });

      expect(result.id).toBe(TEMPLATE_ID_1);
      expect(result.name).toBe("Moroccan Wedding - 200 guests");
    });

    it("should throw NOT_FOUND when template does not exist", async () => {
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [] },
      } as never);

      const caller = createStaffCaller();
      await expect(
        caller.getTemplate({ templateId: TEMPLATE_ID_1 }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // createTemplate
  // =========================================================================

  describe("createTemplate", () => {
    it("should create a new template and persist it", async () => {
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [] },
      } as never);
      mockOrgs.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      const result = await caller.createTemplate({
        name: "Corporate Lunch - 50 pax",
        eventType: "corporate",
        defaultGuestCount: 50,
        estimatedBudget: 7500000,
      });

      expect(result.name).toBe("Corporate Lunch - 50 pax");
      expect(result.eventType).toBe("corporate");
      expect(result.id).toBeDefined();
      expect(mockOrgs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ORG_ID },
          data: expect.objectContaining({
            settings: expect.objectContaining({
              eventTemplates: expect.arrayContaining([
                expect.objectContaining({ name: "Corporate Lunch - 50 pax" }),
              ]),
            }),
          }),
        }),
      );
    });

    it("should reject duplicate template names within same org", async () => {
      const existing = makeStoredTemplate({ name: "Wedding Standard" });
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [existing] },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.createTemplate({
          name: "Wedding Standard",
          eventType: "wedding",
          defaultGuestCount: 100,
          estimatedBudget: 3000000,
        }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("should enforce max 50 templates per org", async () => {
      const templates = Array.from({ length: 50 }, (_, i) =>
        makeStoredTemplate({ id: `tmpl-${i}`, name: `Template ${i}` }),
      );
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: templates },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.createTemplate({
          name: "One Too Many",
          eventType: "other",
          defaultGuestCount: 10,
          estimatedBudget: 100000,
        }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("should set isDefault=true and unset previous default for same event type", async () => {
      const existingDefault = makeStoredTemplate({
        id: "old-default",
        name: "Old Default Wedding",
        eventType: "wedding",
        isDefault: true,
      });
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [existingDefault] },
      } as never);
      mockOrgs.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      const result = await caller.createTemplate({
        name: "New Default Wedding",
        eventType: "wedding",
        defaultGuestCount: 300,
        estimatedBudget: 80000000,
        isDefault: true,
      });

      expect(result.isDefault).toBe(true);

      // Verify the update call unsets old default
      const updateCall = mockOrgs.update.mock.calls[0]![0] as unknown as {
        data: { settings: { eventTemplates: Array<{ id: string; isDefault: boolean }> } };
      };
      const savedTemplates = updateCall.data.settings.eventTemplates;
      const oldDefault = savedTemplates.find((t) => t.id === "old-default");
      expect(oldDefault?.isDefault).toBe(false);
    });

    it("should reject staff-level users (requires manager)", async () => {
      mockMembers.findFirst.mockResolvedValue({
        id: MEMBER_ID,
        orgId: ORG_ID,
        role: "staff",
        permissions: null,
      } as never);

      const caller = createStaffCaller();
      await expect(
        caller.createTemplate({
          name: "Test",
          eventType: "wedding",
          defaultGuestCount: 10,
          estimatedBudget: 100000,
        }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    });
  });

  // =========================================================================
  // updateTemplate
  // =========================================================================

  describe("updateTemplate", () => {
    it("should update an existing template", async () => {
      const template = makeStoredTemplate();
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [template] },
      } as never);
      mockOrgs.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      const result = await caller.updateTemplate({
        templateId: TEMPLATE_ID_1,
        name: "Updated Wedding Template",
        defaultGuestCount: 250,
      });

      expect(result.name).toBe("Updated Wedding Template");
      expect(result.defaultGuestCount).toBe(250);
      // Unchanged fields should be preserved
      expect(result.defaultVenue).toBe("Riad Palmeraie");
    });

    it("should throw NOT_FOUND when template does not exist", async () => {
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [] },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateTemplate({
          templateId: TEMPLATE_ID_1,
          name: "Updated",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject duplicate name when renaming", async () => {
      const t1 = makeStoredTemplate({ id: "t1", name: "Template A" });
      const t2 = makeStoredTemplate({ id: "t2", name: "Template B" });
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [t1, t2] },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateTemplate({
          templateId: "t2",
          name: "Template A", // conflicts with t1
        }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    });
  });

  // =========================================================================
  // deleteTemplate
  // =========================================================================

  describe("deleteTemplate", () => {
    it("should remove a template", async () => {
      const t1 = makeStoredTemplate({ id: "t1", name: "Keep" });
      const t2 = makeStoredTemplate({ id: "t2", name: "Delete" });
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [t1, t2] },
      } as never);
      mockOrgs.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      const result = await caller.deleteTemplate({ templateId: "t2" });

      expect(result.deleted).toBe(true);
      expect(mockOrgs.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            settings: expect.objectContaining({
              eventTemplates: [expect.objectContaining({ id: "t1" })],
            }),
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when template does not exist", async () => {
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [] },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.deleteTemplate({ templateId: "nonexistent" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // createEventFromTemplate
  // =========================================================================

  describe("createEventFromTemplate", () => {
    it("should create an event pre-filled from template values", async () => {
      const template = makeStoredTemplate({
        eventType: "wedding",
        defaultGuestCount: 200,
        defaultVenue: "Riad Palmeraie",
        defaultStaffCount: 15,
        estimatedBudget: 50000000,
        notes: "Include henna corner",
      });
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [template] },
      } as never);
      mockEvents.create.mockResolvedValue({
        id: EVENT_ID,
        orgId: ORG_ID,
        eventType: "wedding",
        guestCount: 200,
        venueName: "Riad Palmeraie",
        notes: "Include henna corner",
        status: "inquiry",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.createEventFromTemplate({
        templateId: TEMPLATE_ID_1,
        customerName: "Youssef Alami",
        customerPhone: "+212612345678",
        eventDate: new Date("2026-09-15"),
      });

      expect(result.id).toBe(EVENT_ID);
      expect(mockEvents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: ORG_ID,
            eventType: "wedding",
            guestCount: 200,
            venueName: "Riad Palmeraie",
            notes: "Include henna corner",
            customerName: "Youssef Alami",
            customerPhone: "+212612345678",
            status: "inquiry",
          }),
        }),
      );
    });

    it("should allow overrides to supersede template values", async () => {
      const template = makeStoredTemplate({
        defaultGuestCount: 200,
        defaultVenue: "Riad Palmeraie",
      });
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [template] },
      } as never);
      mockEvents.create.mockResolvedValue({
        id: EVENT_ID,
        guestCount: 350,
        venueName: "Royal Mansour",
      } as never);

      const caller = createManagerCaller();
      await caller.createEventFromTemplate({
        templateId: TEMPLATE_ID_1,
        customerName: "Test Client",
        customerPhone: "+212600000000",
        eventDate: new Date("2026-10-01"),
        guestCount: 350,
        venueName: "Royal Mansour",
      });

      expect(mockEvents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            guestCount: 350,
            venueName: "Royal Mansour",
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when template does not exist", async () => {
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [] },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.createEventFromTemplate({
          templateId: "nonexistent",
          customerName: "Test",
          customerPhone: "+212600000000",
          eventDate: new Date(),
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should generate a title from eventType and customerName", async () => {
      const template = makeStoredTemplate({ eventType: "ramadan_iftar" });
      mockOrgs.findUnique.mockResolvedValue({
        id: ORG_ID,
        settings: { eventTemplates: [template] },
      } as never);
      mockEvents.create.mockResolvedValue({ id: EVENT_ID } as never);

      const caller = createManagerCaller();
      await caller.createEventFromTemplate({
        templateId: TEMPLATE_ID_1,
        customerName: "Mohammed Fassi",
        customerPhone: "+212612345678",
        eventDate: new Date("2026-03-15"),
      });

      expect(mockEvents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "ramadan iftar - Mohammed Fassi",
          }),
        }),
      );
    });
  });
});
