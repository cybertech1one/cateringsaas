/**
 * Diyafa — Messages Router
 *
 * In-app messaging between caterers and clients:
 * - Conversation threads per event or standalone
 * - Message types: text, image, file, system (quote sent, payment received)
 * - Read tracking and unread counts
 * - WhatsApp-style messaging UX
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  orgProcedure,
  orgManagerProcedure,
} from "~/server/api/trpc";

export const messagesRouter = createTRPCRouter({
  /** List conversations for org (with latest message preview) */
  listConversations: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        status: z.enum(["active", "archived"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { orgId: ctx.orgId };
      if (input.status) where.status = input.status;

      const conversations = await ctx.db.conversations.findMany({
        where,
        orderBy: { lastMessageAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventType: true,
              eventDate: true,
              status: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              content: true,
              senderType: true,
              messageType: true,
              createdAt: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (conversations.length > input.limit) {
        const nextItem = conversations.pop();
        nextCursor = nextItem?.id;
      }

      return { conversations, nextCursor };
    }),

  /** Get messages in a conversation */
  getMessages: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        conversationId: z.string().uuid(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify conversation belongs to org
      const conversation = await ctx.db.conversations.findFirst({
        where: { id: input.conversationId, orgId: ctx.orgId },
      });

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const messages = await ctx.db.messages.findMany({
        where: { conversationId: input.conversationId },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return { messages: messages.reverse(), nextCursor };
    }),

  /** Send a message (org side) */
  send: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(5000),
        messageType: z.enum(["text", "image", "file", "quote", "invoice", "system"]).default("text"),
        attachments: z
          .array(
            z.object({
              url: z.string().url(),
              type: z.string(),
              name: z.string(),
              size: z.number().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.db.conversations.findFirst({
        where: { id: input.conversationId, orgId: ctx.orgId },
      });

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Create message
      const message = await ctx.db.messages.create({
        data: {
          conversationId: input.conversationId,
          senderId: ctx.session.user.id,
          senderType: "org_member",
          messageType: input.messageType,
          content: input.content,
          attachments: input.attachments ?? [],
        },
      });

      // Update conversation last message timestamp + increment client unread
      await ctx.db.conversations.update({
        where: { id: input.conversationId },
        data: {
          lastMessageAt: new Date(),
          unreadClient: { increment: 1 },
        },
      });

      return message;
    }),

  /** Create or get a conversation for an event */
  createConversation: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        eventId: z.string().uuid().optional(),
        clientName: z.string().min(1).max(200),
        clientPhone: z.string().optional(),
        clientProfileId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if conversation already exists for this event
      if (input.eventId) {
        const existing = await ctx.db.conversations.findFirst({
          where: { orgId: ctx.orgId, eventId: input.eventId },
        });
        if (existing) return existing;
      }

      return ctx.db.conversations.create({
        data: {
          orgId: ctx.orgId,
          eventId: input.eventId,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientProfileId: input.clientProfileId,
          status: "active",
        },
      });
    }),

  /** Mark messages as read (org side) */
  markRead: orgProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        conversationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Reset org unread count
      await ctx.db.conversations.update({
        where: { id: input.conversationId },
        data: { unreadOrg: 0 },
      });

      // Mark all client messages as read
      await ctx.db.messages.updateMany({
        where: {
          conversationId: input.conversationId,
          senderType: "client",
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return { success: true };
    }),

  /** Client sends a message (public, phone-verified) */
  clientSend: publicProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        clientPhone: z.string().min(6),
        content: z.string().min(1).max(5000),
        messageType: z.enum(["text", "image", "file"]).default("text"),
        attachments: z
          .array(
            z.object({
              url: z.string().url(),
              type: z.string(),
              name: z.string(),
              size: z.number().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify conversation exists and phone matches
      const conversation = await ctx.db.conversations.findFirst({
        where: { id: input.conversationId, clientPhone: input.clientPhone },
      });

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found or phone does not match",
        });
      }

      const message = await ctx.db.messages.create({
        data: {
          conversationId: input.conversationId,
          senderType: "client",
          messageType: input.messageType,
          content: input.content,
          attachments: input.attachments ?? [],
        },
      });

      // Update conversation + increment org unread
      await ctx.db.conversations.update({
        where: { id: input.conversationId },
        data: {
          lastMessageAt: new Date(),
          unreadOrg: { increment: 1 },
        },
      });

      return message;
    }),

  /** Archive a conversation */
  archiveConversation: orgManagerProcedure
    .input(
      z.object({
        orgId: z.string().uuid().optional(),
        conversationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.conversations.update({
        where: { id: input.conversationId },
        data: { status: "archived" },
      });
    }),

  /** Get unread counts for org */
  getUnreadCount: orgProcedure
    .input(z.object({ orgId: z.string().uuid().optional() }))
    .query(async ({ ctx }) => {
      const result = await ctx.db.conversations.aggregate({
        where: { orgId: ctx.orgId, status: "active" },
        _sum: { unreadOrg: true },
      });

      return { unreadCount: result._sum.unreadOrg ?? 0 };
    }),
});
