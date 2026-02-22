import { type Metadata } from "next";
import { getAppUrl } from "~/utils/getBaseUrl";

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "For Drivers - Diyafa | Deliver & Earn on Your Terms",
  description:
    "Join Morocco's independent delivery network. Work directly with restaurants, set your own schedule, earn 350-600 MAD/day with zero platform fees.",
  alternates: { canonical: `${appUrl}/for-drivers` },
  keywords: [
    "delivery driver Morocco",
    "food delivery jobs Casablanca",
    "livreur Maroc",
    "Diyafa driver",
    "delivery driver Marrakech",
    "gig economy Morocco",
    "سائق توصيل المغرب",
  ],
  openGraph: {
    title: "For Drivers - Diyafa | Deliver & Earn on Your Terms",
    description:
      "Deliver food and earn on your terms. Zero platform fees. Work directly with restaurants across Morocco.",
    type: "website",
    url: `${appUrl}/for-drivers`,
    siteName: "Diyafa",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deliver & Earn with Diyafa — Zero Commission",
    description:
      "Join 500+ drivers earning 350-600 MAD/day across Morocco. No algorithm boss, no platform fees.",
  },
};

function DriversJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${appUrl}/for-drivers`,
        url: `${appUrl}/for-drivers`,
        name: "Become a Delivery Driver — Diyafa Morocco",
        description:
          "Join Morocco's independent food delivery network. Earn 350-600 MAD/day with zero platform commission.",
        isPartOf: { "@id": `${appUrl}/#website` },
        breadcrumb: { "@id": `${appUrl}/for-drivers#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${appUrl}/for-drivers#breadcrumb`,
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
        ],
      },
      {
        "@type": "JobPosting",
        title: "Freelance Delivery Driver",
        description:
          "Deliver food for local restaurants through Diyafa. Choose your hours, choose your restaurants, keep 100% of delivery fees. No commission taken by the platform.",
        datePosted: "2026-01-01",
        validThrough: "2027-01-01",
        employmentType: "CONTRACTOR",
        hiringOrganization: {
          "@type": "Organization",
          name: "Diyafa",
          sameAs: appUrl,
          logo: `${appUrl}/images/logo.png`,
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressCountry: "MA",
            addressRegion: "Grand Casablanca",
          },
        },
        baseSalary: {
          "@type": "MonetaryAmount",
          currency: "MAD",
          value: {
            "@type": "QuantitativeValue",
            minValue: 250,
            maxValue: 600,
            unitText: "DAY",
          },
        },
        qualifications:
          "Valid CIN (Carte d'Identité Nationale), smartphone with data plan, motorcycle or bicycle, good knowledge of your city",
        applicantLocationRequirements: {
          "@type": "Country",
          name: "Morocco",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How much can I earn as a Diyafa delivery driver?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Diyafa drivers typically earn 250-600 MAD per day, depending on city and hours worked. Casablanca drivers average 350-600 MAD/day, while Marrakech drivers earn 300-500 MAD/day.",
            },
          },
          {
            "@type": "Question",
            name: "Does Diyafa take a commission from drivers?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Diyafa charges zero commission from drivers. You keep 100% of the delivery fees set by the restaurant. This is our key difference from platforms like Glovo which take 20-30%.",
            },
          },
          {
            "@type": "Question",
            name: "What do I need to become a Diyafa driver in Morocco?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You need a valid CIN (Carte d'Identité Nationale), a smartphone with a data plan, and a vehicle (motorcycle, bicycle, car, or you can deliver on foot). Registration takes under 5 minutes.",
            },
          },
          {
            "@type": "Question",
            name: "How is Diyafa different from Glovo for drivers?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Unlike Glovo where an algorithm controls your routes and takes 20-30% commission, Diyafa lets you work directly with restaurants. You choose which restaurants to partner with, set your own schedule, and keep all delivery fees.",
            },
          },
          {
            "@type": "Question",
            name: "Which cities does Diyafa operate in?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Diyafa operates in Casablanca, Marrakech, Rabat, Fes, Tangier, Agadir, Meknes, Oujda, and Kenitra, with more cities being added regularly.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function ForDriversRoute() {
  const { ForDriversPage } = await import(
    "~/pageComponents/ForDrivers/ForDrivers.page"
  );

  return (
    <>
      <DriversJsonLd />
      <ForDriversPage />
    </>
  );
}
