import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the clients CRM tRPC router.
 * Covers client CRUD, tags, notes, segments, CSV export.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    clientProfiles: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    events: {
      findMany: vi.fn(),
    },
    orgMembers: {
      findFirst: vi.fn(),
    },
    profiles: {
      findUnique: vi.fn(),
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
import { clientsRouter } from "../api/routers/clients";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const CLIENT_ID = "00000000-0000-4000-a000-000000000600";

function createOrgCaller(role: string = "staff") {
  return clientsRouter.createCaller({
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

function createAdminCaller() {
  return createOrgCaller("admin");
}

function createUnauthCaller() {
  return clientsRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("clientsRouter", () => {
  const mockClients = vi.mocked(db.clientProfiles);
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
  // list
  // =========================================================================

  describe("list", () => {
    it("should return clients scoped via events to the org", async () => {
      const clients = [
        { id: CLIENT_ID, name: "Ahmed Tazi", phone: "+212612345678" },
      ];
      mockClients.findMany.mockResolvedValue(clients as never);

      const caller = createOrgCaller();
      const result = await caller.list({});

      expect(result.clients).toHaveLength(1);
      expect(mockClients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            events: { some: { orgId: ORG_ID } },
          }),
        }),
      );
    });

    it("should handle cursor pagination", async () => {
      const clients = Array.from({ length: 3 }, (_, i) => ({ id: `c${i}`, name: `Client ${i}` }));
      mockClients.findMany.mockResolvedValue(clients as never);

      const caller = createOrgCaller();
      const result = await caller.list({ limit: 2 });

      expect(result.clients).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
    });

    it("should filter by search term across name, phone, email", async () => {
      mockClients.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ search: "Ahmed" });

      expect(mockClients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.anything() }),
              expect.objectContaining({ phone: expect.anything() }),
              expect.objectContaining({ email: expect.anything() }),
            ]),
          }),
        }),
      );
    });

    it("should filter by tags", async () => {
      mockClients.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ tags: ["vip", "corporate"] });

      expect(mockClients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasSome: ["vip", "corporate"] },
          }),
        }),
      );
    });

    it("should filter by city", async () => {
      mockClients.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ city: "Casablanca" });

      expect(mockClients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { equals: "Casablanca", mode: "insensitive" },
          }),
        }),
      );
    });

    it("should support different sort options", async () => {
      mockClients.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.list({ sortBy: "events" });

      expect(mockClients.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { totalEventsBooked: "desc" },
        }),
      );
    });
  });

  // =========================================================================
  // getById
  // =========================================================================

  describe("getById", () => {
    it("should return client with event history for this org", async () => {
      const client = { id: CLIENT_ID, name: "Ahmed Tazi" };
      mockClients.findFirst.mockResolvedValue(client as never);
      mockEvents.findMany.mockResolvedValue([
        { id: "e1", title: "Wedding", status: "completed" },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.getById({ clientId: CLIENT_ID });

      expect(result.name).toBe("Ahmed Tazi");
      expect(result.events).toHaveLength(1);
    });

    it("should throw NOT_FOUND when client has no events for this org", async () => {
      mockClients.findFirst.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      await expect(
        caller.getById({ clientId: CLIENT_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject invalid UUID", async () => {
      const caller = createOrgCaller();
      await expect(
        caller.getById({ clientId: "not-a-uuid" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // create
  // =========================================================================

  describe("create", () => {
    it("should create a new client profile", async () => {
      const created = { id: CLIENT_ID, name: "Fatima Zahra", totalEventsBooked: 0 };
      mockClients.create.mockResolvedValue(created as never);

      const caller = createManagerCaller();
      const result = await caller.create({
        name: "Fatima Zahra",
        phone: "+212612345678",
        city: "Marrakech",
      });

      expect(result.name).toBe("Fatima Zahra");
      expect(mockClients.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Fatima Zahra",
          phone: "+212612345678",
          city: "Marrakech",
          totalEventsBooked: 0,
        }),
      });
    });

    it("should reject name shorter than 2 characters", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.create({ name: "A" }),
      ).rejects.toThrow();
    });

    it("should accept optional language preference", async () => {
      mockClients.create.mockResolvedValue({ id: CLIENT_ID } as never);

      const caller = createManagerCaller();
      await caller.create({
        name: "Mohamed Ali",
        preferredLanguage: "ar",
      });

      expect(mockClients.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ preferredLanguage: "ar" }),
      });
    });

    it("should reject invalid email format", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.create({ name: "Test User", email: "invalid-email" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // update
  // =========================================================================

  describe("update", () => {
    it("should update client profile", async () => {
      mockClients.findFirst.mockResolvedValue({ id: CLIENT_ID } as never);
      mockClients.update.mockResolvedValue({ id: CLIENT_ID, name: "Updated" } as never);

      const caller = createManagerCaller();
      const result = await caller.update({
        clientId: CLIENT_ID,
        name: "Updated",
      });

      expect(mockClients.update).toHaveBeenCalledWith({
        where: { id: CLIENT_ID },
        data: { name: "Updated" },
      });
    });

    it("should throw NOT_FOUND when client does not belong to org", async () => {
      mockClients.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.update({ clientId: CLIENT_ID, name: "Test" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // addNote
  // =========================================================================

  describe("addNote", () => {
    it("should append note with timestamp to existing notes", async () => {
      mockClients.findFirst.mockResolvedValue({
        id: CLIENT_ID,
        notes: "Previous note",
      } as never);
      mockClients.update.mockResolvedValue({ id: CLIENT_ID } as never);

      const caller = createManagerCaller();
      await caller.addNote({ clientId: CLIENT_ID, note: "Follow-up call" });

      expect(mockClients.update).toHaveBeenCalledWith({
        where: { id: CLIENT_ID },
        data: {
          notes: expect.stringContaining("Follow-up call"),
        },
      });
      // Should also contain the previous note
      const updateCall = mockClients.update.mock.calls[0]![0] as { data: { notes: string } };
      expect(updateCall.data.notes).toContain("Previous note");
    });

    it("should create first note when notes is null", async () => {
      mockClients.findFirst.mockResolvedValue({
        id: CLIENT_ID,
        notes: null,
      } as never);
      mockClients.update.mockResolvedValue({ id: CLIENT_ID } as never);

      const caller = createManagerCaller();
      await caller.addNote({ clientId: CLIENT_ID, note: "First note" });

      const updateCall = mockClients.update.mock.calls[0]![0] as { data: { notes: string } };
      expect(updateCall.data.notes).toContain("First note");
      expect(updateCall.data.notes).toMatch(/^\[.+\] First note$/);
    });

    it("should throw NOT_FOUND when client not in org", async () => {
      mockClients.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.addNote({ clientId: CLIENT_ID, note: "Test" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject empty note", async () => {
      const caller = createManagerCaller();
      await expect(
        caller.addNote({ clientId: CLIENT_ID, note: "" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // updateTags
  // =========================================================================

  describe("updateTags", () => {
    it("should replace tags on client", async () => {
      mockClients.findFirst.mockResolvedValue({ id: CLIENT_ID } as never);
      mockClients.update.mockResolvedValue({ id: CLIENT_ID, tags: ["vip"] } as never);

      const caller = createManagerCaller();
      await caller.updateTags({ clientId: CLIENT_ID, tags: ["vip"] });

      expect(mockClients.update).toHaveBeenCalledWith({
        where: { id: CLIENT_ID },
        data: { tags: ["vip"] },
      });
    });

    it("should throw NOT_FOUND when client not in org", async () => {
      mockClients.findFirst.mockResolvedValue(null as never);

      const caller = createManagerCaller();
      await expect(
        caller.updateTags({ clientId: CLIENT_ID, tags: ["test"] }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  // =========================================================================
  // getTags
  // =========================================================================

  describe("getTags", () => {
    it("should return unique sorted tags across all org clients", async () => {
      mockClients.findMany.mockResolvedValue([
        { tags: ["vip", "corporate"] },
        { tags: ["vip", "repeat"] },
        { tags: null },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.getTags({});

      expect(result).toEqual(["corporate", "repeat", "vip"]);
    });

    it("should return empty array when no tags exist", async () => {
      mockClients.findMany.mockResolvedValue([
        { tags: null },
        { tags: [] },
      ] as never);

      const caller = createOrgCaller();
      const result = await caller.getTags({});

      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // getSegments
  // =========================================================================

  describe("getSegments", () => {
    it("should return segment counts", async () => {
      mockClients.count
        .mockResolvedValueOnce(100 as never)  // total
        .mockResolvedValueOnce(15 as never)   // vip
        .mockResolvedValueOnce(30 as never)   // corporate
        .mockResolvedValueOnce(25 as never)   // repeat
        .mockResolvedValueOnce(75 as never);  // new

      const caller = createOrgCaller();
      const result = await caller.getSegments({});

      expect(result).toEqual({
        total: 100,
        vip: 15,
        corporate: 30,
        repeat: 25,
        newClients: 75,
      });
    });
  });

  // =========================================================================
  // exportCSV
  // =========================================================================

  describe("exportCSV", () => {
    it("should return CSV headers and rows", async () => {
      mockClients.findMany.mockResolvedValue([
        {
          name: "Ahmed",
          phone: "+212612345678",
          email: "ahmed@example.com",
          whatsapp: null,
          city: "Casablanca",
          tags: ["vip"],
          totalEventsBooked: 3,
          notes: "Good client",
        },
      ] as never);
      // exportCSV uses orgAdminProcedure
      mockMembers.findFirst.mockResolvedValue({
        id: MEMBER_ID,
        orgId: ORG_ID,
        role: "admin",
        permissions: null,
      } as never);

      const caller = createAdminCaller();
      const result = await caller.exportCSV({});

      expect(result.headers).toContain("Name");
      expect(result.headers).toContain("Phone");
      expect(result.count).toBe(1);
      expect(result.rows[0]).toContain("Ahmed");
    });

    it("should handle null fields gracefully in CSV", async () => {
      mockClients.findMany.mockResolvedValue([
        {
          name: "Test",
          phone: null,
          email: null,
          whatsapp: null,
          city: null,
          tags: null,
          totalEventsBooked: null,
          notes: null,
        },
      ] as never);
      mockMembers.findFirst.mockResolvedValue({
        id: MEMBER_ID,
        orgId: ORG_ID,
        role: "admin",
        permissions: null,
      } as never);

      const caller = createAdminCaller();
      const result = await caller.exportCSV({});

      // Should not throw, should have empty strings for null fields
      expect(result.rows[0]).toContain("Test");
      expect(result.rows[0]).toContain("");
    });
  });

  // =========================================================================
  // Authentication
  // =========================================================================

  describe("authentication", () => {
    it("should reject unauthenticated access to list", async () => {
      const caller = createUnauthCaller();
      await expect(caller.list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should reject unauthenticated access to create", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.create({ name: "Test User" }),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });

    it("should reject unauthenticated access to exportCSV", async () => {
      const caller = createUnauthCaller();
      await expect(
        caller.exportCSV({}),
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    });
  });
});
