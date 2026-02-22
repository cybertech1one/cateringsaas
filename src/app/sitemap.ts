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
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/for-restaurants`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/for-drivers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // City-specific landing pages for SEO (sourced from shared moroccoCities data)
  const cityPages: MetadataRoute.Sitemap = MOROCCO_CITIES.flatMap((city) => [
    {
      url: `${baseUrl}/for-drivers/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for-restaurants/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ]);

  // Dynamic published organization pages
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
