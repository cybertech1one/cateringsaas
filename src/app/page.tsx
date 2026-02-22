import { type Metadata } from "next";
import { getAppUrl } from "~/utils/getBaseUrl";

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title:
    "FeastQR — Morocco's #1 Restaurant Platform | QR Menus, Online Ordering & Delivery",
  description:
    "FeastQR is Morocco's leading zero-commission restaurant platform. Create QR digital menus, accept online orders, manage your own delivery drivers, and grow with AI tools. 2000+ restaurants in Casablanca, Marrakech, Rabat, Fes, Tangier & more. Free to start.",
  alternates: {
    canonical: `${appUrl}/`,
  },
  keywords: [
    "FeastQR",
    "restaurant QR menu Morocco",
    "digital menu Morocco",
    "online ordering Morocco",
    "food delivery Morocco",
    "menu numérique Maroc",
    "قائمة رقمية المغرب",
    "restaurant technology Morocco",
    "zero commission food platform",
    "QR code menu Casablanca",
    "restaurant management software",
    "FeastQR vs Glovo",
    "menu numérique Casablanca",
    "commande en ligne Maroc",
  ],
  openGraph: {
    title:
      "FeastQR — Morocco's #1 Restaurant Platform | QR Menus & Online Ordering",
    description:
      "Create stunning QR menus, accept orders, manage delivery — all zero commission. 2000+ restaurants trust FeastQR across Morocco.",
    type: "website",
    url: `${appUrl}/`,
    siteName: "FeastQR",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeastQR — Morocco's #1 Restaurant Platform",
    description:
      "Zero-commission QR menus, online ordering, AI tools & delivery management. 2000+ restaurants across Morocco. Free to start.",
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
        name: "FeastQR",
        description:
          "Morocco's leading zero-commission restaurant platform. QR digital menus, online ordering, delivery management, and AI-powered tools.",
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
        name: "FeastQR",
        url: appUrl,
        logo: {
          "@type": "ImageObject",
          url: `${appUrl}/icon-512x512.png`,
          width: 512,
          height: 512,
        },
        description:
          "FeastQR is an open-source SaaS platform that empowers restaurants in Morocco with QR digital menus, online ordering, delivery driver management, AI content generation, multilingual support (English, French, Arabic), analytics, and loyalty programs — all at zero commission.",
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
        sameAs: [`${appUrl}/for-restaurants`, `${appUrl}/for-drivers`],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          availableLanguage: ["English", "French", "Arabic"],
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "FeastQR",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "All-in-one restaurant platform: QR digital menus with 30+ templates, online ordering (dine-in, pickup, delivery), AI menu builder (import from photo/PDF), delivery driver network management, multi-language support (English, French, Arabic with RTL), real-time analytics, kitchen display system, loyalty stamp cards, WhatsApp order notifications, and revenue tracking — all at zero commission.",
        offers: [
          {
            "@type": "Offer",
            name: "Free Plan",
            price: "0",
            priceCurrency: "MAD",
            description:
              "1 menu, 6 templates, basic analytics, QR codes, online ordering, WhatsApp notifications",
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
              "Unlimited menus, 30+ templates, AI menu builder, delivery network, full analytics, priority support, staff management, promotions engine",
          },
        ],
        featureList: [
          "QR Code Digital Menus (30+ templates)",
          "Online Ordering (dine-in, pickup, delivery)",
          "Zero Commission on All Orders",
          "AI Menu Builder (import from photo or PDF)",
          "AI Auto-Translation (English, French, Arabic)",
          "Delivery Driver Network Management",
          "Kitchen Display System (real-time KDS)",
          "Revenue & Order Analytics Dashboard",
          "Loyalty Stamp Card Programs",
          "WhatsApp Order Notifications",
          "Multi-Language Menus with RTL Arabic Support",
          "Staff Management with Role-Based Access",
          "Promotions, Coupons & Daily Specials",
          "Restaurant Directory & SEO Profiles",
          "Inventory & Stock Management",
          "Menu Scheduling (weekly calendar)",
          "PWA (Progressive Web App) Support",
          "Social Sharing (WhatsApp, Facebook, X)",
          "Allergen Filters & Dietary Tags",
          "Print-Ready QR Templates (10 designs)",
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          reviewCount: "156",
          bestRating: "5",
        },
        screenshot: `${appUrl}/images/landing/hero-mockup.png`,
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is FeastQR?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FeastQR is Morocco's leading zero-commission restaurant technology platform. It provides QR digital menus, online ordering (dine-in, pickup, delivery), AI-powered menu import and translation, delivery driver management, analytics dashboards, and loyalty programs. Over 2000 restaurants across Casablanca, Marrakech, Rabat, and other Moroccan cities use FeastQR.",
            },
          },
          {
            "@type": "Question",
            name: "How much does FeastQR cost?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FeastQR offers a free plan with 1 menu, 6 templates, QR codes, basic analytics, and online ordering. The Pro plan at 299 MAD/month unlocks unlimited menus, 30+ templates, AI menu builder, delivery network management, full analytics, staff management, and priority support. Unlike Glovo (30% commission), FeastQR charges zero commission on all orders.",
            },
          },
          {
            "@type": "Question",
            name: "How is FeastQR different from Glovo or Jumia Food?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FeastQR charges zero commission on orders (vs Glovo's 30%). Restaurants keep 100% of their revenue and manage their own delivery drivers directly. FeastQR also provides QR menus, AI content tools, and multilingual support (English, French, Arabic) — features not available on traditional delivery platforms.",
            },
          },
          {
            "@type": "Question",
            name: "Does FeastQR support Arabic menus with RTL layout?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. FeastQR fully supports English, French, and Arabic with proper right-to-left (RTL) layout, the Noto Sans Arabic font, and AI-powered auto-translation. Restaurants can offer their complete menu in all three languages simultaneously.",
            },
          },
          {
            "@type": "Question",
            name: "Can I import my existing menu into FeastQR?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. FeastQR's AI Menu Builder can import menus from photos or PDF files using Google Gemini, OpenAI GPT-4o, or Anthropic Claude. Simply upload an image of your menu and AI extracts all dishes, descriptions, categories, and prices into an editable format. You can review and edit before publishing.",
            },
          },
          {
            "@type": "Question",
            name: "Which cities does FeastQR serve in Morocco?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FeastQR operates in all major Moroccan cities including Casablanca (850+ restaurants), Marrakech (620+ restaurants), Rabat (420+ restaurants), Fes (380+ restaurants), Tangier (350+ restaurants), Agadir (280+ restaurants), Meknes (250+ restaurants), Oujda (180+ restaurants), and Kenitra (200+ restaurants). The platform works anywhere with an internet connection.",
            },
          },
          {
            "@type": "Question",
            name: "Can I manage my own delivery drivers with FeastQR?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. FeastQR's delivery network lets restaurants recruit, approve, and manage their own drivers directly. Features include smart auto-dispatch algorithms, driver location tracking, delivery zone management, and driver performance scoring. Drivers keep 100% of their delivery fees with zero platform commission.",
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
