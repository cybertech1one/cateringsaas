import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Kitchen Display",
  description: "Real-time kitchen display system for managing active orders.",
};

const KitchenPage = nextDynamic(
  () => import("~/pageComponents/Kitchen/Kitchen.page").then((mod) => ({ default: mod.KitchenPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Kitchen() {
  return <KitchenPage />;
}
