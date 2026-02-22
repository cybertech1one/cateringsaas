import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading/Loading";
import { getAppUrl } from "~/utils/getBaseUrl";

export const dynamic = "force-dynamic";

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Explore Restaurants in Morocco - FeastQR Directory",
  description:
    "Discover 2000+ restaurants across Morocco on FeastQR. Browse by city (Casablanca, Marrakech, Rabat, Fes, Tangier), cuisine type, and ratings. View digital menus, order online, and find the best food near you.",
  alternates: {
    canonical: `${appUrl}/explore`,
  },
  keywords: [
    "restaurants Morocco",
    "best restaurants Casablanca",
    "restaurants Marrakech",
    "food near me Morocco",
    "restaurant directory Morocco",
    "مطاعم المغرب",
    "restaurants Maroc",
  ],
  openGraph: {
    title: "Explore 2000+ Restaurants in Morocco - FeastQR",
    description:
      "Browse restaurants by city, cuisine, and ratings. Casablanca, Marrakech, Rabat, Fes, Tangier & more. View menus and order online.",
    url: `${appUrl}/explore`,
    siteName: "FeastQR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Restaurants in Morocco - FeastQR",
    description:
      "2000+ restaurants across 9 Moroccan cities. Browse menus, view ratings, order online.",
  },
};

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
          name: "Explore Restaurants",
          item: `${appUrl}/explore`,
        },
      ],
    },
    {
      "@type": "CollectionPage",
      name: "Explore Restaurants",
      description:
        "Discover the best restaurants in Morocco. Browse by city, cuisine, and more.",
      url: `${appUrl}/explore`,
      isPartOf: {
        "@type": "WebSite",
        name: "FeastQR",
        url: appUrl,
      },
      about: {
        "@type": "Country",
        name: "Morocco",
      },
    },
  ],
};

const ExplorePage = nextDynamic(
  () =>
    import("~/pageComponents/Explore/Explore.page").then((mod) => ({
      default: mod.ExplorePage,
    })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExplorePage />
    </>
  );
}
