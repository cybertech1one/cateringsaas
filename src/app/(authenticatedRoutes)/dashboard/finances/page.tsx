"use client";

import dynamic from "next/dynamic";

const FinancesDashboard = dynamic(
  () => import("~/pageComponents/FinancesDashboard/FinancesDashboard.page"),
  { ssr: false }
);

export default function FinancesPage() {
  return <FinancesDashboard />;
}
