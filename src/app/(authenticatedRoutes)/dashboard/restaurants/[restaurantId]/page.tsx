import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Restaurant Details",
};

const RestaurantDetailPage = nextDynamic(
  () => import("~/pageComponents/Restaurants/RestaurantDetail.page").then((mod) => ({ default: mod.RestaurantDetailPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <RestaurantDetailPage />;
}
