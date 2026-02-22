import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Promotions",
  description: "Create daily specials, happy hours, and seasonal promotions.",
};

const PromotionsPage = nextDynamic(
  () => import("~/pageComponents/Promotions/Promotions.page").then((mod) => ({ default: mod.PromotionsPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <PromotionsPage />;
}
