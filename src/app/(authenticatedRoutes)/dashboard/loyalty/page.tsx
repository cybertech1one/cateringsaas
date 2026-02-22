import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Loyalty | Diyafa",
  description: "Create and manage customer loyalty stamp card programs.",
};

const LoyaltyPage = nextDynamic(
  () => import("~/pageComponents/Loyalty/Loyalty.page").then((mod) => ({ default: mod.LoyaltyPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <LoyaltyPage />;
}
