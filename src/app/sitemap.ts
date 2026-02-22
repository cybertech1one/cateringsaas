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

  // Dynamic published menu pages
  let menuPages: MetadataRoute.Sitemap = [];
  let explorePages: MetadataRoute.Sitemap = [];

  try {
    const publishedMenus = await db.menus.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });

    menuPages = publishedMenus.map((menu) => ({
      url: `${baseUrl}/menu/${menu.slug}`,
      lastModified: menu.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // Explore / directory pages
    const cities = await db.city.findMany({
      select: { slug: true, createdAt: true },
    });

    explorePages = [
      {
        url: `${baseUrl}/explore`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
      ...cities.map((city) => ({
        url: `${baseUrl}/explore/${city.slug}`,
        lastModified: city.createdAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // DB might not be available during build
  }

  return [...staticPages, ...cityPages, ...menuPages, ...explorePages];
}
