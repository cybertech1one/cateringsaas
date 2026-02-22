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

  const data = await api.menus.getPublicMenuBySlug.query({ slug }).catch(() => {
    return null;
  });

  if (!data) return {};

  const title = `${data.name} - Digital Menu`;
  const description = [data.address, data.city].filter(Boolean).join(", ") ||
    `View the digital menu for ${data.name} on FeastQR`;
  const url = `${getAppUrl()}/menu/${slug}`;

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
      ...(data.logoImageUrl ? { images: [{ url: data.logoImageUrl, alt: data.name }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@feastqr",
      ...(data.logoImageUrl ? { images: [data.logoImageUrl] } : {}),
    },
  };
}

export { MenuPage as default } from "~/pageComponents/Menu/Menu.page";
