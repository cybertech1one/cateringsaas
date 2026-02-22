import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Catering | Diyafa",
  description: "Create and manage catering menus, packages, and event inquiries.",
};

const CateringDashboard = nextDynamic(
  () => import("~/pageComponents/CateringDashboard/CateringDashboard.page").then((mod) => ({ default: mod.CateringDashboardPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <CateringDashboard />;
}
