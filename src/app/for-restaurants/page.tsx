import { type Metadata } from "next";
import { getAppUrl } from "~/utils/getBaseUrl";

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "For Restaurants - FeastQR | Digital Menus, Ordering & Delivery",
  description:
    "Create digital QR menus, accept online orders, manage deliveries — all zero commission. 2000+ restaurants in Morocco trust FeastQR. Free to start.",
  alternates: { canonical: `${appUrl}/for-restaurants` },
  keywords: [
    "restaurant QR menu Morocco",
    "digital menu Casablanca",
    "online ordering Morocco",
    "menu numérique Maroc",
    "FeastQR restaurant",
    "قائمة رقمية المغرب",
    "zero commission food delivery",
  ],
  openGraph: {
    title: "For Restaurants - FeastQR | Build Your Digital Menu",
    description:
      "Create beautiful QR menus, accept orders, manage your own delivery drivers. Zero commission. Free to start.",
    type: "website",
    url: `${appUrl}/for-restaurants`,
    siteName: "FeastQR",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeastQR for Restaurants — Zero Commission Platform",
    description:
      "2000+ restaurants use FeastQR. Digital menus, online ordering, AI tools, and your own delivery network.",
  },
};

function RestaurantsJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${appUrl}/for-restaurants`,
        url: `${appUrl}/for-restaurants`,
        name: "FeastQR for Restaurants — Digital Menus & Online Ordering",
        description:
          "Create QR menus, accept online orders, and manage delivery drivers. Zero commission platform trusted by 2000+ restaurants in Morocco.",
        isPartOf: { "@id": `${appUrl}/#website` },
        breadcrumb: { "@id": `${appUrl}/for-restaurants#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${appUrl}/for-restaurants#breadcrumb`,
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
        ],
      },
      {
        "@type": "SoftwareApplication",
        name: "FeastQR",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "All-in-one restaurant platform: QR menus, online ordering, delivery management, AI content generation, analytics, multi-language (EN/FR/AR), and loyalty programs.",
        offers: [
          {
            "@type": "Offer",
            name: "Free Plan",
            price: "0",
            priceCurrency: "MAD",
            description:
              "1 menu, 6 templates, basic analytics, QR codes, online ordering",
          },
          {
            "@type": "Offer",
            name: "Pro Plan",
            price: "299",
            priceCurrency: "MAD",
            description:
              "Unlimited menus, 30 templates, AI menu builder, delivery network, full analytics, priority support",
          },
        ],
        featureList: [
          "QR Code Digital Menus",
          "Online Ordering (dine-in, pickup, delivery)",
          "Delivery Driver Network Management",
          "AI Menu Builder (photo/PDF import)",
          "Multi-Language Support (English, French, Arabic RTL)",
          "Analytics Dashboard",
          "Kitchen Display System",
          "Loyalty Stamp Cards",
          "WhatsApp Order Notifications",
          "30 Menu Templates",
          "Revenue Analytics",
          "Staff Management",
          "Promotions & Coupons",
          "SEO-Optimized Restaurant Profile",
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          reviewCount: "156",
          bestRating: "5",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How much does FeastQR cost for restaurants?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FeastQR offers a free plan with 1 menu, 6 templates, and basic analytics. The Pro plan at 299 MAD/month unlocks unlimited menus, 30 templates, AI menu builder, delivery network management, and full analytics.",
            },
          },
          {
            "@type": "Question",
            name: "Does FeastQR take a commission on orders?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. FeastQR charges zero commission on orders. Unlike Glovo (30% commission) or Jumia Food, FeastQR uses a flat subscription model. You keep 100% of your order revenue.",
            },
          },
          {
            "@type": "Question",
            name: "Can I manage my own delivery drivers with FeastQR?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. FeastQR's delivery network lets you recruit, approve, and manage your own drivers. You set delivery fees, control driver assignments, and use smart auto-dispatch algorithms — without paying platform commissions.",
            },
          },
          {
            "@type": "Question",
            name: "Does FeastQR support Arabic menus with RTL?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. FeastQR fully supports English, French, and Arabic with proper right-to-left (RTL) layout. You can offer your menu in all three languages simultaneously with AI-powered auto-translation.",
            },
          },
          {
            "@type": "Question",
            name: "How do I import my existing menu into FeastQR?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FeastQR's AI Menu Builder can import menus from photos or PDF files. Simply upload a picture of your menu and AI will extract all dishes, descriptions, and prices into an editable format.",
            },
          },
          {
            "@type": "Question",
            name: "Which cities does FeastQR operate in?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "FeastQR is available in all Moroccan cities including Casablanca, Marrakech, Rabat, Fes, Tangier, Agadir, Meknes, Oujda, and Kenitra. The platform works anywhere with an internet connection.",
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

export default async function ForRestaurantsRoute() {
  const { ForRestaurantsPage } = await import(
    "~/pageComponents/ForRestaurants/ForRestaurants.page"
  );

  return (
    <>
      <RestaurantsJsonLd />
      <ForRestaurantsPage />
    </>
  );
}
