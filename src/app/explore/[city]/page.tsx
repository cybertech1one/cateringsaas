import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading/Loading";
import { api } from "~/trpc/server";
import { getAppUrl } from "~/utils/getBaseUrl";
import { getCityBySlug } from "~/data/moroccoCities";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { city: string };
}): Promise<Metadata> {
  const appUrl = getAppUrl();
  const city = await api.directory.getCityBySlug
    .query({ slug: params.city })
    .catch(() => null);
  const staticCity = getCityBySlug(params.city);

  const cityName = city?.name ?? staticCity?.name ?? "City";
  const restaurantCount = city?._count?.menus ?? 0;
  const title = `Restaurants in ${cityName} - Diyafa | Browse Menus & Order`;
  const description = city?.description ??
    (restaurantCount > 0
      ? `Discover ${restaurantCount} restaurants in ${cityName}. Browse digital menus, read reviews, order online, and find your next meal on Diyafa.`
      : `Discover the best restaurants in ${cityName}. Browse digital menus, read reviews, order online, and find your next meal on Diyafa.`);

  return {
    title,
    description,
    alternates: {
      canonical: `${appUrl}/explore/${params.city}`,
    },
    openGraph: {
      title,
      description,
      url: `${appUrl}/explore/${params.city}`,
      siteName: "Diyafa",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Restaurants in ${cityName} - Diyafa`,
      description,
    },
  };
}

const CityPage = nextDynamic(
  () =>
    import("~/pageComponents/Explore/City.page").then((mod) => ({
      default: mod.CityPage,
    })),
  { loading: () => <LoadingScreen /> },
);

export default async function Page({ params }: { params: { city: string } }) {
  const appUrl = getAppUrl();
  const city = await api.directory.getCityBySlug
    .query({ slug: params.city })
    .catch(() => null);
  const staticCity = getCityBySlug(params.city);

  const cityName = city?.name ?? staticCity?.name ?? params.city;
  const restaurantCount = city?._count?.menus ?? 0;
  const cityLat = city?.latitude ?? staticCity?.lat;
  const cityLng = city?.longitude ?? staticCity?.lng;

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
          {
            "@type": "ListItem",
            position: 3,
            name: cityName,
            item: `${appUrl}/explore/${params.city}`,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `Restaurants in ${cityName}`,
        description:
          city?.description ??
          staticCity?.description ??
          `Browse ${restaurantCount} restaurants with digital menus in ${cityName}.`,
        url: `${appUrl}/explore/${params.city}`,
        isPartOf: {
          "@type": "WebSite",
          name: "Diyafa",
          url: appUrl,
        },
        about: {
          "@type": "City",
          name: cityName,
          ...(cityLat && cityLng
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: cityLat,
                  longitude: cityLng,
                },
              }
            : {}),
          containedInPlace: city?.region
            ? {
                "@type": "AdministrativeArea",
                name: city.region.name,
              }
            : undefined,
        },
        ...(restaurantCount > 0
          ? { numberOfItems: restaurantCount }
          : {}),
      },
      {
        "@type": "ItemList",
        name: `Top Restaurants in ${cityName}`,
        description: `Browse the best restaurants with digital menus in ${cityName}, Morocco.`,
        url: `${appUrl}/explore/${params.city}`,
        numberOfItems: restaurantCount,
        itemListOrder: "https://schema.org/ItemListUnordered",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CityPage citySlug={params.city} />
    </>
  );
}
