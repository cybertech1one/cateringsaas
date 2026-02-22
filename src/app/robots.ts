import { type MetadataRoute } from "next";
import { getAppUrl } from "~/utils/getBaseUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/explore",
          "/explore/",
          "/for-restaurants",
          "/for-restaurants/",
          "/for-drivers",
          "/for-drivers/",
          "/menu/",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/menu/create",
          "/menu/manage/",
          "/order/",
          "/feedback/",
        ],
      },
    ],
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
