export type MoroccoCity = {
  slug: string;
  name: string;
  nameAr: string;
  nameFr: string;
  population: number;
  avgEarnings: string;
  restaurantCount: number;
  driverCount: number;
  lat: number;
  lng: number;
  /** Top cuisines popular in this city */
  cuisines: string[];
  /** Brief description for SEO */
  description: string;
};

export const MOROCCO_CITIES: MoroccoCity[] = [
  {
    slug: "casablanca",
    name: "Casablanca",
    nameAr: "\u0627\u0644\u062f\u0627\u0631 \u0627\u0644\u0628\u064a\u0636\u0627\u0621",
    nameFr: "Casablanca",
    population: 3_700_000,
    avgEarnings: "350-600",
    restaurantCount: 850,
    driverCount: 200,
    lat: 33.5731,
    lng: -7.5898,
    cuisines: ["Moroccan", "Seafood", "French", "Lebanese", "Italian"],
    description:
      "Morocco's economic capital and largest city, known for its vibrant food scene spanning traditional Moroccan cuisine to international flavors along the Corniche.",
  },
  {
    slug: "marrakech",
    name: "Marrakech",
    nameAr: "\u0645\u0631\u0627\u0643\u0634",
    nameFr: "Marrakech",
    population: 930_000,
    avgEarnings: "300-500",
    restaurantCount: 620,
    driverCount: 150,
    lat: 31.6295,
    lng: -7.9811,
    cuisines: ["Moroccan", "Riad Dining", "Street Food", "French", "Mediterranean"],
    description:
      "The Red City, a UNESCO-listed medina with world-famous Jemaa el-Fna food stalls, rooftop riads, and a growing modern dining scene in Gueliz.",
  },
  {
    slug: "rabat",
    name: "Rabat",
    nameAr: "\u0627\u0644\u0631\u0628\u0627\u0637",
    nameFr: "Rabat",
    population: 580_000,
    avgEarnings: "280-450",
    restaurantCount: 420,
    driverCount: 120,
    lat: 34.0209,
    lng: -6.8416,
    cuisines: ["Moroccan", "French", "Seafood", "Asian", "Cafe Culture"],
    description:
      "Morocco's capital city, blending modern governance district dining with the historic Kasbah des Oudaias and the vibrant Agdal neighborhood food scene.",
  },
  {
    slug: "fes",
    name: "Fes",
    nameAr: "\u0641\u0627\u0633",
    nameFr: "F\u00e8s",
    population: 1_150_000,
    avgEarnings: "250-400",
    restaurantCount: 380,
    driverCount: 90,
    lat: 34.0181,
    lng: -5.0078,
    cuisines: ["Moroccan", "Fassi Cuisine", "Pastilla", "Street Food", "Traditional"],
    description:
      "The spiritual capital of Morocco, home to the world's oldest university and legendary Fassi cuisine including pastilla, rfissa, and slow-cooked tanjia.",
  },
  {
    slug: "tangier",
    name: "Tangier",
    nameAr: "\u0637\u0646\u062c\u0629",
    nameFr: "Tanger",
    population: 950_000,
    avgEarnings: "270-430",
    restaurantCount: 350,
    driverCount: 80,
    lat: 35.7595,
    lng: -5.834,
    cuisines: ["Moroccan", "Spanish", "Seafood", "Mediterranean", "International"],
    description:
      "Gateway between Africa and Europe, Tangier's food scene blends Moroccan and Spanish influences with fresh Mediterranean seafood along the Strait of Gibraltar.",
  },
  {
    slug: "agadir",
    name: "Agadir",
    nameAr: "\u0623\u0643\u0627\u062f\u064a\u0631",
    nameFr: "Agadir",
    population: 420_000,
    avgEarnings: "260-400",
    restaurantCount: 280,
    driverCount: 70,
    lat: 30.4278,
    lng: -9.5981,
    cuisines: ["Seafood", "Moroccan", "Amazigh", "Beach Dining", "International"],
    description:
      "Morocco's premier beach resort city, famous for the freshest Atlantic seafood, argan oil cuisine, and the bustling Souk El Had market.",
  },
  {
    slug: "meknes",
    name: "Meknes",
    nameAr: "\u0645\u0643\u0646\u0627\u0633",
    nameFr: "Mekn\u00e8s",
    population: 630_000,
    avgEarnings: "230-370",
    restaurantCount: 250,
    driverCount: 60,
    lat: 33.8731,
    lng: -5.5407,
    cuisines: ["Moroccan", "Olive Oil Cuisine", "Traditional", "Street Food", "Wine Region"],
    description:
      "An imperial city surrounded by fertile plains and olive groves, Meknes is renowned for its traditional Moroccan cooking, local olive oil, and the nearby Volubilis ruins.",
  },
  {
    slug: "oujda",
    name: "Oujda",
    nameAr: "\u0648\u062c\u062f\u0629",
    nameFr: "Oujda",
    population: 410_000,
    avgEarnings: "220-350",
    restaurantCount: 180,
    driverCount: 45,
    lat: 34.6814,
    lng: -1.9086,
    cuisines: ["Moroccan", "Algerian-influenced", "Berkoukes", "Grilled Meats", "Traditional"],
    description:
      "Eastern Morocco's cultural hub near the Algerian border, known for unique cross-border culinary influences, berkoukes, and the aromatic ras el hanout spice blends.",
  },
  {
    slug: "kenitra",
    name: "Kenitra",
    nameAr: "\u0627\u0644\u0642\u0646\u064a\u0637\u0631\u0629",
    nameFr: "K\u00e9nitra",
    population: 430_000,
    avgEarnings: "240-380",
    restaurantCount: 200,
    driverCount: 55,
    lat: 34.261,
    lng: -6.5802,
    cuisines: ["Moroccan", "Seafood", "River Fish", "Traditional", "Fast Food"],
    description:
      "A growing Atlantic port city on the Sebou River, Kenitra combines traditional Moroccan river-fish cuisine with a rapidly expanding modern food delivery market.",
  },
];

/** Look up a city by its URL slug. Returns undefined if not found. */
export function getCityBySlug(slug: string): MoroccoCity | undefined {
  return MOROCCO_CITIES.find((c) => c.slug === slug);
}

/** Get all city slugs for generateStaticParams */
export function getAllCitySlugs(): { city: string }[] {
  return MOROCCO_CITIES.map((c) => ({ city: c.slug }));
}
