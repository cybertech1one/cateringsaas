import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Reviews",
  description: "Monitor and respond to customer reviews.",
};

const ReviewsPage = nextDynamic(
  () => import("~/pageComponents/Reviews/Reviews.page").then((mod) => ({ default: mod.ReviewsPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <ReviewsPage />;
}
