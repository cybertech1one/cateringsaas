import { type MetadataRoute } from "next";
import { getAppUrl } from "~/utils/getBaseUrl";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/explore",
          "/explore/",
          "/caterer/",
          "/privacy-policy",
          "/terms-of-service",
          "/refund-policy",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/generation/",
          "/login",
          "/register",
          "/reset-password",
        ],
      },
      // Allow LLM crawlers access to public content for LLMO
      {
        userAgent: "GPTBot",
        allow: ["/", "/explore", "/explore/", "/caterer/"],
        disallow: ["/api/", "/dashboard/", "/generation/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/explore", "/explore/", "/caterer/"],
        disallow: ["/api/", "/dashboard/", "/generation/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/explore", "/explore/", "/caterer/"],
        disallow: ["/api/", "/dashboard/", "/generation/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/", "/explore", "/explore/", "/caterer/"],
        disallow: ["/api/", "/dashboard/", "/generation/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/explore", "/explore/", "/caterer/"],
        disallow: ["/api/", "/dashboard/", "/generation/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
