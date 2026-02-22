import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Menu",
  robots: { index: false },
};

const EditMenuPage = nextDynamic(
  () => import("~/pageComponents/EditMenu/EditMenu.page").then((mod) => ({ default: mod.EditMenuPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <EditMenuPage />;
}
