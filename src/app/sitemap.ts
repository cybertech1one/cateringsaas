import { type MetadataRoute } from "next";
import { db } from "~/server/db";
import { getAppUrl } from "~/utils/getBaseUrl";
import { MOROCCO_CITIES } from "~/data/moroccoCities";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // City-specific explore pages for SEO
  const cityPages: MetadataRoute.Sitemap = MOROCCO_CITIES.map((city) => ({
    url: `${baseUrl}/explore/${city.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Dynamic published caterer profile pages
  let orgPages: MetadataRoute.Sitemap = [];

  try {
    const publishedOrgs = await db.organizations.findMany({
      where: { isPublished: true, isActive: true },
      select: { slug: true, updatedAt: true },
    });

    orgPages = publishedOrgs.map((org) => ({
      url: `${baseUrl}/caterer/${org.slug}`,
      lastModified: org.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB might not be available during build
  }

  return [...staticPages, ...cityPages, ...orgPages];
}
