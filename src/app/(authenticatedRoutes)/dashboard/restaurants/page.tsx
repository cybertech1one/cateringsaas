import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "My Restaurants",
  description: "Manage your restaurant locations and settings.",
};

const RestaurantsPage = nextDynamic(
  () => import("~/pageComponents/Restaurants/Restaurants.page").then((mod) => ({ default: mod.RestaurantsPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <RestaurantsPage />;
}
