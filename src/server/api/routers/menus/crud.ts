import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { menuValidationSchema } from "~/components/MenuForm/MenuForm.schema";
import { socialMediaValidationSchema } from "~/pageComponents/RestaurantDashboard/molecules/SocialMediaHandles/SocialMediaHandles.schema";
import {
  createTRPCRouter,
  privateProcedure,
} from "~/server/api/trpc";
import { cache } from "~/server/cache";
import { logger } from "~/server/logger";
import { checkTierLimit } from "~/server/tierCheck";
import {
  generateBackgroundImagePath,
  generateMenuImagePath,
} from "~/server/supabase/storagePaths";
import {
  storageBucketsNames,
  supabase,
} from "~/server/supabase/supabaseClient";
import { asOptionalField } from "~/utils/utils";
import {
  DEFAULT_MENU_LANGUAGE_NAME,
  generateMenuSlug,
  getFullMenu,
} from "./_shared";

export const menuCrudRouter = createTRPCRouter({
  getMenus: privateProcedure.query(({ ctx }) => {
    return ctx.db.menus.findMany({
      where: {
        userId: ctx.user.id,
      },
      include: {
        _count: {
          select: { dishes: true },
        },
      },
    });
  }),

  upsertMenu: privateProcedure
    .input(menuValidationSchema)
    .mutation(async ({ ctx, input }) => {
      // Tier check: only enforce when creating a new menu (no id means create)
      if (!input.id) {
        const tierResult = await checkTierLimit(ctx.db, ctx.user.id, "menu");

        if (!tierResult.allowed) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Free plan limit: ${tierResult.limit} menu. Upgrade to Pro for unlimited menus.`,
          });
        }
      }

      const result = await ctx.db.menus.upsert({
        where: {
          id: input.id || "00000000-0000-0000-0000-000000000000",
          userId: ctx.user.id,
        },
        create: {
          name: input.name,
          address: input.address,
          city: input.city,
          slug: generateMenuSlug({
            name: input.name,
            city: input.city,
          }),
          userId: ctx.user.id,
          contactNumber: input.contactPhoneNumber,
          whatsappNumber: input.whatsappNumber || null,
          isPublished: false,
          menuLanguages: {
            create: {
              isDefault: true,
              languages: {
                connect: {
                  name: DEFAULT_MENU_LANGUAGE_NAME,
                },
              },
            },
          },
        },
        update: {
          name: input.name,
          address: input.address,
          city: input.city,
          slug: generateMenuSlug({
            name: input.name,
            city: input.city,
          }),
          contactNumber: input.contactPhoneNumber,
          whatsappNumber: input.whatsappNumber || null,
        },
      });

      // Invalidate cache when updating existing menu
      if (input.id) {
        cache.invalidate("public:menu:");
      }

      return result;
    }),

  updateMenuSocials: privateProcedure
    .input(socialMediaValidationSchema.extend({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.menus.update({
        where: {
          id: input.menuId,
          userId: ctx.user.id,
        },
        data: {
          facebookUrl: input.facebookUrl || null,
          instagramUrl: input.instagramUrl || null,
          googleReviewUrl: input.googleReviewUrl || null,
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  updateMenuBackgroundImg: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        backgroundImgUrl: asOptionalField(z.string().url()).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.backgroundImgUrl === null) {
        const menusPromise = ctx.db.menus.update({
          where: {
            id: input.menuId,
            userId: ctx.user.id,
          },
          data: {
            backgroundImageUrl: null,
          },
        });

        const imagePromise = supabase()
          .storage.from(storageBucketsNames.menus)
          .remove([
            generateBackgroundImagePath({
              menuId: input.menuId,
              userId: ctx.user.id,
            }),
          ]);

        const [imageResult, menuResult] = await Promise.all([imagePromise, menusPromise]);

        if (imageResult.error) {
          logger.warn("Failed to remove background image from storage", imageResult.error.message, "menus");
        }

        cache.invalidate("public:menu:");

        return menuResult;
      }

      const result = await ctx.db.menus.update({
        where: {
          id: input.menuId,
          userId: ctx.user.id,
        },
        data: {
          backgroundImageUrl: input.backgroundImgUrl,
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  updateMenuLogoImg: privateProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        logoImgUrl: asOptionalField(z.string().url()).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.logoImgUrl === null) {
        const menusPromise = ctx.db.menus.update({
          where: {
            id: input.menuId,
            userId: ctx.user.id,
          },
          data: {
            logoImageUrl: null,
          },
        });

        const imagePromise = supabase()
          .storage.from(storageBucketsNames.menus)
          .remove([
            generateMenuImagePath({
              menuId: input.menuId,
              userId: ctx.user.id,
            }),
          ]);

        const [imageResult, menuResult] = await Promise.all([imagePromise, menusPromise]);

        if (imageResult.error) {
          logger.warn("Failed to remove logo image from storage", imageResult.error.message, "menus");
        }

        cache.invalidate("public:menu:");

        return menuResult;
      }

      const result = await ctx.db.menus.update({
        where: {
          id: input.menuId,
          userId: ctx.user.id,
        },
        data: {
          logoImageUrl: input.logoImgUrl,
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),

  getMenuBySlug: privateProcedure
    .input(z.object({ slug: z.string().max(200) }))
    .query(async ({ ctx, input }) => {
      const menu = await getFullMenu(input.slug, ctx.db);

      if (!menu) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Menu not found",
        });
      }

      if (menu.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return menu;
    }),

  deleteMenu: privateProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.menus.delete({
        where: {
          id: input.menuId,
          userId: ctx.user.id,
        },
      });

      cache.invalidate("public:menu:");

      return result;
    }),
});
