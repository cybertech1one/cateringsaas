import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu Schedule",
  robots: { index: false },
};

const MenuSchedulePage = nextDynamic(
  () =>
    import("~/pageComponents/MenuSchedule/MenuSchedule.page").then((mod) => ({
      default: mod.MenuSchedulePage,
    })),
  { loading: () => <LoadingScreen /> },
);

export default function SchedulePage() {
  return <MenuSchedulePage />;
}
