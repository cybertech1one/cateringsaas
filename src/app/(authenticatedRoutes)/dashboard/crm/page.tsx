import { type Metadata } from "next";
import nextDynamic from "next/dynamic";
import { LoadingScreen } from "~/components/Loading";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "CRM Integration",
  description: "Connect your restaurant data to Twenty CRM for customer management.",
};

const CRMPage = nextDynamic(
  () => import("~/pageComponents/CRM/CRM.page").then((mod) => ({ default: mod.CRMPage })),
  { loading: () => <LoadingScreen /> },
);

export default function Page() {
  return <CRMPage />;
}
