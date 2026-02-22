import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the quotes tRPC router.
 * Covers quote CRUD, versioning, send, accept/reject, revise, and duplicate.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    quotes: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    events: {
      findFirst: vi.fn(),
      update: vi.fn(),
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
import { quotesRouter } from "../api/routers/quotes";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const EVENT_ID = "00000000-0000-4000-a000-000000000200";
const QUOTE_ID = "00000000-0000-4000-a000-000000000300";

function createOrgCaller(role: string = "staff") {
  return quotesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: { id: USER_ID, email: "test@example.com" } as never,
    orgId: ORG_ID,
    orgRole: role,
    orgMemberId: MEMBER_ID,
    orgPermissions: null,
  } as never);
}

function createManagerCaller() {
  return createOrgCaller("manager");
}

function createPublicCaller() {
  return quotesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

function sampleItems() {
  return [
    {
      sectionName: "Main Course",
      sectionOrder: 0,
      itemName: "Lamb Tagine",
      quantity: 150,
      unitType: "per_person" as const,
      unitPrice: 120,
      subtotal: 18000,
      itemOrder: 0,
    },
  ];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("quotesRouter", () => {
  const mockQuotes = vi.mocked(db.quotes);
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
  // listByEvent
  // =========================================================================

  describe("listByEvent", () => {
    it("should return quotes for an event ordered by version desc", async () => {
      const quotes = [
        { id: "q2", versionNumber: 2, status: "draft" },
        { id: "q1", versionNumber: 1, status: "superseded" },
      ];
      mockQuotes.findMany.mockResolvedValue(quotes as never);

      const caller = createOrgCaller();
      const result = await caller.listByEvent({ eventId: EVENT_ID });

      expect(result).toHaveLength(2);
      expect(mockQuotes.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { eventId: EVENT_ID, orgId: ORG_ID },
          orderBy: { versionNumber: "desc" },
        }),
      );
    });

    it("should return empty array when no quotes exist", async () => {
      mockQuotes.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      const result = await caller.listByEvent({ eventId: EVENT_ID });

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // listAll
  // =========================================================================

  describe("listAll", () => {
    it("should return paginated quotes", async () => {
      mockQuotes.findMany.mockResolvedValue([{ id: "q1" }] as never);

      const caller = createOrgCaller();
      const result = await caller.listAll({});

      expect(result.quotes).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should set nextCursor when more results exist", async () => {
      const quotes = Array.from({ length: 3 }, (_, i) => ({ id: `q${i}` }));
      mockQuotes.findMany.mockResolvedValue(quotes as never);

      const caller = createOrgCaller();
      const result = await caller.listAll({ limit: 2 });

      expect(result.quotes).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
    });
  });

  // =========================================================================
  // getById
  // =========================================================================

  describe("getById", () => {
    it("should return quote with items and event details", async () => {
      const quote = {
        id: QUOTE_ID,
        orgId: ORG_ID,
        items: [{ itemName: "Tagine" }],
        event: { id: EVENT_ID, title: "Wedding" },
      };
      mockQuotes.findFirst.mockResolvedValue(quote as never);

      const caller = createOrgCaller();
      const result = await caller.getById({ quoteId: QUOTE_ID });

      expect(result.id).toBe(QUOTE_ID);
    });

    it("should throw NOT_FOUND for non-existent quote", async () => {
      mockQuotes.findFirst.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      await expect(
        caller.getById({ quoteId: QUOTE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // create
  // =========================================================================

  describe("create", () => {
    it("should create quote with calculated totals (TVA 20%)", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, guestCount: 150 } as never);
      mockQuotes.findFirst.mockResolvedValue(null as never); // no previous version
      const createdQuote = { id: QUOTE_ID, versionNumber: 1, subtotal: 18000 };
      mockQuotes.create.mockResolvedValue(createdQuote as never);

      const caller = createManagerCaller();
      const result = await caller.create({
        eventId: EVENT_ID,
        items: sampleItems(),
      });

      expect(mockQuotes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventId: EVENT_ID,
            orgId: ORG_ID,
            versionNumber: 1,
            subtotal: 18000,
            tvaRate: 20,
            tvaAmount: 3600, // 18000 * 0.2
            totalAmount: 21600, // 18000 + 3600
            status: "draft",
          }),
        }),
      );
    });

    it("should increment version number from previous quotes", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, guestCount: 100 } as never);
      mockQuotes.findFirst.mockResolvedValue({ versionNumber: 3 } as never);
      mockQuotes.create.mockResolvedValue({ id: QUOTE_ID } as never);

      const caller = createManagerCaller();
      await caller.create({ eventId: EVENT_ID, items: sampleItems() });

      expect(mockQuotes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ versionNumber: 4 }),
        }),
      );
    });

    it("should throw NOT_FOUND when event does not belong to org", async () => {
      mockEvents.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.create({ eventId: EVENT_ID, items: sampleItems() }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject empty items array", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.create({ eventId: EVENT_ID, items: [] }),
      ).rejects.toThrow();
    });

    it("should calculate pricePerPerson from totalAmount and guestCount", async () => {
      mockEvents.findFirst.mockResolvedValue({ id: EVENT_ID, guestCount: 100 } as never);
      mockQuotes.findFirst.mockResolvedValue(null as never);
      mockQuotes.create.mockResolvedValue({ id: QUOTE_ID } as never);

      const caller = createManagerCaller();
      await caller.create({ eventId: EVENT_ID, items: sampleItems() });

      // totalAmount = 18000 + 3600 = 21600; pricePerPerson = 21600/100 = 216
      expect(mockQuotes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ pricePerPerson: 216 }),
        }),
      );
    });
  });

  // =========================================================================
  // send
  // =========================================================================

  describe("send", () => {
    it("should mark draft quote as sent and advance event", async () => {
      mockQuotes.findFirst.mockResolvedValue({
        id: QUOTE_ID,
        orgId: ORG_ID,
        status: "draft",
        event: { id: EVENT_ID, status: "reviewed" },
      } as never);
      mockQuotes.update.mockResolvedValue({} as never);
      mockEvents.update.mockResolvedValue({} as never);

      const caller = createManagerCaller();
      const result = await caller.send({ quoteId: QUOTE_ID });

      expect(result.success).toBe(true);
      expect(mockQuotes.update).toHaveBeenCalledWith({
        where: { id: QUOTE_ID },
        data: { status: "sent", sentAt: expect.any(Date) },
      });
      expect(mockEvents.update).toHaveBeenCalledWith({
        where: { id: EVENT_ID },
        data: { status: "quoted" },
      });
    });

    it("should reject sending non-draft quote", async () => {
      mockQuotes.findFirst.mockResolvedValue({
        id: QUOTE_ID,
        orgId: ORG_ID,
        status: "sent",
        event: { id: EVENT_ID, status: "quoted" },
      } as never);

      const caller = createManagerCaller();
      await expect(
        caller.send({ quoteId: QUOTE_ID }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("should throw NOT_FOUND for non-existent quote", async () => {
      mockQuotes.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.send({ quoteId: QUOTE_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // revise
  // =========================================================================

  describe("revise", () => {
    it("should supersede original and create new version", async () => {
      mockQuotes.findFirst
        .mockResolvedValueOnce({
          id: QUOTE_ID,
          orgId: ORG_ID,
          eventId: EVENT_ID,
          event: { id: EVENT_ID, guestCount: 100 },
        } as never) // original
        .mockResolvedValueOnce({ versionNumber: 2 } as never); // latest version
      mockQuotes.update.mockResolvedValue({} as never);
      mockQuotes.create.mockResolvedValue({ id: "new-quote" } as never);

      const caller = createManagerCaller();
      await caller.revise({
        quoteId: QUOTE_ID,
        items: sampleItems(),
      });

      // Should supersede original
      expect(mockQuotes.update).toHaveBeenCalledWith({
        where: { id: QUOTE_ID },
        data: { status: "superseded" },
      });
      // Should create new version
      expect(mockQuotes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionNumber: 3,
            status: "draft",
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when original quote not found", async () => {
      mockQuotes.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.revise({ quoteId: QUOTE_ID, items: sampleItems() }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // accept (public)
  // =========================================================================

  describe("accept", () => {
    it("should accept sent quote and update event to accepted", async () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      mockQuotes.findFirst.mockResolvedValue({
        id: QUOTE_ID,
        status: "sent",
        totalAmount: 50000,
        validUntil: futureDate,
        event: { id: EVENT_ID, customerPhone: "+212612345678", status: "quoted" },
      } as never);
      mockQuotes.update.mockResolvedValue({} as never);
      mockEvents.update.mockResolvedValue({} as never);

      const caller = createPublicCaller();
      const result = await caller.accept({
        quoteId: QUOTE_ID,
        clientPhone: "+212612345678",
      });

      expect(result.success).toBe(true);
      expect(mockEvents.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "accepted",
            totalAmount: 50000,
            balanceDue: 50000,
          }),
        }),
      );
    });

    it("should reject if phone does not match", async () => {
      mockQuotes.findFirst.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.accept({ quoteId: QUOTE_ID, clientPhone: "+212600000000" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject if quote is not in sent status", async () => {
      mockQuotes.findFirst.mockResolvedValue({
        id: QUOTE_ID,
        status: "draft",
        event: { id: EVENT_ID, customerPhone: "+212612345678" },
      } as never);

      const caller = createPublicCaller();
      await expect(
        caller.accept({ quoteId: QUOTE_ID, clientPhone: "+212612345678" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });

    it("should reject expired quote", async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      mockQuotes.findFirst.mockResolvedValue({
        id: QUOTE_ID,
        status: "sent",
        validUntil: pastDate,
        event: { id: EVENT_ID, customerPhone: "+212612345678", status: "quoted" },
      } as never);

      const caller = createPublicCaller();
      await expect(
        caller.accept({ quoteId: QUOTE_ID, clientPhone: "+212612345678" }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  });

  // =========================================================================
  // reject (public)
  // =========================================================================

  describe("reject", () => {
    it("should mark quote as rejected", async () => {
      mockQuotes.findFirst.mockResolvedValue({
        id: QUOTE_ID,
        event: { id: EVENT_ID, customerPhone: "+212612345678" },
      } as never);
      mockQuotes.update.mockResolvedValue({} as never);

      const caller = createPublicCaller();
      const result = await caller.reject({
        quoteId: QUOTE_ID,
        clientPhone: "+212612345678",
      });

      expect(result.success).toBe(true);
      expect(mockQuotes.update).toHaveBeenCalledWith({
        where: { id: QUOTE_ID },
        data: { status: "rejected", respondedAt: expect.any(Date) },
      });
    });

    it("should throw NOT_FOUND when phone mismatch", async () => {
      mockQuotes.findFirst.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.reject({ quoteId: QUOTE_ID, clientPhone: "+212600000000" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // duplicate
  // =========================================================================

  describe("duplicate", () => {
    it("should duplicate quote to target event", async () => {
      const TARGET_EVENT = "00000000-0000-4000-a000-000000000999";
      mockQuotes.findFirst
        .mockResolvedValueOnce({
          id: QUOTE_ID,
          orgId: ORG_ID,
          eventId: EVENT_ID,
          subtotal: 20000,
          tvaRate: 20,
          tvaAmount: 4000,
          totalAmount: 24000,
          pricePerPerson: 240,
          notes: "Some notes",
          termsAndConditions: "T&C",
          items: [{ sectionName: "Main", itemName: "Tagine", quantity: 100, unitType: "per_person", unitPrice: 200, subtotal: 20000, sectionOrder: 0, itemOrder: 0 }],
        } as never) // source quote
        .mockResolvedValueOnce(null as never); // no existing quote on target
      mockQuotes.create.mockResolvedValue({ id: "duplicated" } as never);

      const caller = createManagerCaller();
      await caller.duplicate({
        quoteId: QUOTE_ID,
        targetEventId: TARGET_EVENT,
      });

      expect(mockQuotes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventId: TARGET_EVENT,
            orgId: ORG_ID,
            versionNumber: 1,
            status: "draft",
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when source quote not found", async () => {
      mockQuotes.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.duplicate({
          quoteId: QUOTE_ID,
          targetEventId: "00000000-0000-4000-a000-000000000999",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // Authentication
  // =========================================================================

  describe("authentication", () => {
    it("should reject unauthenticated access to listByEvent", async () => {
      const caller = createPublicCaller();
      await expect(
        caller.listByEvent({ eventId: EVENT_ID }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should allow unauthenticated access to accept", async () => {
      // accept is a publicProcedure — should not throw UNAUTHORIZED
      mockQuotes.findFirst.mockResolvedValue(null as never);
      const caller = createPublicCaller();
      // It should throw NOT_FOUND, not UNAUTHORIZED
      await expect(
        caller.accept({ quoteId: QUOTE_ID, clientPhone: "+212612345678" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
