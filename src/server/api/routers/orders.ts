import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { cache } from "~/server/cache";
import { rateLimit } from "~/server/rateLimit";
import { logger } from "~/server/logger";
import { sendOrderStatusPush } from "~/server/pushNotification";
import { hashIP, sanitizeString } from "~/server/security";
import { buildOrderNotificationUrl } from "~/components/ThemedMenuView/components/WhatsAppOrderButton";

/**
 * Haversine formula: calculates the great-circle distance (km) between
 * two points on the Earth specified by latitude/longitude in degrees.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const orderItemInput = z.object({
  dishId: z.string().uuid().optional(),
  dishVariantId: z.string().uuid().optional(),
  dishName: z.string().min(1).max(200),
  quantity: z.number().int().positive().max(99),
  unitPrice: z.number().int().nonnegative(),
  notes: z.string().max(500).optional(),
});

export const ordersRouter = createTRPCRouter({
  // Public: Create order from menu viewer (customer-facing)
  createOrder: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        customerName: z.string().max(100).optional(),
        customerPhone: z
          .string()
          .max(20)
          .regex(/^(\+212|0)[0-9]{9}$/, "Invalid Moroccan phone number")
          .optional()
          .or(z.literal("")),
        customerNotes: z.string().max(500).optional(),
        tableNumber: z.string().max(20).optional(),
        orderType: z.enum(["dine_in", "pickup", "delivery"]).default("dine_in"),
        deliveryAddress: z.string().max(500).optional(),
        paymentMethod: z.string().max(50).default("cash"),
        items: z.array(orderItemInput).min(1).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `create-order:${ipHash}:${input.menuId}`,
        limit: 30,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many orders. Please try again.",
        });
      }

      // Verify menu exists and is published
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, isPublished: true },
        select: {
          id: true,
          name: true,
          currency: true,
          enabledOrderTypes: true,
          deliveryFee: true,
          minOrderAmount: true,
          whatsappNumber: true,
          whatsappNotifyEnabled: true,
          restaurantLat: true,
          restaurantLng: true,
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found or not published",
        });
      }

      // Validate order type is enabled for this menu
      if (!menu.enabledOrderTypes.includes(input.orderType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Order type "${input.orderType}" is not available for this restaurant`,
        });
      }

      // Validate delivery orders have an address
      if (input.orderType === "delivery" && !input.deliveryAddress?.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Delivery address is required for delivery orders",
        });
      }

      // Validate pickup/delivery orders have customer name and phone
      if (input.orderType !== "dine_in") {
        if (!input.customerName?.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Customer name is required for pickup and delivery orders",
          });
        }

        if (!input.customerPhone?.trim()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Phone number is required for pickup and delivery orders",
          });
        }
      }

      const items = input.items.map((item) => ({
        ...item,
        totalPrice: item.unitPrice * item.quantity,
        dishId: item.dishId ?? null,
        dishVariantId: item.dishVariantId ?? null,
        notes: item.notes ?? null,
      }));

      const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const deliveryFee =
        input.orderType === "delivery" ? (menu.deliveryFee ?? 0) : 0;
      const totalAmount = itemsTotal + deliveryFee;

      // Validate minimum order amount
      if (menu.minOrderAmount && itemsTotal < menu.minOrderAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Minimum order amount is ${menu.minOrderAmount} ${menu.currency}`,
        });
      }

      // ---------------------------------------------------------------
      // Atomic transaction: stock check + order creation + stock decrement
      // Prevents TOCTOU race condition on concurrent orders
      // ---------------------------------------------------------------
      const dishIdsToCheck = items
        .map((item) => item.dishId)
        .filter((id): id is string => id !== null);

      const order = await ctx.db.$transaction(async (tx) => {
        // 1. Check stock inside transaction
        if (dishIdsToCheck.length > 0) {
          const trackedDishes = await tx.dishes.findMany({
            where: {
              id: { in: dishIdsToCheck },
              trackInventory: true,
            },
            select: {
              id: true,
              stockQuantity: true,
              dishesTranslation: {
                select: { name: true },
                take: 1,
              },
            },
          });

          for (const trackedDish of trackedDishes) {
            if (trackedDish.stockQuantity === null) continue;

            const orderedQuantity = items
              .filter((item) => item.dishId === trackedDish.id)
              .reduce((sum, item) => sum + item.quantity, 0);

            if (trackedDish.stockQuantity < orderedQuantity) {
              const dishName =
                trackedDish.dishesTranslation[0]?.name ?? "Item";

              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `${dishName} is out of stock`,
              });
            }
          }
        }

        // 2. Server-side price validation: prevent client-side price manipulation
        if (dishIdsToCheck.length > 0) {
          const dishPrices = await tx.dishes.findMany({
            where: { id: { in: dishIdsToCheck } },
            select: { id: true, price: true },
          });

          const priceMap = new Map(dishPrices.map((d) => [d.id, d.price]));

          for (const item of items) {
            if (!item.dishId) continue;

            const serverPrice = priceMap.get(item.dishId);

            if (serverPrice !== undefined && item.unitPrice !== serverPrice) {
              item.unitPrice = serverPrice;
              item.totalPrice = serverPrice * item.quantity;
            }
          }
        }

        // Also validate variant prices if present
        const variantIds = items
          .map((item) => item.dishVariantId)
          .filter((id): id is string => id !== null);

        if (variantIds.length > 0) {
          const variantPrices = await tx.dishVariants.findMany({
            where: { id: { in: variantIds } },
            select: { id: true, price: true },
          });

          const variantPriceMap = new Map(
            variantPrices.map((v) => [v.id, v.price]),
          );

          for (const item of items) {
            if (!item.dishVariantId) continue;

            const serverPrice = variantPriceMap.get(item.dishVariantId);

            if (
              serverPrice !== undefined &&
              serverPrice !== null &&
              item.unitPrice !== serverPrice
            ) {
              item.unitPrice = serverPrice;
              item.totalPrice = serverPrice * item.quantity;
            }
          }
        }

        // Recalculate totals with validated prices
        const validatedItemsTotal = items.reduce(
          (sum, item) => sum + item.totalPrice,
          0,
        );

        const validatedTotalAmount = validatedItemsTotal + deliveryFee;

        // 3. Create order (sanitize user-provided text fields)
        const createdOrder = await tx.orders.create({
          data: {
            menuId: input.menuId,
            customerName: input.customerName ? sanitizeString(input.customerName) : null,
            customerPhone: input.customerPhone || null,
            customerNotes: input.customerNotes ? sanitizeString(input.customerNotes) : null,
            tableNumber: input.tableNumber ?? null,
            orderType: input.orderType,
            deliveryAddress: input.deliveryAddress ? sanitizeString(input.deliveryAddress) : null,
            deliveryFee,
            paymentMethod: input.paymentMethod,
            totalAmount: validatedTotalAmount,
            currency: menu.currency,
            orderItems: {
              create: items,
            },
          },
          include: { orderItems: true },
        });

        // 4. Decrement stock for tracked dishes
        if (dishIdsToCheck.length > 0) {
          const trackedDishes = await tx.dishes.findMany({
            where: {
              id: { in: dishIdsToCheck },
              trackInventory: true,
            },
            select: { id: true, stockQuantity: true },
          });

          for (const trackedDish of trackedDishes) {
            if (trackedDish.stockQuantity === null) continue;

            const orderedQuantity = items
              .filter((item) => item.dishId === trackedDish.id)
              .reduce((sum, item) => sum + item.quantity, 0);

            const newQuantity = Math.max(
              0,
              trackedDish.stockQuantity - orderedQuantity,
            );

            const updateData: Record<string, unknown> = {
              stockQuantity: newQuantity,
            };

            if (newQuantity === 0) {
              updateData.isSoldOut = true;
              logger.info(
                `Dish ${trackedDish.id} automatically marked as sold out (stock depleted)`,
                "inventory",
              );
            }

            await tx.dishes.update({
              where: { id: trackedDish.id },
              data: updateData,
            });
          }
        }

        return createdOrder;
      });

      logger.info(
        `Order created: ${order.id} (${input.orderType}, ${totalAmount} ${menu.currency})`,
        "orders",
      );

      // Auto-create delivery request for delivery orders
      if (input.orderType === "delivery") {
        try {
          let estimatedDistance: number | null = null;

          if (menu.restaurantLat && menu.restaurantLng) {
            // We don't have customer coordinates from the address, but
            // record restaurant pickup coordinates for driver dispatch
          }

          const orderDeliveryFee = deliveryFee;
          const driverEarning = Math.round(orderDeliveryFee * 0.8);

          await ctx.db.deliveryRequests.create({
            data: {
              orderId: order.id,
              menuId: input.menuId,
              status: "pending",
              dropoffAddress: sanitizeString(input.deliveryAddress ?? ""),
              pickupLat: menu.restaurantLat ?? null,
              pickupLng: menu.restaurantLng ?? null,
              estimatedDistance,
              estimatedDuration: null,
              deliveryFee: orderDeliveryFee,
              driverEarning,
              paymentMethod: input.paymentMethod,
              paymentStatus: input.paymentMethod === "cash" ? "unpaid" : "pending",
            },
          });

          logger.info(
            `Delivery request auto-created for order ${order.id}`,
            "delivery",
          );
        } catch (deliveryErr) {
          // Non-blocking: order still succeeds even if delivery request fails
          logger.error(
            "Failed to auto-create delivery request",
            deliveryErr,
            "delivery",
          );
        }
      }

      // Build WhatsApp notification URL for restaurant owner (if enabled)
      let whatsappNotifyUrl: string | null = null;

      if (menu.whatsappNotifyEnabled && menu.whatsappNumber) {
        try {
          const tableNum = input.tableNumber
            ? parseInt(input.tableNumber, 10)
            : undefined;

          whatsappNotifyUrl = buildOrderNotificationUrl(
            menu.whatsappNumber,
            {
              orderNumber: order.orderNumber,
              items: order.orderItems.map((item) => ({
                name: item.dishName,
                quantity: item.quantity,
                price: item.unitPrice,
              })),
              total: totalAmount,
              orderType: input.orderType,
              customerName: input.customerName ?? undefined,
              tableNumber:
                tableNum !== undefined && !isNaN(tableNum)
                  ? tableNum
                  : undefined,
            },
          );
        } catch (err) {
          logger.error(
            "Failed to build WhatsApp notification URL",
            err,
            "orders",
          );
        }
      }

      return { ...order, whatsappNotifyUrl };
    }),

  // Public: Check if a customer location is within delivery range
  checkDeliveryAvailability: publicProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        customerLat: z.number().min(-90).max(90),
        customerLng: z.number().min(-180).max(180),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `delivery-check:${ipHash}:${input.menuId}`,
        limit: 30,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again.",
        });
      }

      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, isPublished: true },
        select: {
          id: true,
          restaurantLat: true,
          restaurantLng: true,
          deliveryRadiusKm: true,
          deliveryFee: true,
          enabledOrderTypes: true,
          currency: true,
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found or not published",
        });
      }

      if (!menu.enabledOrderTypes.includes("delivery")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Delivery is not available for this restaurant",
        });
      }

      if (menu.restaurantLat === null || menu.restaurantLng === null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Restaurant has not configured delivery coordinates",
        });
      }

      const distanceKm = haversineDistance(
        menu.restaurantLat,
        menu.restaurantLng,
        input.customerLat,
        input.customerLng,
      );

      const radiusKm = menu.deliveryRadiusKm ?? 5;
      const available = distanceKm <= radiusKm;

      return {
        available,
        distanceKm: Math.round(distanceKm * 10) / 10,
        deliveryFee: menu.deliveryFee ?? 0,
        maxRadiusKm: radiusKm,
        currency: menu.currency,
      };
    }),

  // Public: Subscribe to push notifications for an order
  subscribeToPush: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        endpoint: z.string().url().max(2048),
        p256dh: z.string().min(1).max(512),
        auth: z.string().min(1).max(512),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `push-subscribe:${ipHash}:${input.orderId}`,
        limit: 5,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many subscription attempts. Please try again.",
        });
      }

      // Verify order exists
      const order = await ctx.db.orders.findUnique({
        where: { id: input.orderId },
        select: { id: true },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Upsert subscription (ignore conflict on unique constraint)
      await ctx.db.pushSubscriptions.upsert({
        where: {
          orderId_endpoint: {
            orderId: input.orderId,
            endpoint: input.endpoint,
          },
        },
        update: {
          p256dh: input.p256dh,
          auth: input.auth,
        },
        create: {
          orderId: input.orderId,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        },
      });

      logger.info(
        `Push subscription registered for order ${input.orderId}`,
        "push",
      );

      return { success: true };
    }),

  // Public: Get order status for customer tracking page
  getPublicOrderStatus: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `order-status:${ipHash}:${input.orderId}`,
        limit: 60,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again.",
        });
      }

      const order = await ctx.db.orders.findUnique({
        where: { id: input.orderId },
        include: {
          orderItems: true,
          menus: {
            select: {
              name: true,
              slug: true,
              logoImageUrl: true,
              contactNumber: true,
              phone: true,
              whatsappNumber: true,
              estimatedPrepTime: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Calculate ETA based on queue position
      const ordersAhead = await ctx.db.orders.count({
        where: {
          menuId: order.menuId,
          status: { in: ["pending", "confirmed", "preparing"] },
          createdAt: { lt: order.createdAt },
          id: { not: order.id },
        },
      });

      const avgPrepTime = order.menus.estimatedPrepTime ?? 15;
      // Parallel kitchen capacity ~3 orders, minimum 5 minutes
      const estimatedMinutes = Math.max(5, Math.ceil((ordersAhead * avgPrepTime) / 3));

      return {
        id: order.id,
        menuId: order.menuId,
        status: order.status,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        tableNumber: order.tableNumber,
        deliveryAddress: order.deliveryAddress,
        items: order.orderItems.map((item) => ({
          name: item.dishName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes,
        })),
        restaurantName: order.menus.name,
        restaurantSlug: order.menus.slug,
        restaurantLogo: order.menus.logoImageUrl,
        restaurantPhone: order.menus.contactNumber ?? order.menus.phone,
        whatsappNumber: order.menus.whatsappNumber,
        estimatedMinutes,
        ordersAhead,
        createdAt: order.createdAt,
        confirmedAt: order.confirmedAt,
        preparingAt: order.preparingAt,
        readyAt: order.readyAt,
        completedAt: order.completedAt,
      };
    }),

  // Private: Get orders for a menu (owner/staff)
  getOrdersByMenu: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        status: z
          .enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"])
          .optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to view orders for this menu",
        });
      }

      const orders = await ctx.db.orders.findMany({
        where: {
          menuId: input.menuId,
          ...(input.status ? { status: input.status } : {}),
        },
        include: {
          orderItems: {
            include: {
              dishes: { select: { pictureUrl: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
      });

      let nextCursor: string | undefined;

      if (orders.length > input.limit) {
        const nextItem = orders.pop();

        nextCursor = nextItem?.id;
      }

      return { orders, nextCursor };
    }),

  // Private: Update order status with timestamp tracking
  updateOrderStatus: privateProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        status: z.enum([
          "confirmed",
          "preparing",
          "ready",
          "completed",
          "cancelled",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.orders.findUnique({
        where: { id: input.orderId },
        include: { menus: { select: { userId: true } } },
      });

      if (!order || order.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this order",
        });
      }

      const now = new Date();
      const timestampUpdates: Record<string, Date> = {};

      if (input.status === "confirmed") timestampUpdates.confirmedAt = now;
      if (input.status === "preparing") timestampUpdates.preparingAt = now;
      if (input.status === "ready") timestampUpdates.readyAt = now;
      if (input.status === "completed") timestampUpdates.completedAt = now;

      const updatedOrder = await ctx.db.orders.update({
        where: { id: input.orderId },
        data: {
          status: input.status,
          updatedAt: now,
          ...timestampUpdates,
        },
      });

      // Send push notifications to all subscriptions for this order (fire-and-forget)
      try {
        const subscriptions = await ctx.db.pushSubscriptions.findMany({
          where: { orderId: input.orderId },
        });

        if (subscriptions.length > 0) {
          const statusMessages: Record<string, { title: string; body: string }> = {
            confirmed: {
              title: "Order Confirmed",
              body: `Order #${order.orderNumber} has been confirmed by the restaurant.`,
            },
            preparing: {
              title: "Order Being Prepared",
              body: `Order #${order.orderNumber} is now being prepared.`,
            },
            ready: {
              title: "Order Ready!",
              body: `Order #${order.orderNumber} is ready for pickup!`,
            },
            completed: {
              title: "Order Completed",
              body: `Order #${order.orderNumber} has been completed. Thank you!`,
            },
            cancelled: {
              title: "Order Cancelled",
              body: `Order #${order.orderNumber} has been cancelled.`,
            },
          };

          const message = statusMessages[input.status];

          if (message) {
            sendOrderStatusPush(
              subscriptions.map((sub) => ({
                endpoint: sub.endpoint,
                p256dh: sub.p256dh,
                auth: sub.auth,
              })),
              {
                title: message.title,
                body: message.body,
                url: `/order/${input.orderId}`,
              },
            ).catch((err) => {
              logger.error("Failed to send push notifications", err, "push");
            });
          }
        }
      } catch (pushError) {
        // Push notification errors should never block the status update
        logger.error("Failed to query push subscriptions", pushError, "push");
      }

      // ---------------------------------------------------------------
      // Loyalty: Award stamp when order is completed and customer has a phone
      // ---------------------------------------------------------------
      if (input.status === "completed" && order.customerPhone) {
        try {
          const normalizedPhone = order.customerPhone.toLowerCase().trim();

          // Find all active loyalty programs for this menu
          const activePrograms = await ctx.db.loyaltyProgram.findMany({
            where: { menuId: order.menuId, isActive: true },
            select: { id: true, stampsRequired: true },
          });

          for (const program of activePrograms) {
            // Upsert card - create if doesn't exist, increment if it does
            const card = await ctx.db.loyaltyCard.upsert({
              where: {
                programId_customerIdentifier: {
                  programId: program.id,
                  customerIdentifier: normalizedPhone,
                },
              },
              create: {
                programId: program.id,
                customerIdentifier: normalizedPhone,
                stampsCollected: 1,
              },
              update: {
                stampsCollected: { increment: 1 },
                updatedAt: new Date(),
              },
            });

            // Create stamp audit record (no stampedBy since it's automatic)
            await ctx.db.loyaltyStamp.create({
              data: {
                cardId: card.id,
                stampedBy: null,
                notes: `Auto-awarded: Order #${order.orderNumber} completed`,
              },
            });

            logger.info(
              `Loyalty stamp auto-awarded: ${normalizedPhone} for program ${program.id} (${card.stampsCollected}/${program.stampsRequired})`,
              "loyalty",
            );
          }
        } catch (loyaltyError) {
          // Loyalty errors should never block the status update
          logger.error(
            "Failed to award loyalty stamp on order completion",
            loyaltyError,
            "loyalty",
          );
        }
      }

      return updatedOrder;
    }),

  // Private: Get menu order settings
  getMenuOrderSettings: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: {
          id: true,
          enabledOrderTypes: true,
          deliveryFee: true,
          deliveryRadiusKm: true,
          minOrderAmount: true,
          estimatedPrepTime: true,
          restaurantLat: true,
          restaurantLng: true,
          currency: true,
          whatsappNotifyEnabled: true,
          whatsappNumber: true,
        },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      return menu;
    }),

  // Private: Update menu order settings
  updateMenuOrderSettings: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        enabledOrderTypes: z
          .array(z.enum(["dine_in", "pickup", "delivery"]))
          .min(1),
        deliveryFee: z.number().int().nonnegative().max(100000).default(0),
        deliveryRadiusKm: z.number().int().positive().max(100).default(5),
        minOrderAmount: z.number().int().nonnegative().max(100000).default(0),
        estimatedPrepTime: z.number().int().positive().max(120).default(15),
        restaurantLat: z.number().min(-90).max(90).nullable().default(null),
        restaurantLng: z.number().min(-180).max(180).nullable().default(null),
        whatsappNotifyEnabled: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      const result = await ctx.db.menus.update({
        where: { id: input.menuId },
        data: {
          enabledOrderTypes: input.enabledOrderTypes,
          deliveryFee: input.deliveryFee,
          deliveryRadiusKm: input.deliveryRadiusKm,
          minOrderAmount: input.minOrderAmount,
          estimatedPrepTime: input.estimatedPrepTime,
          restaurantLat: input.restaurantLat,
          restaurantLng: input.restaurantLng,
          whatsappNotifyEnabled: input.whatsappNotifyEnabled,
          updatedAt: new Date(),
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  // Private: Mark an order as paid (COD payment confirmation)
  markOrderPaid: privateProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        paymentNote: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.orders.findUnique({
        where: { id: input.orderId },
        include: { menus: { select: { userId: true } } },
      });

      if (!order || order.menus.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this order",
        });
      }

      if (order.paymentStatus === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order is already marked as paid",
        });
      }

      const now = new Date();
      const updated = await ctx.db.orders.update({
        where: { id: input.orderId },
        data: {
          paymentStatus: "paid",
          paidAt: now,
          paymentNote: input.paymentNote ?? null,
          updatedAt: now,
        },
      });

      logger.info(
        `Order ${order.id} marked as paid (${order.totalAmount} ${order.currency})`,
        "orders",
      );

      return updated;
    }),

  // Private: Get payment summary for a menu (aggregated payment stats)
  getPaymentSummary: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true, currency: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      const [paidResult, unpaidResult] = await Promise.all([
        ctx.db.orders.aggregate({
          where: {
            menuId: input.menuId,
            paymentStatus: "paid",
            status: { not: "cancelled" },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
        ctx.db.orders.aggregate({
          where: {
            menuId: input.menuId,
            paymentStatus: "unpaid",
            status: { not: "cancelled" },
          },
          _sum: { totalAmount: true },
          _count: true,
        }),
      ]);

      // Get breakdown by payment method using groupBy (avoids fetching all rows)
      const methodGroups = await ctx.db.orders.groupBy({
        by: ["paymentMethod", "paymentStatus"],
        where: {
          menuId: input.menuId,
          status: { not: "cancelled" },
        },
        _count: true,
        _sum: { totalAmount: true },
      });

      const byMethod: Record<string, { total: number; paid: number; unpaid: number; count: number }> = {};

      for (const group of methodGroups) {
        const method = group.paymentMethod ?? "cash";

        if (!byMethod[method]) {
          byMethod[method] = { total: 0, paid: 0, unpaid: 0, count: 0 };
        }

        const sumAmount = group._sum.totalAmount ?? 0;

        byMethod[method]!.total += sumAmount;
        byMethod[method]!.count += group._count;

        if (group.paymentStatus === "paid") {
          byMethod[method]!.paid += sumAmount;
        } else {
          byMethod[method]!.unpaid += sumAmount;
        }
      }

      return {
        totalCollected: paidResult._sum.totalAmount ?? 0,
        totalPending: unpaidResult._sum.totalAmount ?? 0,
        paidCount: paidResult._count,
        unpaidCount: unpaidResult._count,
        currency: menu.currency,
        byMethod,
      };
    }),

  // Private: Get order stats for a menu (dashboard analytics)
  getOrderStats: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        period: z.enum(["today", "week", "month", "all"]).default("today"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const menu = await ctx.db.menus.findFirst({
        where: { id: input.menuId, userId: ctx.user.id },
        select: { id: true, currency: true },
      });

      if (!menu) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized",
        });
      }

      const now = new Date();
      let dateFilter: Date;

      switch (input.period) {
        case "today":
          dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "all":
          dateFilter = new Date(0);
          break;
      }

      const [totalOrders, completedOrders, pendingOrders, cancelledOrders] =
        await Promise.all([
          ctx.db.orders.count({
            where: { menuId: input.menuId, createdAt: { gte: dateFilter } },
          }),
          ctx.db.orders.count({
            where: {
              menuId: input.menuId,
              status: "completed",
              createdAt: { gte: dateFilter },
            },
          }),
          ctx.db.orders.count({
            where: {
              menuId: input.menuId,
              status: "pending",
              createdAt: { gte: dateFilter },
            },
          }),
          ctx.db.orders.count({
            where: {
              menuId: input.menuId,
              status: "cancelled",
              createdAt: { gte: dateFilter },
            },
          }),
        ]);

      const revenueResult = await ctx.db.orders.aggregate({
        where: {
          menuId: input.menuId,
          status: "completed",
          createdAt: { gte: dateFilter },
        },
        _sum: { totalAmount: true },
      });

      // Get top selling dishes
      const topDishes = await ctx.db.orderItems.groupBy({
        by: ["dishName"],
        where: {
          orders: {
            menuId: input.menuId,
            status: "completed",
            createdAt: { gte: dateFilter },
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      });

      return {
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalRevenue: revenueResult._sum.totalAmount ?? 0,
        currency: menu.currency,
        topDishes: topDishes.map((d) => ({
          name: d.dishName,
          quantity: d._sum.quantity ?? 0,
          revenue: d._sum.totalPrice ?? 0,
        })),
      };
    }),

  // Public: Get order history by customer phone number
  getOrderHistory: publicProcedure
    .input(
      z.object({
        phone: z.string().min(1).max(20),
        menuId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(20).default(10),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clientIP = ctx.headers?.get?.("x-forwarded-for") ?? "unknown";
      const ipHash = hashIP(clientIP);
      const { success } = rateLimit({
        key: `order-history:${ipHash}:${input.phone}`,
        limit: 10,
        windowMs: 60 * 1000,
      });

      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests. Please try again later.",
        });
      }

      // Normalize phone: strip spaces and dashes for matching
      const normalizedPhone = input.phone.replace(/[\s-]/g, "");

      const orders = await ctx.db.orders.findMany({
        where: {
          customerPhone: normalizedPhone,
          ...(input.menuId ? { menuId: input.menuId } : {}),
        },
        include: {
          orderItems: {
            select: {
              id: true,
              dishName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
          menus: {
            select: {
              name: true,
              slug: true,
              logoImageUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor
          ? { cursor: { id: input.cursor }, skip: 1 }
          : {}),
      });

      let nextCursor: string | undefined;

      if (orders.length > input.limit) {
        const nextItem = orders.pop();

        nextCursor = nextItem?.id;
      }

      logger.info(
        `Order history lookup: ${normalizedPhone} (${orders.length} results)`,
        "orders",
      );

      return {
        orders: orders.map((order) => ({
          id: order.id,
          menuId: order.menuId,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          currency: order.currency,
          orderType: order.orderType,
          createdAt: order.createdAt,
          itemCount: order.orderItems.length,
          items: order.orderItems,
          restaurantName: order.menus.name,
          restaurantSlug: order.menus.slug,
          restaurantLogo: order.menus.logoImageUrl,
        })),
        nextCursor,
      };
    }),

  // Private: Get count of pending orders across all menus owned by the user
  getPendingOrderCount: privateProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.orders.count({
      where: {
        status: { in: ["pending", "confirmed", "preparing"] },
        menus: { userId: ctx.user.id },
      },
    });

    return { count };
  }),
});
