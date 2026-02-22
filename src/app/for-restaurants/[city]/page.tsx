import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppUrl } from "~/utils/getBaseUrl";
import {
  getCityBySlug,
  getAllCitySlugs,
  MOROCCO_CITIES,
} from "~/data/moroccoCities";
import { CityRestaurantPage } from "~/pageComponents/ForRestaurants/CityRestaurantPage";

export function generateStaticParams() {
  return getAllCitySlugs();
}

export async function generateMetadata({
  params,
}: {
  params: { city: string };
}): Promise<Metadata> {
  const city = getCityBySlug(params.city);

  if (!city) return {};

  const appUrl = getAppUrl();
  const title = `FeastQR for Restaurants in ${city.name} — Digital Menus & Delivery`;
  const description = `${city.restaurantCount}+ restaurants in ${city.name} use FeastQR. Digital menus, online ordering, delivery management. Zero commission. Free to start.`;

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/for-restaurants/${city.slug}` },
    openGraph: {
      title: `FeastQR for Restaurants in ${city.name}`,
      description: `${city.restaurantCount}+ restaurants in ${city.name} trust FeastQR. Digital menus, AI content, online ordering.`,
      type: "website",
      url: `${appUrl}/for-restaurants/${city.slug}`,
      siteName: "FeastQR",
    },
    twitter: {
      card: "summary_large_image",
      title: `FeastQR for Restaurants in ${city.name}`,
      description: `${city.restaurantCount}+ restaurants in ${city.name} use FeastQR. Zero commission.`,
    },
  };
}

export default function Page({ params }: { params: { city: string } }) {
  const city = getCityBySlug(params.city);

  if (!city) notFound();

  const appUrl = getAppUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: appUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "For Restaurants",
            item: `${appUrl}/for-restaurants`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: city.name,
            item: `${appUrl}/for-restaurants/${city.slug}`,
          },
        ],
      },
      {
        "@type": "WebPage",
        name: `FeastQR for Restaurants in ${city.name}`,
        description: `${city.restaurantCount}+ restaurants in ${city.name} use FeastQR for digital menus, online ordering, and delivery management.`,
        url: `${appUrl}/for-restaurants/${city.slug}`,
        isPartOf: {
          "@type": "WebSite",
          name: "FeastQR",
          url: appUrl,
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "FeastQR",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "MAD",
          description: "Free plan available. Zero commission on all orders.",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: city.restaurantCount,
          bestRating: "5",
        },
        featureList:
          "Digital QR menus, AI menu builder, Online ordering, Delivery management, Multi-language support (EN/FR/AR), Real-time analytics, 30+ templates, Kitchen display system",
      },
      {
        "@type": "LocalBusiness",
        name: `FeastQR - ${city.name}`,
        description: `FeastQR restaurant technology platform serving ${city.restaurantCount}+ restaurants in ${city.name}, Morocco.`,
        address: {
          "@type": "PostalAddress",
          addressLocality: city.name,
          addressCountry: "MA",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: city.lat,
          longitude: city.lng,
        },
        areaServed: {
          "@type": "City",
          name: city.name,
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `How much does FeastQR cost for restaurants in ${city.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: "FeastQR is free to start. The free plan includes QR menus, basic analytics, and up to 3 menu templates. Pro plans unlock advanced features like AI menu builder, 30+ templates, and delivery network access.",
            },
          },
          {
            "@type": "Question",
            name: "Can I manage my own delivery drivers?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! Unlike Glovo or Jumia Food, FeastQR lets you recruit and manage your own delivery drivers directly. No middleman, no commission on deliveries. Your drivers, your relationships.",
            },
          },
          {
            "@type": "Question",
            name: "Does FeastQR support Arabic menus?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. FeastQR supports English, French, and Arabic with full RTL (right-to-left) support. AI auto-translate can generate translations for all your menu items instantly.",
            },
          },
        ],
      },
    ],
  };

  const neighborCities = MOROCCO_CITIES.filter(
    (c) => c.slug !== city.slug,
  ).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CityRestaurantPage city={city} neighborCities={neighborCities} />
    </>
  );
}
