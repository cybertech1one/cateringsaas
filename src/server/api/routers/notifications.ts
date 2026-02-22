import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";

/**
 * Notification type derived from existing tables (no dedicated DB table).
 * Orders and reviews from the last 24 hours are surfaced as notifications.
 */

export const notificationsRouter = createTRPCRouter({
  /**
   * PRIVATE: Get recent notifications derived from orders and reviews
   * for all menus owned by the authenticated user.
   */
  getNotifications: privateProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const twentyFourHoursAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      );

      // Get all menu IDs owned by the user
      const userMenus = await ctx.db.menus.findMany({
        where: { userId: ctx.user.id },
        select: { id: true, name: true },
      });

      if (userMenus.length === 0) {
        return { notifications: [] };
      }

      const menuIds = userMenus.map((m) => m.id);
      const menuNameMap = new Map(
        userMenus.map((m) => [m.id, m.name]),
      );

      // Fetch recent orders and reviews in parallel
      const [recentOrders, recentReviews] = await Promise.all([
        ctx.db.orders.findMany({
          where: {
            menuId: { in: menuIds },
            createdAt: { gte: twentyFourHoursAgo },
          },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            currency: true,
            customerName: true,
            status: true,
            menuId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        }),
        ctx.db.reviews.findMany({
          where: {
            menuId: { in: menuIds },
            createdAt: { gte: twentyFourHoursAgo },
          },
          select: {
            id: true,
            customerName: true,
            rating: true,
            comment: true,
            status: true,
            menuId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
        }),
      ]);

      type Notification = {
        id: string;
        type: "order" | "review";
        title: string;
        description: string;
        menuName: string;
        createdAt: Date;
        isRead: boolean;
        link: string;
      };

      const notifications: Notification[] = [];

      // Convert orders to notifications
      for (const order of recentOrders) {
        const menuName = menuNameMap.get(order.menuId) ?? "Unknown";
        const formattedAmount = (order.totalAmount / 100).toFixed(2);

        notifications.push({
          id: `order-${order.id}`,
          type: "order",
          title: `Order #${order.orderNumber}`,
          description: `${order.customerName ?? "Customer"} - ${formattedAmount} ${order.currency}`,
          menuName,
          createdAt: order.createdAt,
          // Consider pending orders as "unread"
          isRead: order.status !== "pending",
          link: "/dashboard/orders",
        });
      }

      // Convert reviews to notifications
      for (const review of recentReviews) {
        const menuName = menuNameMap.get(review.menuId) ?? "Unknown";
        const stars = "\u2605".repeat(review.rating);

        notifications.push({
          id: `review-${review.id}`,
          type: "review",
          title: `${stars} Review`,
          description:
            review.comment?.slice(0, 80) ??
            `${review.customerName ?? "Anonymous"} left a ${review.rating}-star review`,
          menuName,
          createdAt: review.createdAt,
          // Pending reviews are "unread"
          isRead: review.status !== "pending",
          link: "/dashboard/reviews",
        });
      }

      // Sort by createdAt desc and limit
      notifications.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      return {
        notifications: notifications.slice(0, input.limit),
      };
    }),

  /**
   * PRIVATE: Get count of unread notifications
   * (pending orders + pending reviews from last 24h).
   */
  getUnreadCount: privateProcedure.query(async ({ ctx }) => {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    );

    const userMenus = await ctx.db.menus.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    if (userMenus.length === 0) {
      return { count: 0 };
    }

    const menuIds = userMenus.map((m) => m.id);

    const [pendingOrders, pendingReviews] = await Promise.all([
      ctx.db.orders.count({
        where: {
          menuId: { in: menuIds },
          status: "pending",
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
      ctx.db.reviews.count({
        where: {
          menuId: { in: menuIds },
          status: "pending",
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),
    ]);

    return { count: pendingOrders + pendingReviews };
  }),

  /**
   * PRIVATE: Mark a notification as read by processing the underlying entity.
   * For orders: confirms the order. For reviews: approves the review.
   * This is a soft "mark as read" that changes the entity status.
   */
  markAsRead: privateProcedure
    .input(
      z.object({
        notificationId: z.string().max(200),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { notificationId } = input;

      if (notificationId.startsWith("order-")) {
        const orderId = notificationId.replace("order-", "");
        // Verify ownership
        const order = await ctx.db.orders.findUnique({
          where: { id: orderId },
          include: { menus: { select: { userId: true } } },
        });

        if (order && order.menus.userId === ctx.user.id && order.status === "pending") {
          await ctx.db.orders.update({
            where: { id: orderId },
            data: { status: "confirmed", updatedAt: new Date() },
          });
        }
      } else if (notificationId.startsWith("review-")) {
        const reviewId = notificationId.replace("review-", "");
        // Verify ownership via menu
        const review = await ctx.db.reviews.findUnique({
          where: { id: reviewId },
          include: { menu: { select: { userId: true } } },
        });

        if (review && review.menu.userId === ctx.user.id && review.status === "pending") {
          await ctx.db.reviews.update({
            where: { id: reviewId },
            data: { status: "approved", updatedAt: new Date() },
          });
        }
      }

      return { success: true };
    }),

  /**
   * PRIVATE: Mark all notifications as read.
   * Confirms all pending orders and approves all pending reviews in the last 24h.
   */
  markAllAsRead: privateProcedure.mutation(async ({ ctx }) => {
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    );

    const userMenus = await ctx.db.menus.findMany({
      where: { userId: ctx.user.id },
      select: { id: true },
    });

    if (userMenus.length === 0) {
      return { success: true };
    }

    const menuIds = userMenus.map((m) => m.id);

    await Promise.all([
      ctx.db.orders.updateMany({
        where: {
          menuId: { in: menuIds },
          status: "pending",
          createdAt: { gte: twentyFourHoursAgo },
        },
        data: { status: "confirmed", updatedAt: new Date() },
      }),
      ctx.db.reviews.updateMany({
        where: {
          menuId: { in: menuIds },
          status: "pending",
          createdAt: { gte: twentyFourHoursAgo },
        },
        data: { status: "approved", updatedAt: new Date() },
      }),
    ]);

    return { success: true };
  }),
});
