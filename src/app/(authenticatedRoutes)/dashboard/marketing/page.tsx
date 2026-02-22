import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Marketing",
  description: "Create marketing campaigns and coupon codes to grow your restaurant.",
};

const MarketingPage = nextDynamic(
  () => import("~/pageComponents/Marketing/Marketing.page").then((mod) => ({ default: mod.MarketingPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <MarketingPage />;
}
