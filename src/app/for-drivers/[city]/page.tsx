import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppUrl } from "~/utils/getBaseUrl";
import {
  getCityBySlug,
  getAllCitySlugs,
  MOROCCO_CITIES,
} from "~/data/moroccoCities";
import { CityDriverPage } from "~/pageComponents/ForDrivers/CityDriverPage";

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
  const title = `Deliver in ${city.name} — Join FeastQR | Earn ${city.avgEarnings} MAD/day`;
  const description = `Become a delivery driver in ${city.name}. Earn ${city.avgEarnings} MAD/day with zero platform fees. ${city.driverCount}+ drivers already active. Join Morocco's independent delivery network.`;

  return {
    title,
    description,
    alternates: { canonical: `${appUrl}/for-drivers/${city.slug}` },
    openGraph: {
      title: `Deliver in ${city.name} — FeastQR`,
      description: `Earn ${city.avgEarnings} MAD/day delivering in ${city.name}. Zero fees, flexible hours, direct restaurant pay.`,
      type: "website",
      url: `${appUrl}/for-drivers/${city.slug}`,
      siteName: "FeastQR",
    },
    twitter: {
      card: "summary_large_image",
      title: `Deliver in ${city.name} — FeastQR`,
      description: `Earn ${city.avgEarnings} MAD/day delivering in ${city.name}. Zero platform fees.`,
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
            name: "For Drivers",
            item: `${appUrl}/for-drivers`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: city.name,
            item: `${appUrl}/for-drivers/${city.slug}`,
          },
        ],
      },
      {
        "@type": "WebPage",
        name: `Deliver in ${city.name} — FeastQR`,
        description: `Become a delivery driver in ${city.name}. Earn ${city.avgEarnings} MAD/day with zero platform fees.`,
        url: `${appUrl}/for-drivers/${city.slug}`,
        isPartOf: {
          "@type": "WebSite",
          name: "FeastQR",
          url: appUrl,
        },
      },
      {
        "@type": "JobPosting",
        title: `Delivery Driver in ${city.name}`,
        description: `Independent delivery driver opportunity in ${city.name}, Morocco. Earn ${city.avgEarnings} MAD per day delivering food for local restaurants through FeastQR. Zero platform fees — keep 100% of delivery earnings. Flexible schedule, direct restaurant relationships.`,
        datePosted: "2026-01-01",
        validThrough: "2026-12-31",
        employmentType: "CONTRACTOR",
        hiringOrganization: {
          "@type": "Organization",
          name: "FeastQR",
          sameAs: appUrl,
          logo: `${appUrl}/icon-512x512.png`,
        },
        jobLocation: {
          "@type": "Place",
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
        },
        baseSalary: {
          "@type": "MonetaryAmount",
          currency: "MAD",
          value: {
            "@type": "QuantitativeValue",
            minValue: parseInt(city.avgEarnings.split("-")[0] ?? "0"),
            maxValue: parseInt(city.avgEarnings.split("-")[1] ?? "0"),
            unitText: "DAY",
          },
        },
        applicantLocationRequirements: {
          "@type": "Country",
          name: "Morocco",
        },
        jobBenefits:
          "Zero platform fees, flexible schedule, direct restaurant payments, keep 100% of tips",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `How much can I earn delivering in ${city.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Drivers in ${city.name} typically earn ${city.avgEarnings} MAD per day, depending on hours worked and delivery zones. With ${city.restaurantCount}+ partner restaurants, there is consistent order volume.`,
            },
          },
          {
            "@type": "Question",
            name: "What do I need to start delivering?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You need a valid CIN (Carte d'Identit\u00e9 Nationale), a smartphone with internet access, and a motorcycle or bicycle. Registration takes under 5 minutes.",
            },
          },
          {
            "@type": "Question",
            name: "Does FeastQR take a commission from drivers?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. FeastQR charges zero commission from drivers. You keep 100% of your delivery fees and tips. Restaurants pay you directly via cash or bank transfer.",
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
      <CityDriverPage city={city} neighborCities={neighborCities} />
    </>
  );
}
