import { type Metadata } from "next";
import { getAppUrl } from "~/utils/getBaseUrl";

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title:
    "Diyafa — Morocco's Premier Catering Platform | Weddings, Corporate Events & Celebrations",
  description:
    "Diyafa is Morocco's leading catering management platform. Manage event bookings, build professional quotes, create catering menus, track payments, and coordinate staff. Trusted by caterers in Casablanca, Marrakech, Rabat, Fes, Tangier & more. Free to start.",
  alternates: {
    canonical: `${appUrl}/`,
  },
  keywords: [
    "Diyafa",
    "catering Morocco",
    "catering platform Morocco",
    "wedding catering Morocco",
    "corporate catering Morocco",
    "traiteur Maroc",
    "traiteur mariage Maroc",
    "ضيافة المغرب",
    "catering management software",
    "event catering Casablanca",
    "catering Marrakech",
    "traiteur Casablanca",
    "Diyafa catering",
    "plateforme traiteur Maroc",
    "best catering service Morocco",
    "catering Rabat",
    "traiteur Rabat",
    "Ramadan iftar catering Morocco",
  ],
  openGraph: {
    title:
      "Diyafa — Morocco's Premier Catering Platform | Weddings, Events & Celebrations",
    description:
      "Morocco's leading catering platform for weddings, corporate events & celebrations. Manage menus, quotes, bookings, staff, and payments. Trusted by caterers across Morocco.",
    type: "website",
    url: `${appUrl}/`,
    siteName: "Diyafa",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diyafa — Morocco's Premier Catering Platform",
    description:
      "Morocco's leading catering platform for weddings, corporate events & celebrations. AI-powered menu management and event logistics. Free to start.",
    site: "@diyafa_ma",
  },
};

function HomeJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${appUrl}/#website`,
        url: appUrl,
        name: "Diyafa",
        description:
          "Morocco's premier catering management platform. Event bookings, professional quotes, catering menus, payment tracking, and staff coordination for caterers, restaurants, hotels, and venues.",
        publisher: { "@id": `${appUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${appUrl}/explore?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        inLanguage: ["en", "fr", "ar"],
      },
      {
        "@type": "Organization",
        "@id": `${appUrl}/#organization`,
        name: "Diyafa",
        alternateName: "ضيافة",
        url: appUrl,
        logo: {
          "@type": "ImageObject",
          url: `${appUrl}/icon-512x512.png`,
          width: 512,
          height: 512,
        },
        description:
          "Diyafa is Morocco's premier catering SaaS platform. It connects caterers, restaurants, hotels, and venues with clients planning weddings, corporate events, Ramadan iftars, and celebrations. Manage event bookings, build TVA-compliant quotes, create catering menus, track COD and milestone payments, schedule staff and equipment, and grow your catering business — all in English, French, and Arabic.",
        foundingDate: "2024",
        areaServed: {
          "@type": "Country",
          name: "Morocco",
        },
        serviceArea: [
          { "@type": "City", name: "Casablanca" },
          { "@type": "City", name: "Marrakech" },
          { "@type": "City", name: "Rabat" },
          { "@type": "City", name: "Fes" },
          { "@type": "City", name: "Tangier" },
          { "@type": "City", name: "Agadir" },
          { "@type": "City", name: "Meknes" },
          { "@type": "City", name: "Oujda" },
          { "@type": "City", name: "Kenitra" },
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          availableLanguage: ["English", "French", "Arabic"],
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "Diyafa",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "All-in-one catering management platform: event booking pipeline (inquiry to settlement), professional TVA-compliant quote builder, catering menu management with per-head and package pricing, COD and milestone payment tracking, staff scheduling and assignment, equipment inventory, portfolio gallery, analytics dashboard, multi-language support (English, French, Arabic with RTL), WhatsApp integration, and AI-powered tools.",
        offers: [
          {
            "@type": "Offer",
            name: "Free Plan",
            price: "0",
            priceCurrency: "MAD",
            description:
              "1 organization, 3 menus, 5 events per month, basic quotes, analytics, WhatsApp integration",
          },
          {
            "@type": "Offer",
            name: "Pro Plan",
            price: "299",
            priceCurrency: "MAD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: "299",
              priceCurrency: "MAD",
              billingDuration: "P1M",
            },
            description:
              "Unlimited events, milestone payments, invoicing, full analytics, priority support, staff management, equipment tracking, portfolio gallery",
          },
        ],
        featureList: [
          "Event Management & Booking Pipeline (12-state lifecycle)",
          "Professional Quote Builder (TVA-compliant, per-head/per-dish/package)",
          "Catering Menu Management (packages, tiers, dietary options)",
          "COD Payment Tracking & Milestone Deposits",
          "Staff Scheduling & Assignment",
          "Equipment & Inventory Tracking",
          "Portfolio & Gallery Management",
          "Revenue & Booking Analytics Dashboard",
          "Multi-Language Support (English, French, Arabic with RTL)",
          "WhatsApp Business Integration",
          "AI-Powered Content Generation",
          "Client CRM & Contact Management",
          "Financial Reporting & Invoicing",
          "Multi-Organization Management",
        ],
        screenshot: `${appUrl}/images/landing/hero-mockup.png`,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is Diyafa?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Diyafa is Morocco's premier catering management platform. It helps caterers, restaurants, hotels, and venues manage event bookings, build professional quotes, create catering menus, track payments (including COD), schedule staff, and grow their business. Available in English, French, and Arabic with full RTL support.",
            },
          },
          {
            "@type": "Question",
            name: "How much does Diyafa cost?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Diyafa offers a free plan with 1 organization, 3 menus, 5 events per month, basic quotes, and analytics. The Pro plan at 299 MAD/month unlocks unlimited events, milestone payments, invoicing, full analytics, staff management, equipment tracking, and priority support. No hidden fees, no commission on your revenue.",
            },
          },
          {
            "@type": "Question",
            name: "What is the best catering service platform in Morocco?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Diyafa is Morocco's leading catering platform, purpose-built for the Moroccan market. Unlike generic CRM tools or WhatsApp/Excel workflows, Diyafa offers a complete event-to-settlement pipeline: inquiry management, TVA-compliant quote builder, catering menu management, COD payment tracking, staff scheduling, and portfolio showcase. It supports English, French, and Arabic with RTL.",
            },
          },
          {
            "@type": "Question",
            name: "Does Diyafa support COD (Cash on Delivery) payments?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Diyafa is built for Morocco's payment landscape where 74% of transactions are cash. Track COD payments, milestone deposits, and bank transfers for every event. Mark payments as received, generate invoices, and maintain complete financial records.",
            },
          },
          {
            "@type": "Question",
            name: "Does Diyafa support Arabic menus and RTL layout?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Diyafa fully supports English, French, and Arabic with proper right-to-left (RTL) layout, the Noto Sans Arabic font, and AI-powered auto-translation. Your dashboard, quotes, menus, and client-facing pages all work seamlessly in Arabic.",
            },
          },
          {
            "@type": "Question",
            name: "Which cities does Diyafa serve in Morocco?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Diyafa operates across all major Moroccan cities including Casablanca, Marrakech, Rabat, Fes, Tangier, Agadir, Meknes, Oujda, and Kenitra. The platform works anywhere with an internet connection and is expanding to serve the entire MENA region.",
            },
          },
          {
            "@type": "Question",
            name: "Can I manage wedding catering with Diyafa?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Absolutely. Diyafa handles all types of catering events: weddings, corporate lunches, Ramadan iftars, birthday parties, conference catering, and more. Create customized per-head or package menus, generate professional quotes with TVA, track deposits and milestone payments, and coordinate staff and equipment for each event.",
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

export default async function HomePage() {
  const { LandingPage } = await import(
    "~/pageComponents/LandingPage/LandingPage.page"
  );

  return (
    <>
      <HomeJsonLd />
      <LandingPage />
    </>
  );
}
