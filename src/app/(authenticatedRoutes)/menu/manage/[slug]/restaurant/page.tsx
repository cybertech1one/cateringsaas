import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Restaurant Settings",
  robots: { index: false },
};

// Lazy-load the RestaurantDashboard page component to reduce First Load JS
// This route pulls in qrcode.react and several form-heavy sub-components
const RestaurantDashboard = nextDynamic(
  () => import("~/pageComponents/RestaurantDashboard/RestaurantDashboard.page").then((mod) => ({ default: mod.RestaurantDashboard })),
  { loading: () => <LoadingScreen /> },
);

export default function Page(props: { params: { slug: string } }) {
  return <RestaurantDashboard {...props} />;
}
