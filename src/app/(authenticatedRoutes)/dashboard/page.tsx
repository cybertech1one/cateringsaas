import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your restaurant menus, track orders, and grow your business with Diyafa.",
};

// Lazy-load the Dashboard page component - it includes MenuItem cards
// with MenuOperations (QRCodeDialog, ExportMenuDialog) and lucide icons
const DashboardPage = nextDynamic(
  () => import("~/pageComponents/Dashboard/Dashboard.page").then((mod) => ({ default: mod.DashboardPage })),
  { loading: () => <LoadingScreen /> },
);

export default function DashboardPageRoute() {
  return <DashboardPage />;
}
