import { notFound } from "next/navigation";
import React from "react";
import { ThemedMenuView } from "~/components/ThemedMenuView/ThemedMenuView";
import { MenuPWAWrapper } from "~/components/PWA/MenuPWAWrapper";
import { api } from "~/trpc/server";
import { getAppUrl } from "~/utils/getBaseUrl";
import { DEFAULT_THEME, type MenuTheme } from "~/lib/theme/types";
import { type ThemedPromotion } from "~/components/ThemedMenuView/components/PromotionsBanner";

function buildJsonLd(
  data: {
    name: string;
    address?: string | null;
    city?: string | null;
    logoImageUrl?: string | null;
    contactNumber?: string | null;
    whatsappNumber?: string | null;
    cuisineType?: { name: string } | null;
  },
  slug: string,
) {
  const appUrl = getAppUrl();
  const telephone = data.contactNumber ?? data.whatsappNumber;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: data.name,
    url: `${appUrl}/menu/${slug}`,
    ...(data.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: data.address,
            ...(data.city ? { addressLocality: data.city } : {}),
          },
        }
      : {}),
    ...(data.logoImageUrl ? { image: data.logoImageUrl } : {}),
    ...(telephone ? { telephone } : {}),
    ...(data.cuisineType?.name ? { servesCuisine: data.cuisineType.name } : {}),
    priceRange: "$$",
    hasMenu: {
      "@type": "Menu",
      name: `${data.name} Menu`,
      url: `${appUrl}/menu/${slug}`,
    },
  };
}

export const MenuPage = async ({
  params: { slug },
}: {
  params: { slug: string };
}) => {
  const data = await api.menus.getPublicMenuBySlug
    .query({ slug })
    .catch(() => notFound());

  if (!data.isPublished) {
    notFound();
  }

  // Fetch theme and promotions server-side for initial render (no layout shift)
  const [fetchedTheme, initialPromotions] = await Promise.all([
    api.theme.getPublicTheme
      .query({ menuSlug: slug })
      .catch(() => null),
    api.promotions.getActiveBySlug
      .query({ slug })
      .catch(() => []),
  ]);

  // Merge with defaults so ThemedMenuView always has a complete theme
  const theme: MenuTheme = { ...DEFAULT_THEME, ...(fetchedTheme ?? {}) } as MenuTheme;

  // Map promotions to ThemedPromotion shape (add endDate)
  const activePromotions: ThemedPromotion[] = (initialPromotions ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    promotionType: p.promotionType,
    discountPercent: p.discountPercent,
    discountAmount: p.discountAmount,
    imageUrl: p.imageUrl,
    endDate: (p as Record<string, unknown>).endDate as string | null ?? null,
  }));

  const jsonLd = buildJsonLd(data, slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MenuPWAWrapper>
        <main id="main-content" className="mx-auto min-h-screen w-full max-w-3xl">
          <ThemedMenuView menu={data} theme={theme} activePromotions={activePromotions} />
        </main>
      </MenuPWAWrapper>
    </>
  );
};
