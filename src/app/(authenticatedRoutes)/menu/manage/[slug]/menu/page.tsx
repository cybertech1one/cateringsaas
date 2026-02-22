import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu Editor",
  robots: { index: false },
};

// Lazy-load the entire MenuCreator page component to reduce First Load JS
// This is the heaviest route in the app (325 kB) with many sub-components
const MenuCreatorPage = nextDynamic(
  () => import("~/pageComponents/MenuCreator/MenuCreator.page").then((mod) => ({ default: mod.MenuCreatorPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page({ params }: { params: { slug: string } }) {
  return <MenuCreatorPage params={params} />;
}
