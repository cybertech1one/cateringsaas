import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Affiliates",
  description: "Earn rewards by referring other restaurants to FeastQR.",
};

const AffiliatesPage = nextDynamic(
  () =>
    import("~/pageComponents/Affiliates/Affiliates.page").then((mod) => ({
      default: mod.AffiliatesPage,
    })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <AffiliatesPage />;
}
