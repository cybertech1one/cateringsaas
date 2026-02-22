import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Driver Dashboard",
  description:
    "View your earnings, manage availability, and track your deliveries.",
};

const DriverDashboardPage = nextDynamic(
  () =>
    import(
      "~/pageComponents/DriverDashboard/DriverDashboard.page"
    ).then((mod) => ({ default: mod.DriverDashboardPage })),
  { loading: () => <LoadingScreen /> },
);

export default function DriverPage() {
  return <DriverDashboardPage />;
}
