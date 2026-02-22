import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Theme Designer",
  robots: { index: false },
};

// Lazy-load the ThemeEditor page - it includes color pickers, font selectors,
// layout controls, and a live preview panel with heavy dependencies
const ThemeEditorPage = nextDynamic(
  () => import("~/pageComponents/ThemeEditor/ThemeEditor.page").then((mod) => ({ default: mod.ThemeEditorPage })),
  { loading: () => <LoadingScreen /> },
);

export default function DesignPage() {
  return <ThemeEditorPage />;
}
