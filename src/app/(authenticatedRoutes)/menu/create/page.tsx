import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Menu",
  description: "Create a new restaurant menu with Diyafa.",
  robots: { index: false },
};

const CreateMenuPage = nextDynamic(
  () => import("~/pageComponents/CreateMenu/CreateMenu.page").then((mod) => ({ default: mod.CreateMenuPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <CreateMenuPage />;
}
