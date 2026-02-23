import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Tests for the messages tRPC router.
 * Covers listConversations, getMessages, send, createConversation,
 * markRead, clientSend, archiveConversation, getUnreadCount.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/server/db", () => ({
  db: {
    conversations: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn(),
    },
    messages: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
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
import { messagesRouter } from "../api/routers/messages";
import { resetFactoryCounter } from "~/__tests__/utils/factories";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_ID = "00000000-0000-4000-a000-000000000100";
const USER_ID = "00000000-0000-4000-a000-000000000001";
const MEMBER_ID = "00000000-0000-4000-a000-000000000050";
const EVENT_ID = "00000000-0000-4000-a000-000000000200";
const CONVERSATION_ID = "00000000-0000-4000-a000-000000000300";
const MESSAGE_ID = "00000000-0000-4000-a000-000000000400";

function createOrgCaller(role: string = "staff") {
  return messagesRouter.createCaller({
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
  return messagesRouter.createCaller({
    headers: new Headers(),
    db: db as never,
    user: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("messagesRouter", () => {
  const mockConversations = vi.mocked(db.conversations);
  const mockMessages = vi.mocked(db.messages);
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
  // listConversations
  // =========================================================================

  describe("listConversations", () => {
    it("should return paginated conversations with latest message", async () => {
      const convos = [
        {
          id: CONVERSATION_ID,
          orgId: ORG_ID,
          clientName: "Ahmed",
          event: null,
          messages: [{ id: MESSAGE_ID, content: "Hello", senderType: "client" }],
        },
      ];
      mockConversations.findMany.mockResolvedValue(convos as never);

      const caller = createOrgCaller();
      const result = await caller.listConversations({});

      expect(result.conversations).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
    });

    it("should handle cursor pagination", async () => {
      const convos = Array.from({ length: 3 }, (_, i) => ({
        id: `convo-${i}`,
        orgId: ORG_ID,
        messages: [],
      }));
      mockConversations.findMany.mockResolvedValue(convos as never);

      const caller = createOrgCaller();
      const result = await caller.listConversations({ limit: 2 });

      expect(result.nextCursor).toBeDefined();
      expect(result.conversations).toHaveLength(2);
    });

    it("should filter by status", async () => {
      mockConversations.findMany.mockResolvedValue([] as never);

      const caller = createOrgCaller();
      await caller.listConversations({ status: "archived" });

      expect(mockConversations.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "archived" }),
        }),
      );
    });
  });

  // =========================================================================
  // getMessages
  // =========================================================================

  describe("getMessages", () => {
    it("should return messages for a conversation", async () => {
      mockConversations.findFirst.mockResolvedValue({ id: CONVERSATION_ID, orgId: ORG_ID } as never);
      const messages = [
        { id: MESSAGE_ID, content: "Hello", createdAt: new Date() },
      ];
      mockMessages.findMany.mockResolvedValue(messages as never);

      const caller = createOrgCaller();
      const result = await caller.getMessages({ conversationId: CONVERSATION_ID });

      expect(result.messages).toHaveLength(1);
    });

    it("should throw NOT_FOUND when conversation does not belong to org", async () => {
      mockConversations.findFirst.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      await expect(
        caller.getMessages({ conversationId: CONVERSATION_ID }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should handle cursor pagination for messages", async () => {
      mockConversations.findFirst.mockResolvedValue({ id: CONVERSATION_ID, orgId: ORG_ID } as never);
      const messages = Array.from({ length: 3 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        createdAt: new Date(),
      }));
      mockMessages.findMany.mockResolvedValue(messages as never);

      const caller = createOrgCaller();
      const result = await caller.getMessages({ conversationId: CONVERSATION_ID, limit: 2 });

      expect(result.nextCursor).toBeDefined();
    });
  });

  // =========================================================================
  // send
  // =========================================================================

  describe("send", () => {
    it("should create message and update conversation", async () => {
      mockConversations.findFirst.mockResolvedValue({ id: CONVERSATION_ID, orgId: ORG_ID } as never);
      mockMessages.create.mockResolvedValue({
        id: MESSAGE_ID,
        content: "We can cater your event",
        senderType: "org_member",
      } as never);
      mockConversations.update.mockResolvedValue({} as never);

      const caller = createOrgCaller();
      const result = await caller.send({
        conversationId: CONVERSATION_ID,
        content: "We can cater your event",
      });

      expect(result.id).toBe(MESSAGE_ID);
      expect(mockMessages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversationId: CONVERSATION_ID,
            senderId: USER_ID,
            senderType: "org_member",
            content: "We can cater your event",
          }),
        }),
      );
      expect(mockConversations.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            unreadClient: { increment: 1 },
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when conversation does not belong to org", async () => {
      mockConversations.findFirst.mockResolvedValue(null as never);

      const caller = createOrgCaller();
      await expect(
        caller.send({ conversationId: CONVERSATION_ID, content: "Hello" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject empty content", async () => {
      const caller = createOrgCaller();
      await expect(
        caller.send({ conversationId: CONVERSATION_ID, content: "" }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // createConversation
  // =========================================================================

  describe("createConversation", () => {
    it("should create a new conversation", async () => {
      mockConversations.create.mockResolvedValue({
        id: CONVERSATION_ID,
        orgId: ORG_ID,
        clientName: "Ahmed",
        status: "active",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.createConversation({
        clientName: "Ahmed",
        clientPhone: "+212612345678",
      });

      expect(result.id).toBe(CONVERSATION_ID);
    });

    it("should return existing conversation when eventId matches", async () => {
      mockConversations.findFirst.mockResolvedValue({
        id: CONVERSATION_ID,
        orgId: ORG_ID,
        eventId: EVENT_ID,
      } as never);

      const caller = createManagerCaller();
      const result = await caller.createConversation({
        eventId: EVENT_ID,
        clientName: "Ahmed",
      });

      expect(result.id).toBe(CONVERSATION_ID);
      expect(mockConversations.create).not.toHaveBeenCalled();
    });

    it("should create new conversation when eventId has no existing convo", async () => {
      mockConversations.findFirst.mockResolvedValue(null as never);
      mockConversations.create.mockResolvedValue({ id: CONVERSATION_ID } as never);

      const caller = createManagerCaller();
      await caller.createConversation({
        eventId: EVENT_ID,
        clientName: "Fatima",
      });

      expect(mockConversations.create).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // markRead
  // =========================================================================

  describe("markRead", () => {
    it("should reset org unread count and mark client messages as read", async () => {
      mockConversations.findFirst.mockResolvedValue({ id: CONVERSATION_ID } as never);
      mockConversations.update.mockResolvedValue({} as never);
      mockMessages.updateMany.mockResolvedValue({ count: 3 } as never);

      const caller = createOrgCaller();
      const result = await caller.markRead({ conversationId: CONVERSATION_ID });

      expect(result.success).toBe(true);
      expect(mockConversations.update).toHaveBeenCalledWith({
        where: { id: CONVERSATION_ID },
        data: { unreadOrg: 0 },
      });
      expect(mockMessages.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            conversationId: CONVERSATION_ID,
            senderType: "client",
            isRead: false,
          }),
        }),
      );
    });
  });

  // =========================================================================
  // clientSend
  // =========================================================================

  describe("clientSend", () => {
    it("should allow client to send message via phone verification", async () => {
      mockConversations.findFirst.mockResolvedValue({
        id: CONVERSATION_ID,
        clientPhone: "+212612345678",
      } as never);
      mockMessages.create.mockResolvedValue({
        id: MESSAGE_ID,
        content: "When can you deliver?",
        senderType: "client",
      } as never);
      mockConversations.update.mockResolvedValue({} as never);

      const caller = createPublicCaller();
      const result = await caller.clientSend({
        conversationId: CONVERSATION_ID,
        clientPhone: "+212612345678",
        content: "When can you deliver?",
      });

      expect(result.senderType).toBe("client");
      expect(mockConversations.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            unreadOrg: { increment: 1 },
          }),
        }),
      );
    });

    it("should throw NOT_FOUND when phone does not match", async () => {
      mockConversations.findFirst.mockResolvedValue(null as never);

      const caller = createPublicCaller();
      await expect(
        caller.clientSend({
          conversationId: CONVERSATION_ID,
          clientPhone: "+212600000000",
          content: "Hello",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("should reject empty content", async () => {
      const caller = createPublicCaller();
      await expect(
        caller.clientSend({
          conversationId: CONVERSATION_ID,
          clientPhone: "+212612345678",
          content: "",
        }),
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // archiveConversation
  // =========================================================================

  describe("archiveConversation", () => {
    it("should set conversation status to archived", async () => {
      mockConversations.findFirst.mockResolvedValue({ id: CONVERSATION_ID } as never);
      mockConversations.update.mockResolvedValue({
        id: CONVERSATION_ID,
        status: "archived",
      } as never);

      const caller = createManagerCaller();
      const result = await caller.archiveConversation({ conversationId: CONVERSATION_ID });

      expect(result.status).toBe("archived");
      expect(mockConversations.update).toHaveBeenCalledWith({
        where: { id: CONVERSATION_ID },
        data: { status: "archived" },
      });
    });
  });

  // =========================================================================
  // getUnreadCount
  // =========================================================================

  describe("getUnreadCount", () => {
    it("should return total unread count for org", async () => {
      mockConversations.aggregate.mockResolvedValue({
        _sum: { unreadOrg: 7 },
      } as never);

      const caller = createOrgCaller();
      const result = await caller.getUnreadCount({});

      expect(result.unreadCount).toBe(7);
    });

    it("should return 0 when no unread messages", async () => {
      mockConversations.aggregate.mockResolvedValue({
        _sum: { unreadOrg: null },
      } as never);

      const caller = createOrgCaller();
      const result = await caller.getUnreadCount({});

      expect(result.unreadCount).toBe(0);
    });
  });
});
