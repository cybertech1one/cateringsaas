import { type PrismaClient } from "@prisma/client";

export const DEFAULT_MENU_LANGUAGE_NAME = "French";

const prepareTextForSlug = (text: string) => {
  return text.replace(/ /g, "-").toLowerCase();
};

export const generateMenuSlug = ({
  name,
  city,
}: {
  name: string;
  city: string;
}) => {
  const randomNumber = Math.random().toString().slice(2, 8);
  const slug = `${prepareTextForSlug(name)}-${prepareTextForSlug(
    city,
  )}-${randomNumber}`;
  const alphaNumericSlug = slug.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return alphaNumericSlug;
};

export const getFullMenu = async (slug: string, db: PrismaClient) =>
  db.menus.findFirst({
    where: {
      slug: slug,
    },
    select: {
      name: true,
      slug: true,
      address: true,
      city: true,
      contactNumber: true,
      whatsappNumber: true,
      backgroundImageUrl: true,
      logoImageUrl: true,
      currency: true,
      id: true,
      userId: true,
      isPublished: true,
      facebookUrl: true,
      googleReviewUrl: true,
      instagramUrl: true,
      dishes: {
        select: {
          id: true,
          menuId: true,
          categoryId: true,
          dishesTranslation: {
            select: {
              name: true,
              description: true,
              languageId: true,
            },
          },
          price: true,
          carbohydrates: true,
          fats: true,
          protein: true,
          calories: true,
          dishesTag: {
            select: {
              tagName: true,
            },
          },
          categories: {
            select: {
              categoriesTranslation: {
                select: {
                  name: true,
                  languageId: true,
                },
              },
              id: true,
            },
          },
          dishVariants: {
            select: {
              id: true,
              price: true,
              variantTranslations: {
                select: {
                  name: true,
                  description: true,
                  languageId: true,
                },
              },
            },
          },
          pictureUrl: true,
          isSoldOut: true,
          isFeatured: true,
          prepTimeMinutes: true,
        },
      },
      categories: {
        select: {
          id: true,
          categoriesTranslation: {
            select: {
              name: true,
              languageId: true,
            },
          },
        },
      },
      menuLanguages: {
        select: {
          languageId: true,
          menuId: true,
          isDefault: true,
          languages: {
            select: {
              name: true,
              isoCode: true,
              flagUrl: true,
              id: true,
            },
          },
        },
      },
      cuisineType: {
        select: {
          name: true,
        },
      },
      phone: true,
      website: true,
      openingHours: true,
      rating: true,
      reviewCount: true,
      isFeatured: true,
      enabledOrderTypes: true,
      deliveryFee: true,
      deliveryRadiusKm: true,
      minOrderAmount: true,
      estimatedPrepTime: true,
    },
  });
