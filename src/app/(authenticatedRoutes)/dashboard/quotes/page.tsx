"use client";

import dynamic from "next/dynamic";

const QuotesManagement = dynamic(
  () => import("~/pageComponents/QuotesManagement/QuotesManagement.page"),
  { ssr: false }
);

export default function QuotesPage() {
  return <QuotesManagement />;
}
