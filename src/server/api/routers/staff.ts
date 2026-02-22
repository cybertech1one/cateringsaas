import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { rateLimit } from "~/server/rateLimit";

export const staffRouter = createTRPCRouter({
  getStaffByMenu: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the menu or is a staff member
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view staff for this menu",
        });
      }

      return ctx.db.staffMembers.findMany({
        where: { menuId: input.menuId },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          inviter: { select: { id: true, email: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  inviteStaff: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["manager", "staff"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { success } = rateLimit({
        key: `invite-staff:${ctx.user.id}`,
        limit: 10,
        windowMs: 60 * 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many invite attempts. Try again later.",
        });
      }

      // Verify user owns the menu
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to manage staff for this menu",
        });
      }

      // Find the user by email
      const targetUser = await ctx.db.profiles.findUnique({
        where: { email: input.email },
        select: { id: true },
      });

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No user found with that email",
        });
      }

      // Check if already a staff member
      const existing = await ctx.db.staffMembers.findUnique({
        where: {
          menuId_userId: {
            menuId: input.menuId,
            userId: targetUser.id,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a staff member of this menu",
        });
      }

      return ctx.db.staffMembers.create({
        data: {
          menuId: input.menuId,
          userId: targetUser.id,
          role: input.role,
          invitedBy: ctx.user.id,
        },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });
    }),

  updateStaffRole: privateProcedure
    .input(
      z.object({
        staffMemberId: z.string().uuid(),
        role: z.enum(["manager", "staff"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const staffMember = await ctx.db.staffMembers.findUnique({
        where: { id: input.staffMemberId },
        include: { menus: { select: { userId: true } } },
      });

      if (!staffMember || staffMember.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this staff member",
        });
      }

      return ctx.db.staffMembers.update({
        where: { id: input.staffMemberId },
        data: { role: input.role, updatedAt: new Date() },
      });
    }),

  removeStaff: privateProcedure
    .input(z.object({ staffMemberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const staffMember = await ctx.db.staffMembers.findUnique({
        where: { id: input.staffMemberId },
        include: { menus: { select: { userId: true } } },
      });

      if (!staffMember || staffMember.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to remove this staff member",
        });
      }

      return ctx.db.staffMembers.delete({
        where: { id: input.staffMemberId },
      });
    }),

  toggleStaffActive: privateProcedure
    .input(z.object({ staffMemberId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const staffMember = await ctx.db.staffMembers.findUnique({
        where: { id: input.staffMemberId },
        include: { menus: { select: { userId: true } } },
      });

      if (!staffMember || staffMember.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to modify this staff member",
        });
      }

      return ctx.db.staffMembers.update({
        where: { id: input.staffMemberId },
        data: { isActive: !staffMember.isActive, updatedAt: new Date() },
      });
    }),
});
