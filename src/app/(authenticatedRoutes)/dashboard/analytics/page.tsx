import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Analytics",
  description: "Track restaurant performance with revenue analytics, peak hours, and customer insights.",
};

const AnalyticsPage = nextDynamic(
  () => import("~/pageComponents/Analytics/Analytics.page").then((mod) => ({ default: mod.AnalyticsPage })),
  { loading: () => <LoadingScreen /> },
);

export default function AnalyticsDashboardPage() {
  return <AnalyticsPage />;
}
