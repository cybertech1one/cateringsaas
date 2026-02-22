import { type Metadata } from "next";
import { api } from "~/trpc/server";
import { getAppUrl } from "~/utils/getBaseUrl";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;

  const data = await api.menus.getPublicMenuBySlug
    .query({ slug })
    .catch(() => null);

  if (!data) return {};

  const title = `${data.name} - Links`;
  const description = [data.address, data.city].filter(Boolean).join(", ") ||
    `Find ${data.name} online — menu, social media, and contact info`;
  const url = `${getAppUrl()}/r/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "FeastQR",
      type: "website",
      ...(data.logoImageUrl
        ? { images: [{ url: data.logoImageUrl, alt: data.name }] }
        : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      site: "@feastqr",
      ...(data.logoImageUrl ? { images: [data.logoImageUrl] } : {}),
    },
  };
}

export { RestaurantLinksPage as default } from "~/pageComponents/RestaurantLinks/RestaurantLinks.page";
